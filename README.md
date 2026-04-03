# Architecture: Event-Driven State Management

## Core Libraries

| Library | Role |
|---------|------|
| React 19 + TypeScript | UI framework |
| Zustand | Client-side state management (one store per domain) |
| React Query | Server-state caching and async data (wired, ready for API layer) |
| CopilotKit | AI chat UI + action/readable hooks for agent integration |
| AG-UI Protocol | Standardized event-streaming interface between frontend and AI agent backend |
| Vitest + fast-check | Unit and property-based testing |

## The Idea

Domains own their state independently (Zustand). They talk to each other through a typed event bus (observer pattern). No domain imports another domain's store.

```
  TodoStore ──emits──► Event Bus ◄──subscribes── ToastSubscriptions ──► ToastStore
      │                                                                      │
   TodoList                                                            ToastContainer
```

## Three Layers

| Layer | What | Tech |
|-------|------|------|
| State | Each domain has its own Zustand store | `useTodoStore`, `useToastStore` |
| Events | Stores emit typed events after mutations | Generic `EventBus<TMap>` (~30 LOC) |
| Subscriptions | Thin wiring files connect events → actions | e.g. `toastSubscriptions.ts` (15 LOC) |

## Adding a Feature

When we added toast notifications that react to todo changes:

- Files created: 3 (toast store, subscription wiring, toast UI)
- Files modified: 1 (App.tsx — one `useEffect` line)
- Files in todo domain touched: **0**

Adding analytics, logging, or any other cross-cutting concern follows the same pattern: create a subscription file, wire it in App.

## Pros

- **Loose coupling** — domains don't import each other, only the event bus
- **Type-safe events** — wrong event name or payload shape = compile error
- **Easy to test** — stores testable via `getState()` without React; events testable with `vi.fn()`
- **Team-friendly** — clear ownership boundaries, minimal merge conflicts
- **AI-compatible** — CopilotKit reads/writes the same store as the UI

## Cons

- **Implicit flow** — event subscribers aren't visible at the call site; need to search for `on("event")`
- **Leak risk** — forgetting to unsubscribe leaks listeners (mitigated by `useEffect` cleanup)
- **No replay** — unlike Redux, no built-in event log or time-travel debugging

## When to Use

Good for apps with multiple feature domains and cross-cutting concerns. Overkill for single-page forms or very simple UIs.

## Analytics & User Tracking via Event Lifecycle

Because every meaningful action already emits an event, analytics becomes a passive subscriber — no instrumentation scattered across components.

### The idea: middleware on the bus

Add a lifecycle hook to the event bus so every event automatically passes through analytics before reaching subscribers:

```
  User clicks "complete" → TodoStore.toggleTodo()
       │
       ▼
  todoEvents.emit("todo:toggled", { id, completed })
       │
       ├──► [middleware] analytics.track("todo:toggled", { id, completed, timestamp })
       ├──► [subscriber] toast: "Todo completed"
       └──► [subscriber] (future) sync to server
```

### What this gives you

- **Full user journey** — every domain event is an analytics event for free. No manual `track()` calls in components.
- **Consistent data shape** — the typed event payloads become your analytics schema. If the event has `{ id, description }`, that's exactly what analytics receives.
- **Source attribution** — extend event payloads with a `source` field (`"ui"` | `"ai"` | `"api"`) to distinguish how an action was triggered. This tells you how often users rely on the AI vs direct interaction.
- **Session replay** — log all events with timestamps and you get a replayable session timeline without a third-party SDK.

### Example: middleware approach

```typescript
// In eventBus.ts — add a middleware hook
class EventBus<TMap> {
  private middlewares: Array<(event: string, payload: unknown) => void> = [];

  use(fn: (event: string, payload: unknown) => void) {
    this.middlewares.push(fn);
  }

  emit(event, payload) {
    this.middlewares.forEach(fn => fn(event as string, payload));  // lifecycle hook
    this.listeners.get(event)?.forEach(cb => cb(payload));        // normal dispatch
  }
}

// In analyticsSubscriptions.ts — one file, zero changes to any store
todoEvents.use((event, payload) => {
  analytics.track(event, { ...payload, timestamp: Date.now() });
});
```

### What you can track without touching any existing code

| Event | Analytics insight |
|-------|------------------|
| `todo:added` | Feature adoption, task creation rate |
| `todo:toggled` | Completion rate, time-to-complete |
| `todo:deleted` | Abandonment patterns |
| `todo:changed` | Overall engagement frequency |

The pattern scales to any new domain — `project:created`, `user:logged_in`, `search:executed` — all automatically flow through the same middleware pipeline.
