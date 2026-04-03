import type { TodoItem } from '../store/TodoStore';

interface TodoItemRowProps {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItemRow({ todo, onToggle, onDelete }: TodoItemRowProps) {
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Mark "${todo.description}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.description}
      </span>
      <button onClick={() => onDelete(todo.id)} aria-label={`Delete "${todo.description}"`}>
        Delete
      </button>
    </li>
  );
}
