import showdown from "showdown";
import { hasTauriRuntime, saveDesktopBinaryFile, saveDesktopTextFile } from "@/api/client";

export type ExportFormat = "pdf" | "html" | "png" | "zip";
export type ExportPreset = "modern" | "ivory" | "terminal" | "academic";

export interface ExportArtifact {
  fileName: string;
  mimeType: string;
  blob?: Blob;
  text?: string;
}

interface ExportDocumentOptions {
  markdown: string;
  presetCss: string;
  customCss: string;
  title?: string;
  includeMetadata?: boolean;
}

interface ExportDocument {
  title: string;
  htmlContent: string;
  bodyMarkup: string;
  fullHtml: string;
  styleSheet: string;
  metadata: {
    exportedAt: string;
    wordCount: number;
    characterCount: number;
  };
}

const EXPORT_WIDTH = 1120;
const PDF_PAGE_WIDTH_PT = 595.28;
const PDF_PAGE_HEIGHT_PT = 841.89;
const PDF_MARGIN_PT = 36;
const PNG_MAX_HEIGHT = 16384;

const converter = new showdown.Converter({
  tables: true,
  tasklists: true,
  strikethrough: true,
  ghCodeBlocks: true,
  simplifiedAutoLink: true,
});

const crcTable = new Uint32Array(256).map((_, index) => {
  let current = index;
  for (let bit = 0; bit < 8; bit += 1) {
    current = (current & 1) ? (0xedb88320 ^ (current >>> 1)) : (current >>> 1);
  }
  return current >>> 0;
});

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function encodeUtf8(value: string) {
  return new TextEncoder().encode(value);
}

