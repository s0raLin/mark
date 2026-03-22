import electron from 'electron';
import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import {spawn, ChildProcess} from 'child_process';
import http from 'http';

const { app, BrowserWindow, ipcMain } = electron;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 端口配置
const FRONTEND_PORT = 5173;
const API_PORT = process.env.API_PORT || 8080;

// 创建前端服务器
const frontendServer = express();

// 解析 JSON（仅用于非代理路由，代理路由直接 pipe 原始 body）
// frontendServer.use(express.json());

// 代理 API 请求到 Go 后端
frontendServer.use('/api', (req, res) => {
  const apiPath = `/api${req.path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
  console.log(`Proxying ${req.method} ${apiPath}`);
  
  // 不覆盖 Content-Type，保留原始请求头（multipart/form-data 需要 boundary）
  const headers = { ...req.headers, host: `localhost:${API_PORT}` };
  
  const options = {
    hostname: 'localhost',
    port: API_PORT,
    path: apiPath,
    method: req.method,
    headers,
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    if (res.writableEnded) return;
    res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err.message);
    if (!res.headersSent && !res.writableEnded) {
      res.status(502).json({ code: -1, message: err.message, data: null });
    }
  });
  
  // 直接 pipe 原始请求体，不做任何解析或重写
  req.pipe(proxyReq);
});

// 静态文件
frontendServer.use(express.static(path.join(__dirname, 'dist')));
frontendServer.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

let goServer: ChildProcess | null = null;

function startGoServer(): Promise<void> {
  return new Promise((resolve) => {
    const goSrcPath = path.join(__dirname, 'server', 'cmd', 'server');
    
    console.log('Starting Go server with go run...');
    
    // Pass PORT environment variable to Go server
    const env = { ...process.env, PORT: API_PORT.toString() };
    goServer = spawn('go', ['run', '.'], {cwd: goSrcPath, env});
    
    goServer.stdout?.on('data', (data: Buffer) => {
      console.log(`Go: ${data.toString().trim()}`);
    });
    
    goServer.stderr?.on('data', (data: Buffer) => {
      console.log(`Go: ${data.toString().trim()}`);
    });
    
    // 给 Go 服务器时间启动
    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

async function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    // 窗口控制 IPC 处理
    win.on('maximize', () => {
        win.webContents.send('window-maximized', true);
    });
    
    win.on('unmaximize', () => {
        win.webContents.send('window-maximized', false);
    });

    // 加载前端
    win.loadURL(`http://localhost:${FRONTEND_PORT}`);
    
    // 打开开发者工具
    win.webContents.openDevTools();
    
    // 监听页面错误
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`Failed to load: ${errorCode} - ${errorDescription}`);
    });
}

app.whenReady().then(async () => {
    console.log('Starting services...');
    
    // 窗口控制 IPC 处理器
    ipcMain.on('window-minimize', () => {
        BrowserWindow.getFocusedWindow()?.minimize();
    });
    
    ipcMain.on('window-maximize', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win?.isMaximized()) {
            win.unmaximize();
        } else {
            win?.maximize();
        }
    });
    
    ipcMain.on('window-close', () => {
        BrowserWindow.getFocusedWindow()?.close();
    });
    
    // 尝试启动 Go API 服务器
    await startGoServer();
    
    // 启动前端服务器
    frontendServer.listen(FRONTEND_PORT, () => {
        console.log(`Frontend: http://localhost:${FRONTEND_PORT}`);
        console.log(`API: http://localhost:${API_PORT}`);
        createWindow();
    });
});

app.on('window-all-closed', () => {
    if (goServer) {
        goServer.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (goServer) {
        goServer.kill();
    }
});
