import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTodoStore } from "./TodoStore";
import { todoEvents } from "./eventBus";

// Reset zustand store between tests
beforeEach(() => {
  useTodoStore.setState({ todos: [] });
});

describe("TodoStore", () => {
  describe("addTodo", () => {
    it("adds a todo with correct fields", () => {
      useTodoStore.getState().addTodo("Buy milk");
      const todos = useTodoStore.getState().todos;
      expect(todos).toHaveLength(1);
      expect(todos[0].description).toBe("Buy milk");
      expect(todos[0].completed).toBe(false);
      expect(todos[0].id).toBeTruthy();
    });

    it("rejects empty string", () => {
      useTodoStore.getState().addTodo("");
      expect(useTodoStore.getState().todos).toHaveLength(0);
    });

    it("rejects whitespace-only string", () => {
      useTodoStore.getState().addTodo("   ");
      expect(useTodoStore.getState().todos).toHaveLength(0);
    });

    it("generates unique IDs", () => {
      useTodoStore.getState().addTodo("First");
      useTodoStore.getState().addTodo("Second");
      const todos = useTodoStore.getState().todos;
      expect(todos[0].id).not.toBe(todos[1].id);
    });
  });

  describe("toggleTodo", () => {
    it("flips completed from false to true", () => {
      useTodoStore.getState().addTodo("Task");
      const id = useTodoStore.getState().todos[0].id;
      useTodoStore.getState().toggleTodo(id);
      expect(useTodoStore.getState().todos[0].completed).toBe(true);
    });

    it("flips completed back to false", () => {
      useTodoStore.getState().addTodo("Task");
      const id = useTodoStore.getState().todos[0].id;
      useTodoStore.getState().toggleTodo(id);
      useTodoStore.getState().toggleTodo(id);
      expect(useTodoStore.getState().todos[0].completed).toBe(false);
    });

    it("is a no-op for non-existent ID", () => {
      useTodoStore.getState().addTodo("Task");
      const before = useTodoStore.getState().todos;
      useTodoStore.getState().toggleTodo("non-existent");
      expect(useTodoStore.getState().todos).toEqual(before);
    });
  });

  describe("deleteTodo", () => {
    it("removes the targeted todo", () => {
      useTodoStore.getState().addTodo("Task");
      const id = useTodoStore.getState().todos[0].id;
      useTodoStore.getState().deleteTodo(id);
      expect(useTodoStore.getState().todos).toHaveLength(0);
    });

    it("is a no-op for non-existent ID", () => {
      useTodoStore.getState().addTodo("Task");
      const before = useTodoStore.getState().todos;
      useTodoStore.getState().deleteTodo("non-existent");
      expect(useTodoStore.getState().todos).toEqual(before);
    });
  });
});

describe("EventBus observer pattern", () => {
  it("emits todo:added on addTodo", () => {
    const handler = vi.fn();
    const unsub = todoEvents.on("todo:added", handler);
    useTodoStore.getState().addTodo("Test");
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Test" })
    );
    unsub();
  });

  it("emits todo:toggled on toggleTodo", () => {
    const handler = vi.fn();
    useTodoStore.getState().addTodo("Task");
    const id = useTodoStore.getState().todos[0].id;
    const unsub = todoEvents.on("todo:toggled", handler);
    useTodoStore.getState().toggleTodo(id);
    expect(handler).toHaveBeenCalledWith({ id, completed: true });
    unsub();
  });

  it("emits todo:deleted on deleteTodo", () => {
    const handler = vi.fn();
    useTodoStore.getState().addTodo("Task");
    const id = useTodoStore.getState().todos[0].id;
    const unsub = todoEvents.on("todo:deleted", handler);
    useTodoStore.getState().deleteTodo(id);
    expect(handler).toHaveBeenCalledWith({ id });
    unsub();
  });

  it("emits todo:changed on every mutation", () => {
    const handler = vi.fn();
    const unsub = todoEvents.on("todo:changed", handler);
    useTodoStore.getState().addTodo("Task");
    const id = useTodoStore.getState().todos[0].id;
    useTodoStore.getState().toggleTodo(id);
    useTodoStore.getState().deleteTodo(id);
    expect(handler).toHaveBeenCalledTimes(3);
    unsub();
  });

  it("stops notifying after unsubscribe", () => {
    const handler = vi.fn();
    const unsub = todoEvents.on("todo:added", handler);
    unsub();
    useTodoStore.getState().addTodo("Task");
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not emit on rejected addTodo", () => {
    const handler = vi.fn();
    const unsub = todoEvents.on("todo:added", handler);
    useTodoStore.getState().addTodo("");
    useTodoStore.getState().addTodo("   ");
    expect(handler).not.toHaveBeenCalled();
    unsub();
  });
});