function concatBytes(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function formatLocalTimestamp(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function countWords(markdown: string) {
  const latinWords = markdown.trim().match(/[A-Za-z0-9_]+/g) ?? [];
  const cjkCharacters = markdown.match(/[\u3400-\u9fff\uf900-\ufaff]/g) ?? [];
  return latinWords.length + cjkCharacters.length;
}

function countCharacters(markdown: string) {
  return markdown.replace(/\s+/g, "").length;
}

export function deriveDocumentTitle(markdown: string) {
  const firstHeading = markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^#{1,6}\s+/.test(line));

  const rawTitle = firstHeading?.replace(/^#{1,6}\s+/, "").trim();
  return rawTitle || "NoteMark Export";
}

export function sanitizeFileStem(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "notemark-export";
}

export function buildExportDocument({
  markdown,
  presetCss,
  customCss,
  title,
  includeMetadata = true,
}: ExportDocumentOptions): ExportDocument {
  const resolvedTitle = title || deriveDocumentTitle(markdown);
  const htmlContent = converter.makeHtml(markdown);
  const exportedAt = new Date();
  const metadata = {
    exportedAt: formatLocalTimestamp(exportedAt),
    wordCount: countWords(markdown),
    characterCount: countCharacters(markdown),
  };

  const metadataMarkup = includeMetadata
    ? `<section class="notemark-export-meta">
        <div><span>导出时间</span><strong>${metadata.exportedAt}</strong></div>
        <div><span>字数</span><strong>${metadata.wordCount}</strong></div>
        <div><span>字符</span><strong>${metadata.characterCount}</strong></div>
      </section>`
    : "";

  const bodyMarkup = `
    <header class="notemark-export-hero">
      <p class="notemark-export-kicker">Exported from NoteMark</p>
      <h1>${escapeXml(resolvedTitle)}</h1>
      <p class="notemark-export-subtitle">A polished snapshot of your current markdown document.</p>
    </header>
    ${metadataMarkup}
    <article class="notemark-export-content markdown-body">${htmlContent}</article>
  `;

  const styleSheet = `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #f7f7fb; }
    .notemark-export-root {
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
      padding: 48px 40px 64px;
      font-family: "Quicksand", "Segoe UI", sans-serif;
      line-height: 1.7;
      color: #334155;
      background: #fdfdfd;
    }
    .notemark-export-hero {
      margin-bottom: 28px;
      padding: 32px;
      border-radius: 28px;
      background: linear-gradient(135deg, rgba(255, 143, 171, 0.12), rgba(255, 255, 255, 0.92));
      border: 1px solid rgba(255, 143, 171, 0.18);
    }
    .notemark-export-kicker {
      margin: 0 0 12px;
      font-size: 12px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-weight: 700;
      color: #ff7aa2;
    }
    .notemark-export-hero h1 {
      margin: 0;
      font-size: 2.5rem;
      line-height: 1.15;
      color: #0f172a;
    }
    .notemark-export-subtitle {
      margin: 12px 0 0;
      font-size: 1rem;
      color: #64748b;
    }
    .notemark-export-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin: 0 0 32px;
    }
    .notemark-export-meta div {
      padding: 14px 16px;
      border-radius: 18px;
      background: #fff6fa;
      border: 1px solid rgba(255, 143, 171, 0.14);
    }
    .notemark-export-meta span {
      display: block;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .notemark-export-meta strong {
      font-size: 1rem;
      color: #334155;
    }
    .notemark-export-content h1,
    .notemark-export-content h2,
    .notemark-export-content h3,
    .notemark-export-content h4,
    .notemark-export-content h5,
    .notemark-export-content h6 {
      color: #1e293b;
      margin-top: 1.8em;
      margin-bottom: 0.7em;
      line-height: 1.25;
    }
    .notemark-export-content h1 { font-size: 2rem; border-bottom: 2px solid rgba(255, 143, 171, 0.35); padding-bottom: 0.35em; }
    .notemark-export-content h2 { font-size: 1.6rem; }
    .notemark-export-content h3 { font-size: 1.3rem; }
    .notemark-export-content p,
    .notemark-export-content li { font-size: 1rem; }
    .notemark-export-content img {
      display: block;
      max-width: 100%;
      border-radius: 18px;
      margin: 24px auto;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }
    .notemark-export-content blockquote {
      margin: 24px 0;
      padding: 18px 22px;
      border-left: 4px solid #ff8fab;
      background: #fff6fa;
      color: #475569;
      border-radius: 0 18px 18px 0;
    }
    .notemark-export-content pre {
      padding: 18px;
      overflow-x: auto;
      border-radius: 18px;
      background: #0f172a;
      color: #e2e8f0;
    }
    .notemark-export-content code {
      font-family: "JetBrains Mono", "SFMono-Regular", monospace;
      background: rgba(148, 163, 184, 0.14);
      padding: 0.12rem 0.35rem;
      border-radius: 6px;
    }
    .notemark-export-content pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }
    .notemark-export-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      overflow: hidden;
      border-radius: 16px;
    }
    .notemark-export-content th,
    .notemark-export-content td {
      border: 1px solid #e2e8f0;
      padding: 12px 14px;
      text-align: left;
    }
    .notemark-export-content th {
      background: #f8fafc;
      color: #334155;
    }
    .notemark-export-content a {
      color: #ff7aa2;
      text-decoration: none;
    }
    .notemark-export-content hr {
      border: 0;
      height: 1px;
      background: linear-gradient(90deg, rgba(255, 143, 171, 0), rgba(255, 143, 171, 0.55), rgba(255, 143, 171, 0));
      margin: 32px 0;
    }
    ${presetCss}
    ${customCss}
  `;

  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(resolvedTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Playfair+Display:wght@500;700&family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${styleSheet}</style>
</head>
<body>
  <main class="notemark-export-root">${bodyMarkup}</main>
</body>
</html>`;

  return { title: resolvedTitle, htmlContent, bodyMarkup, fullHtml, styleSheet, metadata };
}

async function waitForIframeLoad(iframe: HTMLIFrameElement) {
  await new Promise<void>((resolve, reject) => {
    const handleLoad = () => resolve();
    const handleError = () => reject(new Error("导出预览加载失败"));
    iframe.addEventListener("load", handleLoad, { once: true });
    iframe.addEventListener("error", handleError, { once: true });
  });

  const frameWindow = iframe.contentWindow;
  const fonts = frameWindow?.document.fonts;
  if (fonts) {
    await Promise.race([
      fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  } else {
    await new Promise((resolve) => window.setTimeout(resolve, 120));
  }
}

async function loadImage(src: string) {
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("导出图片渲染失败"));
    image.src = src;
  });

  return image;
}

export async function renderDocumentToCanvas(exportDocument: ExportDocument) {
  const iframe = window.document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = `${EXPORT_WIDTH}px`;
  iframe.style.height = "200px";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.setAttribute("aria-hidden", "true");
  iframe.srcdoc = exportDocument.fullHtml;
  window.document.body.appendChild(iframe);

  try {
    await waitForIframeLoad(iframe);
    const frameDocument = iframe.contentDocument;
    if (!frameDocument) {
      throw new Error("导出预览容器不可用");
    }

    const root = frameDocument.querySelector(".notemark-export-root") as HTMLElement | null;
    if (!root) {
      throw new Error("导出内容为空");
    }

    const measuredHeight = Math.max(root.scrollHeight + 8, root.offsetHeight + 8);
    const renderHeight = Math.min(Math.max(measuredHeight, 400), PNG_MAX_HEIGHT);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${EXPORT_WIDTH}" height="${renderHeight}" viewBox="0 0 ${EXPORT_WIDTH} ${renderHeight}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <style>${exportDocument.styleSheet}</style>
            <main class="notemark-export-root" style="width:${EXPORT_WIDTH}px;max-width:${EXPORT_WIDTH}px;min-height:${renderHeight}px;">
              ${exportDocument.bodyMarkup}
            </main>
          </div>
        </foreignObject>
      </svg>
    `;

    const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    const canvas = window.document.createElement("canvas");
    canvas.width = EXPORT_WIDTH;
    canvas.height = renderHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("无法创建导出画布");
    }

    context.fillStyle = "#f7f7fb";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return canvas;
  } finally {
    iframe.remove();
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("导出文件生成失败"));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function dataUrlToBytes(dataUrl: string) {
  const [, base64 = ""] = dataUrl.split(",", 2);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function buildPdfFromSlices(slices: Array<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }>) {
  const objects: Uint8Array[] = [];
  const offsets: number[] = [0];
  let cursor = 0;

  const push = (bytes: Uint8Array) => {
    objects.push(bytes);
    cursor += bytes.length;
  };

  const addObject = (objectId: number, body: Uint8Array) => {
    offsets[objectId] = cursor;
    push(encodeUtf8(`${objectId} 0 obj\n`));
    push(body);
    push(encodeUtf8("\nendobj\n"));
  };

  push(encodeUtf8("%PDF-1.4\n%\u00ff\u00ff\u00ff\u00ff\n"));

  const pageObjectIds = slices.map((_, index) => 3 + index * 3);
  const contentObjectIds = slices.map((_, index) => 4 + index * 3);
  const imageObjectIds = slices.map((_, index) => 5 + index * 3);

  addObject(1, encodeUtf8("<< /Type /Catalog /Pages 2 0 R >>"));
  addObject(2, encodeUtf8(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`));

  const drawableWidthPt = PDF_PAGE_WIDTH_PT - PDF_MARGIN_PT * 2;
  const drawableHeightPt = PDF_PAGE_HEIGHT_PT - PDF_MARGIN_PT * 2;

  slices.forEach((slice, index) => {
    const drawHeightPt = (slice.heightPx / slice.widthPx) * drawableWidthPt;
    const content = `q\n${drawableWidthPt} 0 0 ${drawHeightPt} ${PDF_MARGIN_PT} ${PDF_PAGE_HEIGHT_PT - PDF_MARGIN_PT - drawHeightPt} cm\n/Im${index + 1} Do\nQ`;
    addObject(
      pageObjectIds[index],
      encodeUtf8(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH_PT} ${PDF_PAGE_HEIGHT_PT}] /Resources << /XObject << /Im${index + 1} ${imageObjectIds[index]} 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`),
    );
    addObject(
      contentObjectIds[index],
      concatBytes([
        encodeUtf8(`<< /Length ${content.length} >>\nstream\n`),
        encodeUtf8(content),
        encodeUtf8("\nendstream"),
      ]),
    );
    addObject(
      imageObjectIds[index],
      concatBytes([
        encodeUtf8(`<< /Type /XObject /Subtype /Image /Width ${slice.widthPx} /Height ${slice.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${slice.jpegBytes.length} >>\nstream\n`),
        slice.jpegBytes,
        encodeUtf8("\nendstream"),
      ]),
    );

    if (drawHeightPt > drawableHeightPt + 0.1) {
      throw new Error("导出 PDF 失败：内容超过单页可绘制区域");
    }
  });

  const xrefOffset = cursor;
  push(encodeUtf8(`xref\n0 ${offsets.length}\n`));
  push(encodeUtf8("0000000000 65535 f \n"));
  for (let index = 1; index < offsets.length; index += 1) {
    push(encodeUtf8(`${offsets[index].toString().padStart(10, "0")} 00000 n \n`));
  }
  push(encodeUtf8(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));

  return new Blob(objects, { type: "application/pdf" });
}

export async function buildPngArtifact(fileStem: string, document: ExportDocument): Promise<ExportArtifact> {
  const canvas = await renderDocumentToCanvas(document);
  const blob = await canvasToBlob(canvas, "image/png");
  return {
    fileName: `${fileStem}.png`,
    mimeType: "image/png",
    blob,
  };
}

export async function buildPdfArtifact(fileStem: string, document: ExportDocument): Promise<ExportArtifact> {
  const canvas = await renderDocumentToCanvas(document);
  const drawableWidthPt = PDF_PAGE_WIDTH_PT - PDF_MARGIN_PT * 2;
  const drawableHeightPt = PDF_PAGE_HEIGHT_PT - PDF_MARGIN_PT * 2;
  const pageHeightPx = Math.max(1, Math.floor((drawableHeightPt / drawableWidthPt) * canvas.width));
  const slices: Array<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }> = [];

  for (let offsetY = 0; offsetY < canvas.height; offsetY += pageHeightPx) {
    const height = Math.min(pageHeightPx, canvas.height - offsetY);
    const pageCanvas = window.document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = height;
    const context = pageCanvas.getContext("2d");
    if (!context) {
      throw new Error("无法创建 PDF 页面");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      height,
      0,
      0,
      pageCanvas.width,
      height,
    );

    slices.push({
      jpegBytes: dataUrlToBytes(pageCanvas.toDataURL("image/jpeg", 0.92)),
      widthPx: pageCanvas.width,
      heightPx: pageCanvas.height,
    });
  }

  return {
    fileName: `${fileStem}.pdf`,
    mimeType: "application/pdf",
    blob: buildPdfFromSlices(slices),
  };
}

