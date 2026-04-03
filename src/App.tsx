import { useEffect } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TodoList } from "./components/TodoList";
import { CopilotPanel } from "./components/CopilotPanel";
import { ToastContainer } from "./components/ToastContainer";
import { subscribeTodoToasts } from "./store/toastSubscriptions";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  useEffect(() => subscribeTodoToasts(), []);

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
      </CopilotKit>
    </QueryClientProvider>
  );
}

export default App;
