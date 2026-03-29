import electron from "electron";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { spawn, type ChildProcess } from "child_process";

const { app, BrowserWindow, ipcMain, shell } = electron;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRONTEND_PORT = 5173;
const API_PORT = process.env.API_PORT || 8080;

function proxyToBackend(
  req: express.Request,
  res: express.Response,
  targetPath: string,
) {
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const options: http.RequestOptions = {
    hostname: "localhost",
    port: API_PORT,
    path: targetPath + query,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${API_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    if (res.writableEnded) return;
    res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    if (!res.headersSent && !res.writableEnded) {
      res.status(502).json({ code: -1, message: err.message, data: null });
    }
  });

  req.pipe(proxyReq);
}

function createStaticServer(distPath: string) {
  const server = express();

  server.use("/uploads", (req, res) => {
    proxyToBackend(req, res, `/uploads${req.path}`);
  });

  server.use("/api", (req, res) => {
    proxyToBackend(req, res, `/api${req.path}`);
  });

  server.use(express.static(distPath));
  server.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  return server;
}

function resolveGoServerDirectory() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "server")
    : path.join(__dirname, "..", "server", "cmd", "server");
}

function createGoProcess(command: string, args: string[], cwd: string) {
  return spawn(command, args, {
    cwd,
    env: { ...process.env, PORT: String(API_PORT) },
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestBackend(pathname: string) {
  return new Promise<number>((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port: Number(API_PORT),
        path: pathname,
        method: "GET",
        timeout: 1500,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("timeout"));
    });
    request.on("error", reject);
    request.end();
  });
}

async function waitForBackendReady(timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const status = await requestBackend("/api/users/me/settings");
      if (status >= 200 && status < 500) {
        return;
      }
    } catch {
      // ignore transient startup failures
    }

    await wait(300);
  }

  throw new Error(`Backend did not become ready within ${timeoutMs}ms`);
}

function attachProcessLogs(processRef: ChildProcess, label: string) {
  processRef.stdout?.on("data", (data: Buffer) => {
    console.log(`${label}: ${data.toString().trim()}`);
  });
  processRef.stderr?.on("data", (data: Buffer) => {
    console.log(`${label}: ${data.toString().trim()}`);
  });
  processRef.on("exit", (code, signal) => {
    console.log(`${label}: exited with code=${code} signal=${signal}`);
  });
}

function startGoServer() {
  return new Promise<ChildProcess>((resolve) => {
    const serverDir = resolveGoServerDirectory();
    const binaryName = process.platform === "win32" ? "server.exe" : "server";
    const binaryPath = path.join(serverDir, binaryName);

    let backend = createGoProcess(binaryPath, [], serverDir);
    attachProcessLogs(backend, "Go");

    backend.on("error", () => {
      console.log("Go binary not found, falling back to `go run .`");
      backend = createGoProcess("go", ["run", "."], serverDir);
      attachProcessLogs(backend, "Go");
    });

    resolve(backend);
  });
}

function registerWindowIpcHandlers() {
  ipcMain.on("window-minimize", () => BrowserWindow.getFocusedWindow()?.minimize());
  ipcMain.on("window-maximize", () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.isMaximized() ? win.unmaximize() : win?.maximize();
  });
  ipcMain.on("window-close", () => BrowserWindow.getFocusedWindow()?.close());
  ipcMain.on("window-move", (_event, { x, y }: { x: number; y: number }) => {
    BrowserWindow.getFocusedWindow()?.setPosition(x, y);
  });
  ipcMain.handle("get-window-pos", () => {
    return BrowserWindow.getFocusedWindow()?.getPosition() ?? [0, 0];
  });
  ipcMain.on("open-external", (_event, url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
  });
  ipcMain.handle("list-system-fonts", async () => {
    return listSystemFonts();
  });
}

function collectCommandOutput(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });
  });
}

function uniqueSortedFonts(rawFonts: string[]) {
  return Array.from(
    new Set(
      rawFonts
        .flatMap((line) => line.split(","))
        .map((font) => font.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

async function listSystemFonts() {
  try {
    if (process.platform === "linux") {
      const output = await collectCommandOutput("fc-list", ["--format=%{family}\\n"]);
      return uniqueSortedFonts(output.split("\n"));
    }

    if (process.platform === "darwin") {
      const output = await collectCommandOutput("system_profiler", ["SPFontsDataType", "-json"]);
      const payload = JSON.parse(output) as {
        SPFontsDataType?: Array<{ family?: string }>;
      };
      return uniqueSortedFonts(
        (payload.SPFontsDataType ?? [])
          .map((entry) => entry.family ?? "")
          .filter(Boolean),
      );
    }

    if (process.platform === "win32") {
      const output = await collectCommandOutput("powershell", [
        "-NoProfile",
        "-Command",
        "Get-ChildItem \"$env:WINDIR\\Fonts\" | Select-Object -ExpandProperty BaseName",
      ]);
      return uniqueSortedFonts(output.split("\n"));
    }
  } catch (error) {
    console.error("Failed to list system fonts", error);
  }

  return [
    "Quicksand",
    "Playfair Display",
    "JetBrains Mono",
    "Fira Code",
    "Source Code Pro",
    "monospace",
  ];
}

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.on("maximize", () => win.webContents.send("window-maximized", true));
  win.on("unmaximize", () => win.webContents.send("window-maximized", false));

  await win.loadURL(`http://localhost:${FRONTEND_PORT}`);

  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }

  win.webContents.on("did-fail-load", (_event, code, desc) => {
    console.error(`Failed to load window: ${code} - ${desc}`);
  });
}

export async function runElectronApp() {
  let backendProcess: ChildProcess | null = null;

  app.whenReady().then(async () => {
    registerWindowIpcHandlers();
    backendProcess = await startGoServer();
    await waitForBackendReady().catch((error) => {
      console.error("Backend readiness check failed:", error);
    });

    const distPath = path.join(app.getAppPath(), "dist");
    const server = createStaticServer(distPath);
    server.listen(FRONTEND_PORT, () => {
      console.log(`Frontend: http://localhost:${FRONTEND_PORT}`);
      console.log(`API proxy: http://localhost:${API_PORT}`);
      void createMainWindow();
    });
  });

  app.on("window-all-closed", () => {
    backendProcess?.kill();
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => backendProcess?.kill());
}
