import { useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useModalRoute, ROUTES } from '@/hooks/useModalRoute';
import { useEditorStateContext } from '@/contexts/EditorStateContext';

// 快捷键配置接口
export interface KeyboardShortcut {
  key: string;                    // 按键，如 'k', 's', 'Enter'
  ctrl?: boolean;                  // Ctrl 键
  meta?: boolean;                  // Meta (Command) 键
  shift?: boolean;                 // Shift 键
  alt?: boolean;                   // Alt 键
  handler: () => void;             // 回调函数
  description?: string;           // 描述（可选，用于文档）
}

// 快捷键 Hook 配置
interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  // 是否在捕获输入时禁用（比如在输入框中）
  ignoreInput?: boolean;
}

// 默认忽略的输入元素类型
const DEFAULT_IGNORE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

export function useKeyboardShortcuts({ shortcuts, ignoreInput = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 如果需要在输入时忽略快捷键
      if (ignoreInput) {
        const target = e.target as HTMLElement;
        if (DEFAULT_IGNORE_TAGS.includes(target.tagName) || target.isContentEditable) {
          return;
        }
      }

      // 遍历所有注册的快捷键
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        // 检查是否匹配所有修饰键
        // 注意：metaKey 单独处理，因为 Mac 的 Command 键和 Windows 的 Ctrl 键通常等效
        const metaMatch = shortcut.meta ? e.metaKey : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          e.preventDefault();
          shortcut.handler();
          return; // 匹配到一个快捷键后停止
        }
      }
    },
    [shortcuts, ignoreInput]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// ── 预定义的常用快捷键 ─────────────────────────────────────────────────────────────

// 搜索模态框快捷键
export const SEARCH_SHORTCUT: Omit<KeyboardShortcut, 'handler'> = {
  key: 'k',
  ctrl: true,
  description: '打开/关闭搜索模态框',
};

// 保存快捷键
export const SAVE_SHORTCUT: Omit<KeyboardShortcut, 'handler'> = {
  key: 's',
  ctrl: true,
  description: '保存文件',
};

// 另存为快捷键
export const SAVE_AS_SHORTCUT: Omit<KeyboardShortcut, 'handler'> = {
  key: 's',
  ctrl: true,
  shift: true,
  description: '另存为',
};

// 导出快捷键
export const EXPORT_SHORTCUT: Omit<KeyboardShortcut, 'handler'> = {
  key: 'e',
  ctrl: true,
  description: '导出文件',
};

// 设置模态框快捷键
export const SETTINGS_SHORTCUT: Omit<KeyboardShortcut, 'handler'> = {
  key: ',',
  ctrl: true,
  description: '打开设置',
};

// ── KeyboardShortcuts Context ─────────────────────────────────────────────────────────────

interface KeyboardShortcutsContextProps {
  // 可以在这里添加需要暴露的方法或状态
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextProps | undefined>(undefined);

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const { isModalOpen, openModal, closeModal } = useModalRoute();
  const editorState = useEditorStateContext();

  // 键盘快捷键
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "k",
        ctrl: true,
        handler: () => {
          if (isModalOpen(ROUTES.SEARCH)) {
            closeModal();
          } else {
            openModal(ROUTES.SEARCH);
          }
        },
        description: "打开/关闭搜索模态框",
      },
      {
        key: "s",
        ctrl: true,
        handler: () => {
          editorState.handleSave();
        },
        description: "保存文件",
      },
    ],
  });

  return (
    <KeyboardShortcutsContext.Provider value={{}}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export function useKeyboardShortcutsContext() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider",
    );
  }
  return context;
}
