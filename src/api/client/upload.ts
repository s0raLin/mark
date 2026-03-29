import { IPC_COMMANDS } from "./commands";
import type { ApiResponse, StoredUploadResponse, UploadedImageAsset } from "./types";
import {
  extractData,
  hasTauriRuntime,
  httpGet,
  httpSend,
  invokeCommand,
  toDesktopAssetUrl,
} from "./utils";

/**
 * 上传背景图片并返回可直接预览的资源地址。
 */
export async function uploadImage(file: File): Promise<UploadedImageAsset> {
  if (hasTauriRuntime()) {
    const response = await invokeCommand<ApiResponse<StoredUploadResponse>>(
      IPC_COMMANDS.uploads.storeImage,
      {
        fileName: file.name,
        bytes: Array.from(new Uint8Array(await file.arrayBuffer())),
      },
    );
    const data = extractData(response);
    return {
      name: data.fileName,
      url: toDesktopAssetUrl(data.filePath),
    };
  }

  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch("/api/uploads/images", { method: "POST", body: formData });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  const json: ApiResponse<UploadedImageAsset> = await res.json();
  if (json.code !== 0) throw new Error(json.message || "Upload failed");
  return json.data;
}

export async function listUploadedImages(): Promise<UploadedImageAsset[]> {
  if (hasTauriRuntime()) {
    const response = await invokeCommand<
      ApiResponse<Array<{ name: string; filePath: string }>>
    >(IPC_COMMANDS.uploads.listImages);
    return extractData(response).map((image) => ({
      name: image.name,
      url: toDesktopAssetUrl(image.filePath),
    }));
  }

  return httpGet<UploadedImageAsset[]>("/uploads/images");
}

export async function deleteUploadedImage(name: string): Promise<boolean> {
  if (hasTauriRuntime()) {
    const response = await invokeCommand<ApiResponse<boolean>>(
      IPC_COMMANDS.uploads.deleteImage,
      { fileName: name },
    );
    return extractData(response);
  }

  return httpSend<boolean>(`/uploads/images?name=${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

/**
 * 上传自定义字体
 */
export async function uploadFont(file: File): Promise<{ url: string; fontFamily: string }> {
  if (hasTauriRuntime()) {
    const response = await invokeCommand<ApiResponse<StoredUploadResponse>>(
      IPC_COMMANDS.uploads.storeFont,
      {
        fileName: file.name,
        bytes: Array.from(new Uint8Array(await file.arrayBuffer())),
      },
    );
    const data = extractData(response);
    return {
      url: toDesktopAssetUrl(data.filePath),
      fontFamily: data.fontFamily ?? file.name,
    };
  }

  const formData = new FormData();
  formData.append("font", file);
  const res = await fetch("/api/uploads/fonts", { method: "POST", body: formData });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  const json: ApiResponse<{ url: string; fontFamily: string }> = await res.json();
  if (json.code !== 0) throw new Error(json.message || "Upload failed");
  return json.data;
}
