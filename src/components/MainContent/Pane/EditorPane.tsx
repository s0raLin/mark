import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { MarkdownEditorView, YfmStaticView, useMarkdownEditor } from "@gravity-ui/markdown-editor";
import { FileType2, Lock, Music4 } from "lucide-react";
import type { GetFileContentResponse } from "@/api/client";
import { uploadImage } from "@/api/client";
import { cn } from "@/utils/cn";
import type { ViewMode } from "@/contexts/EditorStateContext";
import type { Heading } from "../types";
import transform from "@diplodoc/transform";

interface EditorPaneProps {
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
  activeFileContent: GetFileContentResponse | null;
  editorFont: string;
  fileName: string;
  headings: Heading[];
  previewRef: React.MutableRefObject<HTMLDivElement | null>;
  previewTheme: string;
  viewMode: ViewMode;
}

function formatFileSize(size?: number) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export default function EditorPane({
  markdown,
  setMarkdown,
  activeFileContent,
  editorFont,
  fileName,
  headings,
  previewRef,
  previewTheme,
  viewMode,
}: EditorPaneProps) {
  const isEditableText = activeFileContent?.kind === "text" && activeFileContent.editable !== false;
  const ext = (fileName.split(".").pop() || "md").toUpperCase();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headingsRef = useRef(headings);
  const previewThemeRef = useRef(previewTheme);

  useEffect(() => {
    headingsRef.current = headings;
  }, [headings]);

  useEffect(() => {
    previewThemeRef.current = previewTheme;
  }, [previewTheme]);

  const renderPreview = useCallback(({ getValue }: { getValue: () => string }) => {
    const previewMarkdown = getValue();

    if (!previewMarkdown.trim()) {
      return (
        <div className="gravity-editor-preview px-6 py-6 md:px-8 md:py-8">
          <div className={cn(
            "gravity-editor-preview-card rounded-[28px] border border-white/60 bg-white/82 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl",
            previewThemeRef.current,
          )}>
            <div className="markdown-body opacity-50">
              <p>Preview will appear here once the document has content.</p>
            </div>
          </div>
        </div>
      );
    }

    let html: string;
    try {
      const result = transform(previewMarkdown, {
        linkify: true,
        breaks: true,
        needTitle: false,
      });
      html = result.result.html;
    } catch (error) {
      console.error("Gravity inline preview transform failed:", error);
      html = `<pre>${previewMarkdown
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>`;
    }

    return (
      <div className="gravity-editor-preview px-6 py-6 md:px-8 md:py-8">
        <div
          className={cn(
            "gravity-editor-preview-card rounded-[28px] border border-white/60 bg-white/82 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-10",
            previewThemeRef.current,
          )}
        >
          <YfmStaticView html={html} className="markdown-body" />
        </div>
      </div>
    );
  }, []);

  const editor = useMarkdownEditor(
    {
      preset: "full",
      md: {
        html: true,
        linkify: true,
        breaks: true,
      },
      initial: {
        markup: markdown,
        mode: "markup",
        toolbarVisible: true,
      },
      handlers: {
        uploadFile: async (file) => {
          const uploaded = await uploadImage(file);
          return {
            url: uploaded.url,
            name: uploaded.name,
            type: file.type,
          };
        },
      },
      markupConfig: {
        renderPreview,
        splitMode: "horizontal",
        placeholder: "Write something beautiful...",
      },
    },
    [activeFileContent?.id ?? fileName],
  );

  useEffect(() => {
    if (!isEditableText) {
      return;
    }

    const handleChange = () => {
      const nextValue = editor.getValue();
      setMarkdown((prev) => (prev === nextValue ? prev : nextValue));
    };

    editor.on("change", handleChange);
    return () => {
      editor.off("change", handleChange);
    };
  }, [editor, isEditableText, setMarkdown]);

  useEffect(() => {
    if (!isEditableText) {
      previewRef.current = null;
      return;
    }

    if (editor.getValue() !== markdown) {
      editor.replace(markdown);
    }
  }, [editor, isEditableText, markdown, previewRef]);

  useEffect(() => {
    if (!isEditableText) {
      previewRef.current = null;
      return;
    }

    const wantsSplitPreview = viewMode !== "editor";
    (
      editor as typeof editor & {
        changeSplitModeEnabled: (opts: { splitModeEnabled: boolean }) => void;
        changeToolbarVisibility: (opts: { visible: boolean }) => void;
      }
    ).changeSplitModeEnabled({ splitModeEnabled: wantsSplitPreview });
    (
      editor as typeof editor & {
        changeSplitModeEnabled: (opts: { splitModeEnabled: boolean }) => void;
        changeToolbarVisibility: (opts: { visible: boolean }) => void;
      }
    ).changeToolbarVisibility({ visible: viewMode !== "preview" });
  }, [editor, isEditableText, previewRef, viewMode]);

  useEffect(() => {
    if (!isEditableText) {
      previewRef.current = null;
      return;
    }

    const splitPreview = rootRef.current?.querySelector<HTMLDivElement>(".g-md-markup-preview__outer");
    previewRef.current = splitPreview ?? null;

    if (!splitPreview) {
      return;
    }

    const headingElements = splitPreview.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6");
    headingElements.forEach((element, index) => {
      const outlineId = headingsRef.current[index]?.id;
      if (!outlineId) {
        element.removeAttribute("data-outline-id");
        element.removeAttribute("id");
        return;
      }

      element.setAttribute("data-outline-id", outlineId);
      element.id = outlineId;
    });
  }, [editor, isEditableText, markdown, previewRef, viewMode]);

  const binarySummary = useMemo(() => {
    if (!activeFileContent || activeFileContent.kind === "text") {
      return null;
    }

    return {
      label: (activeFileContent.id.split(".").pop() || "FILE").toUpperCase(),
      mime: activeFileContent.mimeType || "application/octet-stream",
      size: formatFileSize(activeFileContent.size),
    };
  }, [activeFileContent]);

  const editorSurfaceStyle: CSSProperties = {
    ["--g-md-font-family" as keyof CSSProperties]: `${editorFont}, var(--g-font-family-monospace, monospace)`,
  };

  if (!isEditableText) {
    return (
      <section className="flex min-w-0 flex-1 items-center justify-center border-r border-border-soft bg-white/35 px-8 py-10">
        <div className="app-m3-binary-card w-full max-w-xl rounded-[28px] p-8">
          <div className="flex items-start gap-4">
            <div className="app-m3-binary-icon flex h-14 w-14 items-center justify-center rounded-2xl">
              {activeFileContent?.kind === "audio" ? (
                <Music4 className="h-6 w-6" />
              ) : (
                <FileType2 className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="app-m3-binary-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                  <FileType2 className="h-3.5 w-3.5" />
                  {binarySummary?.label ?? ext}
                </span>
                <span className="app-m3-binary-muted-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium">
                  <Lock className="h-3.5 w-3.5" />
                  Read only
                </span>
              </div>
              <p className="app-m3-binary-title text-lg font-semibold">这个文件不能在编辑器里直接修改</p>
              <p className="app-m3-binary-description text-sm leading-6">
                Gravity UI 编辑器现在只接管可编辑文本文件。当前文件会继续在右侧预览区展示可播放或可查看的内容。
              </p>
              <div className="app-m3-binary-file rounded-2xl px-4 py-3">
                <p className="app-m3-binary-file-name truncate text-sm font-medium">
                  {activeFileContent?.id ?? fileName}
                </p>
                <p className="app-m3-binary-file-description mt-1 text-xs">
                  {binarySummary?.mime ?? "application/octet-stream"} · {binarySummary?.size ?? "0 B"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      className={cn(
        "gravity-editor-pane min-w-0 flex-1 overflow-hidden bg-white/45",
        viewMode !== "preview" && "border-r border-border-soft",
        viewMode === "preview" && "gravity-editor-pane--preview-only",
      )}
      style={editorSurfaceStyle}
    >
      <div className="h-full overflow-hidden p-4">
        <div className="h-full overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <MarkdownEditorView
            autofocus
            editor={editor}
            settingsVisible={false}
            stickyToolbar={false}
            className="h-full"
          />
        </div>
      </div>
    </section>
  );
}
