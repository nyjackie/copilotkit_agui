/**
 * Generic typed event bus — the observer pattern backbone.
 * Any part of the app can subscribe to domain events without coupling to state.
 * Scalable: just add new event types to the map.
 */

export type TodoEventMap = {
  "todo:added": { id: string; description: string };
  "todo:toggled": { id: string; completed: boolean };
  "todo:deleted": { id: string };
  "todo:changed": void;
};

type EventCallback<T> = T extends void ? () => void : (payload: T) => void;

class EventBus<TMap extends Record<string, unknown>> {
  private listeners = new Map<keyof TMap, Set<EventCallback<any>>>();

  on<K extends keyof TMap>(event: K, callback: EventCallback<TMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off<K extends keyof TMap>(event: K, callback: EventCallback<TMap[K]>): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit<K extends keyof TMap>(
    ...args: TMap[K] extends void ? [event: K] : [event: K, payload: TMap[K]]
  ): void {
    const [event, payload] = args;
    this.listeners.get(event)?.forEach((cb) => cb(payload));
  }
}

export const todoEvents = new EventBus<TodoEventMap>();
