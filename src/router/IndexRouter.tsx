
import { HashRouter, Route, Routes } from 'react-router-dom';
import EditorView from '../views/Edit/EditorView';

export default function IndexRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<EditorView />}/>
      </Routes>
    </HashRouter>
  );
}
