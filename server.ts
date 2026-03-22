import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import fs from "fs";
import http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_PORT = 8080;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // 静态文件目录
  const publicDir = path.join(__dirname, "public");
  const uploadsDir = path.join(publicDir, "uploads");
  const fontsDir = path.join(publicDir, "fonts");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });
  app.use("/uploads", express.static(uploadsDir));
  app.use("/fonts", express.static(fontsDir));

  // 代理 /api 到 Go 后端 :8080
  app.use("/api", (req, res) => {
    const options: http.RequestOptions = {
      hostname: "localhost",
      port: API_PORT,
      path: `/api${req.path}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${API_PORT}` },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      // 如果响应已经结束，不再处理
      if (res.writableEnded) return;
      
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    });

    // 处理代理请求本身的错误（如连接被拒绝）
    proxyReq.on("error", (err) => {
      console.error("Proxy request error:", err.message);
      if (!res.headersSent && !res.writableEnded) {
        res.status(502).json({ error: "Bad gateway", message: err.message });
      }
    });

    // 处理代理响应结束事件
    proxyReq.on("response", (proxyRes) => {
      proxyRes.on("error", (err) => {
        console.error("Proxy response error:", err.message);
        if (!res.headersSent && !res.writableEnded) {
          res.status(502).json({ error: "Bad gateway", message: err.message });
        }
      });
    });

    req.pipe(proxyReq);
  });

  // Vite 开发服务器
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Proxying /api → http://localhost:${API_PORT}`);
  });
}

startServer();
