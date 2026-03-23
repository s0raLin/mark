import IndexRouter from "./router/IndexRouter";
import { ErrorProvider } from "./contexts/ErrorContext";
import ErrorToast from "./components/ErrorToast";

export default function App() {
  return (
    <ErrorProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <IndexRouter />
        </div>
      </div>
      <ErrorToast />
    </ErrorProvider>
  );
}
