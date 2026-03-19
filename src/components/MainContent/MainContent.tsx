import { useState, useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Settings, 
  Image as ImageIcon, 
  FileText,
  Folder,
  FolderOpen,
  History,
  Download,
  PlusCircle,
  CheckCircle2,
  Search,
  Settings2,
  Pin} from 'lucide-react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown as markdownLang, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { linter, Diagnostic } from '@codemirror/lint';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { nord } from '@uiw/codemirror-theme-nord';
import { sublime } from '@uiw/codemirror-theme-sublime';
import { EditorView } from '@codemirror/view';
import { SidebarItem } from './SidebarItem';
import { cn } from '@/src/utils/cn';
import { OutlineItem } from './OutlineItem';
import { INITIAL_MARKDOWN } from '@/src/constants';

interface MainContentProps {
  toolbarRef?: React.RefObject<ReactCodeMirrorRef>;
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
  viewMode: "split" | "editor" | "preview";
  editorTheme: string;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>;
  previewTheme: string;
  setPreviewTheme: React.Dispatch<React.SetStateAction<string>>;
  fontChoice: string;
  setFontChoice: React.Dispatch<React.SetStateAction<string>>;
}

export default function MainContent({ 
  toolbarRef, 
  markdown, 
  setMarkdown,
  viewMode,
  editorTheme,
  setEditorTheme,
  previewTheme,
  setPreviewTheme,
  fontChoice,
  setFontChoice
}: MainContentProps) {
      const [isExportModalOpen, setIsExportModalOpen] = useState(false);
      const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
      const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
      const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
      const [activeMenu, setActiveMenu] = useState<string | null>(null);
      const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
      const previewRef = useRef<HTMLDivElement>(null);
    
      const headings = useMemo(() => {
        const lines = markdown.split('\n');
        const result: { text: string; level: number; id: string }[] = [];
        lines.forEach((line) => {
          const match = line.match(/^(#{1,6})\s+(.+)$/);
          if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            result.push({ text, level, id });
          }
        });
        return result;
      }, [markdown]);
    
      useEffect(() => {
        let ticking = false;
    
        const handleScroll = () => {
          if (!ticking) {
            window.requestAnimationFrame(() => {
              if (!previewRef.current) {
                ticking = false;
                return;
              }
              
              const container = previewRef.current;
              // Threshold for when a heading is considered "active"
              // We use a value that feels natural (about 1/4 down the viewport)
              const threshold = Math.min(150, container.clientHeight / 4);
              const scrollPosition = container.scrollTop + threshold;
              
              // Check if we're near the bottom of the document
              // If so, the last heading should be active
              const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
              
              if (isAtBottom && headings.length > 0) {
                setActiveOutlineId(headings[headings.length - 1].id);
                ticking = false;
                return;
              }
    
              let currentId = null;
              // Find the last heading that has passed the threshold
              for (const heading of headings) {
                const el = document.getElementById(heading.id);
                if (el) {
                  if (el.offsetTop <= scrollPosition) {
                    currentId = heading.id;
                  } else {
                    break;
                  }
                }
              }
              
              setActiveOutlineId(currentId);
              ticking = false;
            });
            ticking = true;
          }
        };
    
        const currentPreview = previewRef.current;
        if (currentPreview) {
          currentPreview.addEventListener('scroll', handleScroll, { passive: true });
          // Initial check to sync state
          handleScroll();
        }
        return () => currentPreview?.removeEventListener('scroll', handleScroll);
      }, [headings]);
    
      const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element && previewRef.current) {
          setActiveOutlineId(id);
          previewRef.current.scrollTo({
            top: element.offsetTop - 60,
            behavior: 'smooth'
          });
        }
      };
      const fileInputRef = useRef<HTMLInputElement>(null);
      const editorRef = useRef<ReactCodeMirrorRef>(null);

      // Expose editorRef to parent toolbarRef
      useImperativeHandle(toolbarRef, () => editorRef.current!, []);
    
      useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchModalOpen(prev => !prev);
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, []);
    
      useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
          if (activeMenu && !(e.target as HTMLElement).closest('.menu-container')) {
            setActiveMenu(null);
          }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
      }, [activeMenu]);
    
      useEffect(() => {
        localStorage.setItem('studiomark_editor_theme', editorTheme);
      }, [editorTheme]);
    
      useEffect(() => {
        localStorage.setItem('studiomark_preview_theme', previewTheme);
      }, [previewTheme]);
    
      useEffect(() => {
        localStorage.setItem('studiomark_font_choice', fontChoice);
        document.documentElement.style.setProperty('--font-display', fontChoice === 'Quicksand' ? '"Quicksand", sans-serif' : `"${fontChoice}", sans-serif`);
      }, [fontChoice]);
    
      const getThemeExtension = (themeName: string) => {
        switch (themeName) {
          case 'githubLight': return githubLight;
          case 'githubDark': return githubDark;
          case 'vscodeDark': return vscodeDark;
          case 'dracula': return dracula;
          case 'nord': return nord;
          case 'sublime': return sublime;
          default: return oneDark;
        }
      };
    
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
    
      // Markdown Linter for common errors
      const markdownLinter = linter((view) => {
        const diagnostics: Diagnostic[] = [];
        const text = view.state.doc.toString();
        
        // Check for missing space after #
        const headingRegex = /^#+[^#\s\n]/gm;
        let match;
        while ((match = headingRegex.exec(text)) !== null) {
          diagnostics.push({
            from: match.index + match[0].lastIndexOf('#') + 1,
            to: match.index + match[0].length,
            severity: "warning",
            message: "Headings should have a space after the # characters",
            actions: [{
              name: "Add space",
              apply(view, from) {
                view.dispatch({changes: {from, insert: " "}});
              }
            }]
          });
        }
    
        // Check for unclosed bold/italic
        const boldRegex = /\*\*([^\*]+)$|\*([^\*]+)$|~~([^~]+)$/gm;
        while ((match = boldRegex.exec(text)) !== null) {
          const type = match[0].startsWith('**') ? 'bold' : match[0].startsWith('~~') ? 'strikethrough' : 'italic';
          const marker = match[0].startsWith('**') ? '**' : match[0].startsWith('~~') ? '~~' : '*';
          diagnostics.push({
            from: match.index,
            to: match.index + match[0].length,
            severity: "info",
            message: `Unclosed ${type} syntax`,
            actions: [{
              name: `Close ${type}`,
              apply(view, from, to) {
                view.dispatch({changes: {from: to, insert: marker}});
              }
            }]
          });
        }
    
        // Check for empty links
        const linkRegex = /\[\]\([^\)]*\)/g;
        while ((match = linkRegex.exec(text)) !== null) {
          diagnostics.push({
            from: match.index,
            to: match.index + match[0].length,
            severity: "warning",
            message: "Empty link text",
          });
        }
    
        return diagnostics;
      });
    
      // Markdown Autocompletion
      const markdownCompletions = (context: CompletionContext) => {
        const word = context.matchBefore(/#+|\[|!\[|`+/);
        if (!word) return null;
        if (word.from === word.to && !context.explicit) return null;
    
        return {
          from: word.from,
          options: [
            {label: "# Heading 1", type: "text", apply: "# "},
            {label: "## Heading 2", type: "text", apply: "## "},
            {label: "### Heading 3", type: "text", apply: "### "},
            {label: "[Link](url)", type: "text", apply: "[text](url)"},
            {label: "![Image](url)", type: "text", apply: "![alt](url)"},
            {label: "```Code Block", type: "text", apply: "```\n\n```"},
            {label: "- Bullet List", type: "text", apply: "- "},
            {label: "1. Numbered List", type: "text", apply: "1. "},
            {label: "- [ ] Checklist", type: "text", apply: "- [ ] "},
            {label: "> Blockquote", type: "text", apply: "> "},
            {label: "--- Horizontal Rule", type: "text", apply: "---\n"},
          ]
        };
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
            setMarkdown(prev => prev + `\n\n![${file.name}](${imageUrl})`);
          } else {
            alert('Upload failed');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Error uploading image');
        }
        // Reset input value to allow uploading the same file again
        e.target.value = '';
      };
    
      useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          // Markdown shortcuts (Ctrl/Cmd + Key)
          if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
              case 'b':
                e.preventDefault();
                applyMarkdown('**', '**');
                break;
              case 'i':
                e.preventDefault();
                applyMarkdown('*', '*');
                break;
              case '1':
                e.preventDefault();
                applyMarkdown('# ');
                break;
              case '2':
                e.preventDefault();
                applyMarkdown('## ');
                break;
              case '3':
                e.preventDefault();
                applyMarkdown('### ');
                break;
            }
          }
    
          // View mode shortcuts (Alt + Key)
          if (e.altKey) {
            switch (e.key) {
              case '1':
                e.preventDefault();
                // View mode is handled by parent
                break;
              case '2':
                e.preventDefault();
                break;
              case '3':
                e.preventDefault();
                break;
            }
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, []);

      const handleNewSparkle = () => {
        setMarkdown('# New Sparkle\n\nStart writing here...');
        setActiveMenu(null);
      };

      const handleSaveAs = () => {
        setIsSaveAsModalOpen(true);
        setActiveMenu(null);
      };
  return (

      <div className="flex h-full w-full">
        {/* Left Sidebar (NoteBuddy Style) */}
        <aside className="w-80 h-full flex flex-col border-r border-rose-100 bg-white/90 backdrop-blur-xl shrink-0">
          <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
            <section>
              <div className="px-3 mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">Pinned</h2>
              </div>
              <div className="space-y-1">
                <SidebarItem icon={<Pin className="w-4 h-4 text-primary" />} label="Project_Specs.md" active />
                <SidebarItem icon={<Pin className="w-4 h-4 text-rose-200" />} label="Release_Notes.md" />
              </div>
            </section>

            <section>
              <div className="px-3 mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">Explorer</h2>
                <PlusCircle className="w-4 h-4 text-rose-300 cursor-pointer hover:text-primary transition-colors" />
              </div>
              <div className="space-y-1">
                <SidebarItem icon={<Folder className="w-5 h-5 text-secondary" />} label="Documentation" hasChevron />
                <div className="flex flex-col">
                  <SidebarItem icon={<FolderOpen className="w-5 h-5 text-accent" />} label="Assets" isOpen />
                  <div className="ml-6 border-l-2 border-rose-100 pl-3 mt-1 space-y-1">
                    <SidebarItem icon={<ImageIcon className="w-4 h-4 text-green-300" />} label="hero-bg.png" small />
                    <SidebarItem icon={<ImageIcon className="w-4 h-4 text-purple-300" />} label="logo-dark.svg" small />
                  </div>
                </div>
                <SidebarItem icon={<FileText className="w-5 h-5 text-primary/70" />} label="Getting_Started.md" />
                <SidebarItem icon={<FileText className="w-5 h-5 text-primary/70" />} label="API_Reference.md" />
              </div>
            </section>

            <section>
              <div className="px-3 mb-2">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">Recent</h2>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-rose-50 transition-colors cursor-pointer">
                  <History className="w-5 h-5 text-rose-200" />
                  <div className="flex flex-col flex-1 truncate">
                    <span className="truncate text-sm font-medium">Changelog.md</span>
                    <span className="text-[10px] text-rose-300 font-bold uppercase">2 hours ago</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="p-4 border-t border-rose-100 space-y-1">
            <SidebarItem 
              icon={<Search className="w-5 h-5 text-slate-400" />} 
              label="Search" 
              onClick={() => setIsSearchModalOpen(true)}
            />
            <SidebarItem 
              icon={<Settings className="w-5 h-5 text-slate-400" />} 
              label="Settings" 
              onClick={() => setIsSettingsModalOpen(true)}
            />
          </div>
        </aside>

        {/* Editor Pane */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <section className="flex-1 border-r border-border-soft flex flex-col relative bg-white overflow-hidden">
            <div className="absolute top-6 left-8 text-[11px] font-extrabold text-primary/60 uppercase tracking-widest z-10 pointer-events-none bg-primary/5 px-2 py-0.5 rounded-md">
              Markdown Editor
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <CodeMirror
                ref={editorRef}
                value={markdown}
                height="100%"
                className="flex-1 text-sm font-mono"
                theme={getThemeExtension(editorTheme)}
                extensions={[
                  markdownLang({ base: markdownLanguage, codeLanguages: languages }),
                  markdownLinter,
                  autocompletion({ override: [markdownCompletions] }),
                  EditorView.lineWrapping,
                  EditorView.theme({
                    "&": {
                      height: "100%",
                      backgroundColor: "transparent !important",
                    },
                    ".cm-scroller": {
                      overflow: "auto",
                      padding: "48px 12px 48px 12px",
                    },
                    ".cm-content": {
                      fontFamily: "'JetBrains Mono', monospace",
                    },
                    ".cm-gutters": {
                      backgroundColor: "transparent !important",
                      border: "none !important",
                    }
                  })
                ]}
                onChange={(value) => setMarkdown(value)}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightSpecialChars: true,
                  history: true,
                  drawSelection: true,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: true,
                  syntaxHighlighting: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  rectangularSelection: true,
                  crosshairCursor: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  closeBracketsKeymap: true,
                  defaultKeymap: true,
                  searchKeymap: true,
                  historyKeymap: true,
                  foldKeymap: true,
                  completionKeymap: true,
                  lintKeymap: true,
                }}
              />
            </div>
          </section>
        )}

        {/* Preview Pane */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <section 
            ref={previewRef}
            className={cn("flex-1 overflow-y-auto relative transition-colors duration-500", previewTheme)}
          >
            <div className="absolute top-6 left-8 text-[11px] font-extrabold text-secondary uppercase tracking-widest pointer-events-none bg-secondary/10 px-2 py-0.5 rounded-md z-10">
              Live Preview
            </div>
            <div className="p-16 max-w-none markdown-body">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 id={String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}>{children}</h1>,
                  h2: ({ children }) => <h2 id={String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}>{children}</h2>,
                  h3: ({ children }) => <h3 id={String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}>{children}</h3>,
                  h4: ({ children }) => <h4 id={String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}>{children}</h4>,
                  h5: ({ children }) => <h5 id={String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}>{children}</h5>,
                  h6: ({ children }) => <h6 id={String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}>{children}</h6>,
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const [copied, setCopied] = useState(false);

                    const handleCopy = () => {
                      navigator.clipboard.writeText(String(children));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    };

                    return !inline && match ? (
                      <div className="relative group my-8">
                        <div className="rounded-3xl overflow-hidden border-2 border-border-soft shadow-xl bg-white">
                          <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-border-soft">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-rose-300"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-300"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-300"></div>
                              <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                {match[1]}
                              </span>
                            </div>
                            
                            <button 
                              onClick={handleCopy}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all border-2",
                                copied 
                                  ? "bg-green-50 border-green-100 text-green-600" 
                                  : "bg-white border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5"
                              )}
                            >
                              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5 rotate-180" />}
                              <span className="text-[10px] font-bold uppercase tracking-wider">{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={oneLight}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: '0.125rem 0.25rem',
                              fontSize: '0.875rem',
                              lineHeight: '1.7',
                              background: 'transparent',
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ) : (
                      <code className={cn("bg-secondary/10 text-secondary px-2 py-0.5 rounded-lg font-mono text-sm font-bold", className)} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {/* Outline Sidebar */}
        <aside className="w-56 border-l border-border-soft bg-white hidden lg:flex flex-col shrink-0">
          <div className="p-6 border-b border-border-soft flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Outline</span>
            <Settings2 className="w-4 h-4 text-slate-300 cursor-pointer hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="space-y-1 pl-2">
              {headings.length > 0 ? (
                headings.map((heading) => (
                  <OutlineItem 
                    key={heading.id}
                    label={heading.text} 
                    active={activeOutlineId === heading.id}
                    sub={heading.level > 1}
                    onClick={() => scrollToSection(heading.id)}
                  />
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No headings found</p>
                </div>
              )}
            </nav>
          </div>
          <div className="p-6 border-t border-border-soft">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-4">
              <span className="bg-slate-100 px-2 py-0.5 rounded">{markdown.split(/\s+/).filter(Boolean).length} Words</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded">{markdown.length} Chars</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_8px_rgba(255,143,171,0.3)] transition-all duration-500" 
                style={{ width: `${Math.min((markdown.length / 2000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </aside>
      </div>
  )
}
