
import { HashRouter, Route, Routes } from 'react-router-dom';
import EditorView from '../views/Edit/EditorView';
import { KeyboardShortcutsBindings } from '../contexts/KeyboardShortcutsContext';

export default function IndexRouter() {
  return (
    <HashRouter>
      <KeyboardShortcutsBindings />
      <Routes>
        <Route path="/" element={<EditorView />}/>
      </Routes>
    </HashRouter>
  );
}