function getDosDateTime(date = new Date()) {
  const seconds = Math.floor(date.getSeconds() / 2);
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | seconds;
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

export function buildZipBlob(entries: Array<{ name: string; data: Uint8Array }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  const now = getDosDateTime();
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.name);
    const checksum = crc32(entry.data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, now.time);
    writeUint16(localHeader, 12, now.date);
    writeUint32(localHeader, 14, checksum);
    writeUint32(localHeader, 18, entry.data.length);
    writeUint32(localHeader, 22, entry.data.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, entry.data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, now.time);
    writeUint16(centralHeader, 14, now.date);
    writeUint32(centralHeader, 16, checksum);
    writeUint32(centralHeader, 20, entry.data.length);
    writeUint32(centralHeader, 24, entry.data.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + entry.data.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const endOfCentralDirectory = new Uint8Array(22);
  writeUint32(endOfCentralDirectory, 0, 0x06054b50);
  writeUint16(endOfCentralDirectory, 4, 0);
  writeUint16(endOfCentralDirectory, 6, 0);
  writeUint16(endOfCentralDirectory, 8, entries.length);
  writeUint16(endOfCentralDirectory, 10, entries.length);
  writeUint32(endOfCentralDirectory, 12, centralDirectory.length);
  writeUint32(endOfCentralDirectory, 16, offset);
  writeUint16(endOfCentralDirectory, 20, 0);

  return new Blob([...localParts, centralDirectory, endOfCentralDirectory], { type: "application/zip" });
}

export async function buildZipArtifact(fileStem: string, markdown: string, document: ExportDocument): Promise<ExportArtifact> {
  const pngArtifact = await buildPngArtifact(fileStem, document);
  const previewBytes = new Uint8Array(await pngArtifact.blob!.arrayBuffer());
  const metadataJson = JSON.stringify(
    {
      title: document.title,
      exportedAt: document.metadata.exportedAt,
      wordCount: document.metadata.wordCount,
      characterCount: document.metadata.characterCount,
      formats: ["md", "html", "css", "png"],
    },
    null,
    2,
  );

  const blob = buildZipBlob([
    { name: `${fileStem}.md`, data: encodeUtf8(markdown) },
    { name: "index.html", data: encodeUtf8(document.fullHtml) },
    { name: "styles.css", data: encodeUtf8(document.styleSheet) },
    { name: "metadata.json", data: encodeUtf8(metadataJson) },
    { name: "preview.png", data: previewBytes },
  ]);

  return {
    fileName: `${fileStem}.zip`,
    mimeType: "application/zip",
    blob,
  };
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("读取导出文件失败"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",", 2)[1] ?? "");
    };
    reader.readAsDataURL(blob);
  });
}

