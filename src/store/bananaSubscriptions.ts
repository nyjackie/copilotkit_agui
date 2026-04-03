import { todoEvents } from "./eventBus";
import { useBananaStore } from "./bananaStore";

const BANANA_PATTERN = /banana/i;

export function subscribeBananaEaster(): () => void {
  return todoEvents.on("todo:added", ({ description }) => {
    if (BANANA_PATTERN.test(description)) {
      useBananaStore.getState().show();
    }
  });
}
