import { useRef } from 'react';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2,
  List, ListOrdered, CheckSquare, Quote, Code,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon
} from 'lucide-react';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { ToolbarButton } from './ToolbarButton';
import { uploadImage } from '@/api/client';
import { useTranslation } from 'react-i18next';

interface ToolbarProps {
  editorRef: React.RefObject<ReactCodeMirrorRef>;
}

export default function Toolbar({ editorRef }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  
  const applyMarkdown = (prefix: string, suffix: string = '') => {
    if (!editorRef.current?.view) return;
    // 获取编辑器视图
    const view = editorRef.current.view;
    // 获取选区
    const { from, to } = view.state.selection.main;
    
    const selectedText = view.state.doc.sliceString(from, to);
    const replacement = prefix + selectedText + suffix;
    
    // 插入/替换文本
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + prefix.length, head: to + prefix.length }
    });
    
    view.focus();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadImage(file);
      const view = editorRef.current?.view;
      if (view) {
        const { from } = view.state.selection.main;
        view.dispatch({ changes: { from, insert: `\n![${file.name}](${url})\n` } });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
    e.target.value = '';
  };
  
  return (
    <div className="flex items-center gap-1">
      <ToolbarButton title={t("editorToolbar.bold")} icon={<Bold className="w-5 h-5" />} onClick={() => applyMarkdown('**', '**')} />
      <ToolbarButton title={t("editorToolbar.italic")} icon={<Italic className="w-5 h-5" />} onClick={() => applyMarkdown('*', '*')} />
      <ToolbarButton title={t("editorToolbar.strikethrough")} icon={<Strikethrough className="w-5 h-5" />} onClick={() => applyMarkdown('~~', '~~')} />
      <div className="app-m3-divider w-[1px] h-6 mx-2"></div>
      <ToolbarButton title={t("editorToolbar.heading1")} icon={<Heading1 className="w-5 h-5" />} onClick={() => applyMarkdown('# ')} />
      <ToolbarButton title={t("editorToolbar.heading2")} icon={<Heading2 className="w-5 h-5" />} onClick={() => applyMarkdown('## ')} />
      <div className="app-m3-divider w-[1px] h-6 mx-2"></div>
      <ToolbarButton title={t("editorToolbar.bulletList")} icon={<List className="w-5 h-5" />} onClick={() => applyMarkdown('- ')} />
      <ToolbarButton title={t("editorToolbar.numberedList")} icon={<ListOrdered className="w-5 h-5" />} onClick={() => applyMarkdown('1. ')} />
      <ToolbarButton title={t("editorToolbar.checklist")} icon={<CheckSquare className="w-5 h-5" />} onClick={() => applyMarkdown('- [ ] ')} />
      <div className="app-m3-divider w-[1px] h-6 mx-2"></div>
      <ToolbarButton title={t("editorToolbar.quote")} icon={<Quote className="w-5 h-5" />} onClick={() => applyMarkdown('> ')} />
      <ToolbarButton title={t("editorToolbar.codeBlock")} icon={<Code className="w-5 h-5" />} onClick={() => applyMarkdown('```\n', '\n```')} />
      <ToolbarButton title={t("editorToolbar.link")} icon={<LinkIcon className="w-5 h-5" />} onClick={() => applyMarkdown('[', '](url)')} />
      <ToolbarButton 
        title={t("editorToolbar.image")} 
        icon={<ImageIcon className="w-5 h-5" />} 
        onClick={() => fileInputRef.current?.click()}
      />
      <ToolbarButton title={t("editorToolbar.table")} icon={<TableIcon className="w-5 h-5" />} onClick={() => applyMarkdown('| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |', '')} />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
