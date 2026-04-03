import { todoEvents } from "./eventBus";
import { useToastStore } from "./toastStore";

/**
 * Subscribe toasts to todo events.
 * Call once at app startup — returns cleanup function.
 */
export function subscribeTodoToasts(): () => void {
  const { addToast } = useToastStore.getState();

  const unsubs = [
    todoEvents.on("todo:added", ({ description }) => {
      addToast(`Added: "${description}"`, "success");
    }),
    todoEvents.on("todo:toggled", ({ id, completed }) => {
      addToast(`Todo ${completed ? "completed" : "reopened"}`, "info");
    }),
    todoEvents.on("todo:deleted", () => {
      addToast("Todo deleted", "info");
    }),
  ];

  return () => unsubs.forEach((fn) => fn());
}
