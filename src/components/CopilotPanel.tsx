import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useTodoStore } from "../store/TodoStore";

export function CopilotPanel() {
  const todos = useTodoStore((s) => s.todos);
  const addTodo = useTodoStore((s) => s.addTodo);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);

  useCopilotReadable({ description: "The current todo list", value: todos });

  useCopilotAction({
    name: "addTodo",
    description: "Add a new todo item to the list",
    parameters: [{ name: "description", type: "string", required: true }],
    handler: ({ description }) => addTodo(description),
  });

  useCopilotAction({
    name: "toggleTodo",
    description: "Toggle a todo's completion status (mark as done or not done)",
    parameters: [{ name: "id", type: "string", required: true }],
    handler: ({ id }) => toggleTodo(id),
  });

  useCopilotAction({
    name: "deleteTodo",
    description: "Delete a todo item from the list",
    parameters: [{ name: "id", type: "string", required: true }],
    handler: ({ id }) => deleteTodo(id),
  });

  return (
    <CopilotChat
      className="chat-panel"
      instructions="You are a helpful todo assistant. You can add, complete, and delete todos for the user. When the user asks you to add tasks, use the addTodo action. When they want to mark something done, use toggleTodo. When they want to remove something, use deleteTodo. Always confirm what you did. Be concise and friendly."
      labels={{
        title: "Todo Assistant",
        initial: "Hi! I can help manage your todos. Try saying 'Add buy groceries' or 'Mark all as done'.",
      }}
    />
  );
}
