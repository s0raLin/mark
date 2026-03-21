import electron from 'electron';
import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import {spawn, ChildProcess} from 'child_process';
import http from 'http';

const { app, BrowserWindow } = electron;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 端口配置
const FRONTEND_PORT = 5173;
const API_PORT = 8080;

// 创建前端服务器
const frontendServer = express();

// 解析 JSON
frontendServer.use(express.json());

// 代理 API 请求到 Go 后端
frontendServer.use('/api', (req, res) => {
  const apiPath = `/api${req.path}`;
  console.log(`Proxying ${req.method} ${apiPath}`);
  
  const options = {
    hostname: 'localhost',
    port: API_PORT,
    path: apiPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${API_PORT}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        res.status(proxyRes.statusCode || 200).json(parsed);
      } catch {
        res.status(proxyRes.statusCode || 200).send(data);
      }
    });
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.status(502).json({ code: -1, message: err.message, data: null });
  });
  
  proxyReq.on('timeout', () => {
    console.error('Proxy timeout');
    proxyReq.destroy();
    res.status(504).json({ code: -1, message: 'Gateway timeout', data: null });
  });
  
  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  proxyReq.end();
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
    goServer = spawn('go', ['run', '.'], {cwd: goSrcPath});
    
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
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
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
