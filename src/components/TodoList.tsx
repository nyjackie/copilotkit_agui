import { useTodoStore } from "../store/TodoStore";
import { TodoItemRow } from "./TodoItemRow";

export function TodoList() {
  const todos = useTodoStore((s) => s.todos);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);

  if (todos.length === 0) {
    return <p>No todos yet</p>;
  }

  return (
    <ul>
      {todos.map((todo) => (
        <TodoItemRow
          key={todo.id}
          todo={todo}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />
      ))}
    </ul>
  );
}
