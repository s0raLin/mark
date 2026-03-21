import { FileNode } from "@/types/filesystem";

/**
 * 默认文件ID - 引导教程文件的唯一标识符
 */
const DEFAULT_FILE_ID = "default";

/**
 * 确保文件名以 .md 结尾
 * 如果文件名以 .markdown 结尾，则转换为 .md
 * 如果文件名没有扩展名，则添加 .md 扩展名
 * 
 * @param name - 原始文件名
 * @returns 确保以 .md 结尾的文件名
 */
export function ensureMarkdownExtension(name: string): string {
  if (name.endsWith(".md")) return name;
  if (name.endsWith(".markdown"))
    return `${name.slice(0, -".markdown".length)}.md`;
  return `${name}.md`;
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