function triggerBrowserDownload(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = fileName;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function saveExportArtifact(
  artifact: ExportArtifact,
  filters: Array<{ name: string; extensions: string[] }>,
) {
  if (artifact.text && !artifact.blob) {
    const saved = await saveDesktopTextFile(artifact.fileName, artifact.text, filters);
    if (hasTauriRuntime()) {
      return saved;
    }
    triggerBrowserDownload(artifact.fileName, new Blob([artifact.text], { type: artifact.mimeType }));
    return true;
  }

  if (!artifact.blob) {
    throw new Error("没有可保存的导出文件");
  }

  if (hasTauriRuntime()) {
    const saved = await saveDesktopBinaryFile(
      artifact.fileName,
      await blobToBase64(artifact.blob),
      filters,
    );
    return saved;
  }

  triggerBrowserDownload(artifact.fileName, artifact.blob);
  return true;
}

export async function shareExportArtifact(artifact: ExportArtifact) {
  const file = new File(
    [artifact.blob ?? artifact.text ?? ""],
    artifact.fileName,
    { type: artifact.mimeType },
  );

  if (typeof navigator !== "undefined" && "share" in navigator) {
    const shareData: ShareData = {
      title: artifact.fileName,
      text: `Shared from NoteMark: ${artifact.fileName}`,
    };

    if ("canShare" in navigator && navigator.canShare?.({ files: [file] })) {
      shareData.files = [file];
    }

    await navigator.share(shareData);
    return true;
  }

  return false;
}
