import { useEffect } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TodoList } from "./components/TodoList";
import { CopilotPanel } from "./components/CopilotPanel";
import { ToastContainer } from "./components/ToastContainer";
import { BananaOverlay } from "./components/BananaOverlay";
import { subscribeTodoToasts } from "./store/toastSubscriptions";
import { subscribeBananaEaster } from "./store/bananaSubscriptions";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    const unsubs = [subscribeTodoToasts(), subscribeBananaEaster()];
    return () => unsubs.forEach((fn) => fn());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CopilotKit runtimeUrl="/api/copilotkit">
        <div className="app-layout">
          <div className="chat-section">
            <CopilotPanel />
          </div>
          <div className="todo-section">
            <h2>My Todos</h2>
            <TodoList />
          </div>
        </div>
        <ToastContainer />
        <BananaOverlay />
      </CopilotKit>
    </QueryClientProvider>
  );
}

export default App;
