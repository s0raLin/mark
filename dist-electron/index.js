import electron from 'electron';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import http from 'http';
const { app, BrowserWindow, ipcMain } = electron;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isPackaged = app.isPackaged;
const FRONTEND_PORT = 5173;
const API_PORT = process.env.API_PORT || 8080;
// ── 通用代理函数（直接 pipe，不解析 body）──────────────────
function proxyToGo(req, res, targetPath) {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const options = {
        hostname: 'localhost',
        port: API_PORT,
        path: targetPath + query,
        method: req.method,
        headers: { ...req.headers, host: `localhost:${API_PORT}` },
    };
    const proxyReq = http.request(options, (proxyRes) => {
        if (res.writableEnded)
            return;
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err.message);
        if (!res.headersSent && !res.writableEnded) {
            res.status(502).json({ code: -1, message: err.message, data: null });
        }
    });
    req.pipe(proxyReq);
}
// ── 构建 Express 服务器 ────────────────────────────────────
function buildServer(distPath) {
    const server = express();
    // 注意：不使用任何 body parser 中间件，保持请求体原始流
    server.use('/uploads', (req, res) => {
        proxyToGo(req, res, `/uploads${req.path}`);
    });
    server.use('/api', (req, res) => {
        const apiPath = `/api${req.path}`;
        console.log(`Proxying ${req.method} ${apiPath}`);
        proxyToGo(req, res, apiPath);
    });
    server.use(express.static(distPath));
    server.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
    return server;
}
// ── Go 服务器启动 ──────────────────────────────────────────
let goServer = null;
function startGoServer() {
    return new Promise((resolve) => {
        const goServerPath = isPackaged
            ? path.join(process.resourcesPath, 'server')
            : path.join(__dirname, '..', 'server', 'cmd', 'server');
        console.log('Starting Go server from:', goServerPath);
        const env = { ...process.env, PORT: String(API_PORT) };
        const serverBinary = path.join(goServerPath, 'server');
        goServer = spawn(serverBinary, [], { cwd: goServerPath, env });
        goServer.on('error', () => {
            console.log('Binary not found, falling back to go run...');
            goServer = spawn('go', ['run', '.'], { cwd: goServerPath, env });
            goServer.stdout?.on('data', (d) => console.log(`Go: ${d.toString().trim()}`));
            goServer.stderr?.on('data', (d) => console.log(`Go: ${d.toString().trim()}`));
        });
        goServer.stdout?.on('data', (d) => console.log(`Go: ${d.toString().trim()}`));
        goServer.stderr?.on('data', (d) => console.log(`Go: ${d.toString().trim()}`));
        setTimeout(resolve, 3000);
    });
}
// ── 创建窗口 ───────────────────────────────────────────────
async function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    win.on('maximize', () => win.webContents.send('window-maximized', true));
    win.on('unmaximize', () => win.webContents.send('window-maximized', false));
    win.loadURL(`http://localhost:${FRONTEND_PORT}`);
    if (isPackaged) {
        // 生产模式：禁用 DevTools 及相关快捷键
        win.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'F12' ||
                (input.control && input.shift && (input.key === 'I' || input.key === 'J')) ||
                (input.control && input.key === 'U')) {
                event.preventDefault();
            }
        });
    }
    else {
        win.webContents.openDevTools();
    }
    win.webContents.on('did-fail-load', (_e, code, desc) => {
        console.error(`Failed to load: ${code} - ${desc}`);
    });
}
// ── 主流程 ─────────────────────────────────────────────────
app.whenReady().then(async () => {
    ipcMain.on('window-minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
    ipcMain.on('window-maximize', () => {
        const win = BrowserWindow.getFocusedWindow();
        win?.isMaximized() ? win.unmaximize() : win?.maximize();
    });
    ipcMain.on('window-close', () => BrowserWindow.getFocusedWindow()?.close());
    ipcMain.on('window-move', (_e, { x, y }) => {
        BrowserWindow.getFocusedWindow()?.setPosition(x, y);
    });
    ipcMain.handle('get-window-pos', () => {
        return BrowserWindow.getFocusedWindow()?.getPosition() ?? [0, 0];
    });
    await startGoServer();
    // 生产模式 dist 在 dist-electron 的上一级；开发模式在项目根
    const distPath = isPackaged
        ? path.join(__dirname, '..', 'dist')
        : path.join(__dirname, '..', 'dist');
    const server = buildServer(distPath);
    server.listen(FRONTEND_PORT, () => {
        console.log(`Frontend: http://localhost:${FRONTEND_PORT}`);
        console.log(`API proxy → http://localhost:${API_PORT}`);
        createWindow();
    });
});
app.on('window-all-closed', () => {
    goServer?.kill();
    if (process.platform !== 'darwin')
        app.quit();
});
app.on('before-quit', () => goServer?.kill());
//# sourceMappingURL=index.js.map