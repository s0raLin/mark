import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import cors from "cors";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage });

  // Ensure fonts directory exists
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  const fontStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fontsDir);
    },
    filename: (req, file, cb) => {
      // Preserve original name so @font-face src is predictable
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, safeName);
    },
  });
  const uploadFont = multer({
    storage: fontStorage,
    fileFilter: (req, file, cb) => {
      const allowed = [".ttf", ".woff", ".woff2", ".otf"];
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, allowed.includes(ext));
    },
  });

  // API routes
  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  });

  app.post("/api/upload-font", uploadFont.single("font"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No font file uploaded" });
    }
    const fontUrl = `/fonts/${req.file.filename}`;
    // Derive a font-family name from the filename (strip extension)
    const fontFamily = path.basename(req.file.originalname, path.extname(req.file.originalname))
      .replace(/[_-]+/g, " ")
      .trim();
    res.json({ url: fontUrl, fontFamily });
  });

  // Serve static uploads and fonts
  app.use("/uploads", express.static(uploadsDir));
  app.use("/fonts", express.static(fontsDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
