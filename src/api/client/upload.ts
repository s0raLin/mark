import { ApiResponse } from "./types";

/**
 * 上传背景图片
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  const json: ApiResponse<{ url: string }> = await res.json();
  if (json.code !== 0) throw new Error(json.message || "Upload failed");
  return json.data;
}

/**
 * 上传自定义字体
 */
export async function uploadFont(file: File): Promise<{ url: string; fontFamily: string }> {
  const formData = new FormData();
  formData.append("font", file);
  const res = await fetch("/api/upload-font", { method: "POST", body: formData });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  const json: ApiResponse<{ url: string; fontFamily: string }> = await res.json();
  if (json.code !== 0) throw new Error(json.message || "Upload failed");
  return json.data;
}