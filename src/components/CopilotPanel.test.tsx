import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTodoStore } from "../store/TodoStore";

const mockUseCopilotReadable = vi.fn();
const mockUseCopilotAction = vi.fn();

vi.mock("@copilotkit/react-core", () => ({
  useCopilotReadable: (...args: unknown[]) => mockUseCopilotReadable(...args),
  useCopilotAction: (...args: unknown[]) => mockUseCopilotAction(...args),
}));

vi.mock("@copilotkit/react-ui", () => ({
  CopilotChat: (props: any) => <div data-testid="copilot-chat">{props.className}</div>,
}));

vi.mock("@copilotkit/react-ui/styles.css", () => ({}));

import { CopilotPanel } from "./CopilotPanel";

describe("CopilotPanel", () => {
  beforeEach(() => {
    useTodoStore.setState({ todos: [] });
    mockUseCopilotReadable.mockClear();
    mockUseCopilotAction.mockClear();
  });

  it("renders the CopilotChat", () => {
    render(<CopilotPanel />);
    expect(screen.getByTestId("copilot-chat")).toBeInTheDocument();
  });

  it("registers readable state", () => {
    useTodoStore.getState().addTodo("Test");
    render(<CopilotPanel />);
    expect(mockUseCopilotReadable).toHaveBeenCalledWith({
      description: "The current todo list",
      value: useTodoStore.getState().todos,
    });
  });

  it("registers addTodo action", () => {
    render(<CopilotPanel />);
    const call = mockUseCopilotAction.mock.calls.find(
      (c: unknown[]) => (c[0] as { name: string }).name === "addTodo"
    );
    expect(call).toBeDefined();
    call![0].handler({ description: "New task" });
    expect(useTodoStore.getState().todos).toHaveLength(1);
  });

  it("registers toggleTodo action", () => {
    useTodoStore.getState().addTodo("Toggle me");
    const id = useTodoStore.getState().todos[0].id;
    render(<CopilotPanel />);
    const call = mockUseCopilotAction.mock.calls.find(
      (c: unknown[]) => (c[0] as { name: string }).name === "toggleTodo"
    );
    call![0].handler({ id });
    expect(useTodoStore.getState().todos[0].completed).toBe(true);
  });

  it("registers deleteTodo action", () => {
    useTodoStore.getState().addTodo("Delete me");
    const id = useTodoStore.getState().todos[0].id;
    render(<CopilotPanel />);
    const call = mockUseCopilotAction.mock.calls.find(
      (c: unknown[]) => (c[0] as { name: string }).name === "deleteTodo"
    );
    call![0].handler({ id });
    expect(useTodoStore.getState().todos).toHaveLength(0);
  });
});
