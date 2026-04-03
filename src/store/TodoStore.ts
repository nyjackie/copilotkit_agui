import { create } from "zustand";
import { nanoid } from "nanoid";
import { todoEvents } from "./eventBus";

export interface TodoItem {
  id: string;
  description: string;
  completed: boolean;
}

interface TodoState {
  todos: TodoItem[];
  addTodo: (description: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],

  addTodo: (description: string) => {
    if (!description || description.trim().length === 0) return;
    const id = nanoid();
    set((state) => ({
      todos: [...state.todos, { id, description, completed: false }],
    }));
    todoEvents.emit("todo:added", { id, description });
    todoEvents.emit("todo:changed");
  },

  toggleTodo: (id: string) => {
    const exists = get().todos.some((t) => t.id === id);
    if (!exists) return;
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
    const toggled = get().todos.find((t) => t.id === id);
    if (toggled) todoEvents.emit("todo:toggled", { id, completed: toggled.completed });
    todoEvents.emit("todo:changed");
  },

  deleteTodo: (id: string) => {
    const exists = get().todos.some((t) => t.id === id);
    if (!exists) return;
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    }));
    todoEvents.emit("todo:deleted", { id });
    todoEvents.emit("todo:changed");
  },
}));
