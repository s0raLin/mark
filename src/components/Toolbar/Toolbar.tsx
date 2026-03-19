import { useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Code, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Table as TableIcon
} from 'lucide-react';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { ToolbarButton } from './ToolbarButton';

interface ToolbarProps {
  editorRef: React.RefObject<ReactCodeMirrorRef>;
}

export default function Toolbar({ editorRef }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const applyMarkdown = (prefix: string, suffix: string = '') => {
    if (!editorRef.current?.view) return;
    const view = editorRef.current.view;
    const { from, to } = view.state.selection.main;
    
    const selectedText = view.state.doc.sliceString(from, to);
    const replacement = prefix + selectedText + suffix;
    
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + prefix.length, head: to + prefix.length }
    });
    
    view.focus();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.url;
        // Insert image markdown at cursor position
        const view = editorRef.current?.view;
        if (view) {
          const { from } = view.state.selection.main;
          const imageMarkdown = `\n![${file.name}](${imageUrl})\n`;
          view.dispatch({
            changes: { from, insert: imageMarkdown }
          });
        }
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    }
    e.target.value = '';
  };
  
  return (
    <div className="flex items-center gap-1">
      <ToolbarButton title="Bold" icon={<Bold className="w-5 h-5" />} onClick={() => applyMarkdown('**', '**')} />
      <ToolbarButton title="Italic" icon={<Italic className="w-5 h-5" />} onClick={() => applyMarkdown('*', '*')} />
      <ToolbarButton title="Strikethrough" icon={<Strikethrough className="w-5 h-5" />} onClick={() => applyMarkdown('~~', '~~')} />
      <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
      <ToolbarButton title="Heading 1" icon={<Heading1 className="w-5 h-5" />} onClick={() => applyMarkdown('# ')} />
      <ToolbarButton title="Heading 2" icon={<Heading2 className="w-5 h-5" />} onClick={() => applyMarkdown('## ')} />
      <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
      <ToolbarButton title="Bullet List" icon={<List className="w-5 h-5" />} onClick={() => applyMarkdown('- ')} />
      <ToolbarButton title="Numbered List" icon={<ListOrdered className="w-5 h-5" />} onClick={() => applyMarkdown('1. ')} />
      <ToolbarButton title="Checklist" icon={<CheckSquare className="w-5 h-5" />} onClick={() => applyMarkdown('- [ ] ')} />
      <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
      <ToolbarButton title="Quote" icon={<Quote className="w-5 h-5" />} onClick={() => applyMarkdown('> ')} />
      <ToolbarButton title="Code Block" icon={<Code className="w-5 h-5" />} onClick={() => applyMarkdown('```\n', '\n```')} />
      <ToolbarButton title="Link" icon={<LinkIcon className="w-5 h-5" />} onClick={() => applyMarkdown('[', '](url)')} />
      <ToolbarButton 
        title="Image" 
        icon={<ImageIcon className="w-5 h-5" />} 
        onClick={() => fileInputRef.current?.click()}
      />
      <ToolbarButton title="Table" icon={<TableIcon className="w-5 h-5" />} onClick={() => applyMarkdown('| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |', '')} />
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
