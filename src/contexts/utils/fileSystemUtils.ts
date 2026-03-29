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
