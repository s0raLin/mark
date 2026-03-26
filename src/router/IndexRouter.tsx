
import { HashRouter, Route, Routes } from 'react-router-dom';
import EditorView from '../views/Edit/EditorView';
import { KeyboardShortcutsProvider } from '../contexts/KeyboardShortcutsContext';

export default function IndexRouter() {
  return (
    <HashRouter>
      <KeyboardShortcutsProvider>
        <Routes>
          <Route path="/" element={<EditorView />}/>
        </Routes>
      </KeyboardShortcutsProvider>
    </HashRouter>
  );
}
