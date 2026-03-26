// fileSystemUtils.ts

import { FileNode } from "@/types/filesystem";

/**
 * 默认文件ID - 引导教程文件的唯一标识符
 */
const DEFAULT_FILE_ID = "default";

/**
 * 确保文件名有扩展名
 * 如果文件名已有扩展名则保留，否则默认添加 .md
 */
export function ensureFileExtension(name: string): string {
  const trimmed = name.trim();
  // 有扩展名（含点且点不在首位）则直接返回
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot > 0) return trimmed;
  return `${trimmed}.md`;
}

/**
 * @deprecated 使用 ensureFileExtension 替代
 */
export function ensureMarkdownExtension(name: string): string {
  return ensureFileExtension(name);
}

/**
 * 生成唯一的ID
 * 组合当前时间戳和随机字符串，用于创建唯一的文件/文件夹ID
 * 
 * @returns 唯一标识符字符串
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 获取默认的初始节点列表
 * 在编辑器首次加载时提供引导教程文件
 * 
 * @returns 包含默认文件的FileNode数组
 */
export function getDefaultNodes(): FileNode[] {
  return [
    {
      id: DEFAULT_FILE_ID,
      name: "Getting_Started.md",
      type: "file",
      parentId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}

/**
 * 比较两个字符串数组是否相等
 * 按顺序比较每个元素，用于判断排序是否发生变化
 * 
 * @param a - 第一个字符串数组
 * @param b - 第二个字符串数组
 * @returns 两数组是否相等
 */
export const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
};

/**
 * 导出默认文件ID常量供外部使用
 */
export { DEFAULT_FILE_ID };


export const generateOptimisticId = (parentId: string | null, name: string): string => {
  return parentId ? `${parentId}/${name}` : name;
};

export const remapId = (s: string, oldPrefix: string, newPrefix: string): string => {
  if (s === oldPrefix) return newPrefix;
  if (s.startsWith(oldPrefix + "/")) return newPrefix + s.slice(oldPrefix.length);
  return s;
};

// 重映射一组 IDs（用于 pinnedIds, explorerOrder 等）
export const remapIds = (ids: string[], oldPrefix: string, newPrefix: string): string[] => {
  return ids.map((id) => remapId(id, oldPrefix, newPrefix));
};

// 重映射 Set（用于 expandedFolders）
export const remapSet = (set: Set<string>, oldPrefix: string, newPrefix: string): Set<string> => {
  const next = new Set<string>();
  for (const f of set) {
    next.add(remapId(f, oldPrefix, newPrefix));
  }
  return next;
};

// 收集要删除的节点（递归）
export const collectDescendants = (nodes: FileNode[], id: string): Set<string> => {
  const toDelete = new Set<string>();
  const collect = (nodeId: string) => {
    toDelete.add(nodeId);
    nodes.filter((n) => n.parentId === nodeId).forEach((n) => collect(n.id));
  };
  collect(id);
  return toDelete;
};