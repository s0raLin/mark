import { useModalRoute, ROUTES } from "@/hooks/useModalRoute";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEditorStateContext } from "./EditorStateContext";

export function KeyboardShortcutsBindings() {
  const { isModalOpen, openModal, closeModal } = useModalRoute();
  const editorState = useEditorStateContext();

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

  return null;
}
