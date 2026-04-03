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

## Pros & Cons at a Glance

| Pros | Cons |
|------|------|
| Loose coupling — domains only share the event bus | Implicit flow — need to search for subscribers |
| Type-safe events — compile-time errors on typos | Leak risk — must remember to unsubscribe |
| Testable without React — `getState()` + `vi.fn()` | No built-in replay or time-travel debugging |
| Team-friendly — clear ownership, small PR scope | Event explosion risk in very large apps |
| AI and UI share the same code path | Subscriber ordering is implicit |

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

### Scalability

- **Zero-touch feature addition** — adding toast notifications required 0 changes to the todo domain. New cross-cutting concerns (analytics, logging, sync) follow the same pattern: one subscription file + one `useEffect` line in App.
- **Independent domain growth** — each domain (todos, toasts, future: projects, users) gets its own zustand store and event map. Teams can build in parallel without merge conflicts on shared state files.
- **Unlimited subscribers per event** — the event bus supports any number of listeners. When `todo:added` fires, it can simultaneously trigger a toast, an analytics call, a cache invalidation, and a WebSocket broadcast — all without the producer knowing.
- **New domains don't affect existing ones** — adding a `ProjectStore` with its own `ProjectEventMap` requires zero imports from the todo domain. The event bus is generic; you just instantiate another one.

### Maintainability

- **One place to look** — state bugs → check the zustand store. Event not firing → check the store's `emit` call. Subscriber not reacting → check the subscription file. Each concern has exactly one location.
- **Type-safe contracts** — the event bus is fully typed. Misspelling `"todo:addd"` or passing `{ desc: "..." }` instead of `{ description: "..." }` is a compile-time error. Refactoring event shapes is safe.
- **Testable without React** — zustand stores are testable via `getState()`/`setState()`. Event subscriptions are testable with `vi.fn()`. No `renderHook`, no providers, no component tree needed for core logic tests.
- **Clear ownership boundaries** — todo files never import toast files and vice versa. Code review scope is small and predictable. A PR that adds analytics touches 2 files, not 15.
- **AI and UI share the same path** — CopilotKit actions call the same zustand mutations as UI buttons. There's no separate "AI code path" to maintain. A bug fix in `toggleTodo` fixes it for both human and AI interactions.

### General

- **Small API surface** — the event bus is ~30 lines. Zustand stores are plain objects. No framework-specific abstractions, decorators, or boilerplate to learn.
- **Incremental adoption** — you can introduce this to one domain at a time. Existing Redux/Context code can coexist during migration.
- **Server-state ready** — React Query is wired at the provider level. When you add API persistence, mutations go through zustand (optimistic), React Query handles sync, and `todo:changed` events trigger cache invalidation.

## Cons

### Scalability

- **Event explosion** — in a large app, the number of event types can grow fast. Namespacing (`todo:added`, `project:created`) helps, but without governance you can end up with hundreds of event types that are hard to discover. Mitigation: keep event maps co-located with their domain store and document them.
- **No built-in backpressure** — if a subscriber is slow (e.g., a network call), it blocks the synchronous emit loop. For high-frequency events, you'd need to add async dispatch or debouncing at the subscriber level.

### Maintainability

- **Implicit data flow** — when you read `todoEvents.emit("todo:added", ...)` in the store, you can't see what happens next without searching for `on("todo:added")`. IDE "find all references" helps, but it's less obvious than a direct function call. New team members need to understand the subscription pattern.
- **Leak risk** — forgetting to call the unsubscribe function returned by `on()` will leak listeners. The `useEffect` cleanup pattern mitigates this in React, but non-React subscribers (e.g., in a service worker) need manual discipline.
- **No replay or time-travel** — unlike Redux DevTools, there's no built-in event log. If you need to debug "what happened 5 steps ago," you'd need to add a logging middleware to the bus. This is straightforward but not free.
- **Ordering assumptions** — subscribers fire in registration order. If subscriber A depends on subscriber B having run first, that's an implicit contract that's invisible in the code. Keep subscribers independent to avoid this.

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
