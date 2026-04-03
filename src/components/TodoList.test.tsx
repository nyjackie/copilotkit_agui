import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useTodoStore } from "../store/TodoStore";
import { TodoList } from "./TodoList";

beforeEach(() => {
  useTodoStore.setState({ todos: [] });
});

describe("TodoList", () => {
  it("shows empty state message when there are no todos", () => {
    render(<TodoList />);
    expect(screen.getByText("No todos yet")).toBeInTheDocument();
  });

  it("renders todo items when the list is not empty", () => {
    useTodoStore.getState().addTodo("Buy groceries");
    useTodoStore.getState().addTodo("Walk the dog");
    render(<TodoList />);
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
    expect(screen.queryByText("No todos yet")).not.toBeInTheDocument();
  });

  it("renders a checkbox and delete button for each todo", () => {
    useTodoStore.getState().addTodo("Test todo");
    render(<TodoList />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });
});
