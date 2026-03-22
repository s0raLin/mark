import IndexRouter from "./router/IndexRouter";

export default function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <IndexRouter />
      </div>
    </div>
  );
}
