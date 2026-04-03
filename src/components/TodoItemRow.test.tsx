import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItemRow } from './TodoItemRow';
import type { TodoItem } from '../store/TodoStore';

describe('TodoItemRow', () => {
  const incompleteTodo: TodoItem = { id: '1', description: 'Buy milk', completed: false };
  const completedTodo: TodoItem = { id: '2', description: 'Walk dog', completed: true };

  it('renders description text', () => {
    render(<TodoItemRow todo={incompleteTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('renders unchecked checkbox for incomplete todo', () => {
    render(<TodoItemRow todo={incompleteTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders checked checkbox for completed todo', () => {
    render(<TodoItemRow todo={completedTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('applies strikethrough for completed todo', () => {
    render(<TodoItemRow todo={completedTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const span = screen.getByText('Walk dog');
    expect(span.style.textDecoration).toBe('line-through');
  });

  it('does not apply strikethrough for incomplete todo', () => {
    render(<TodoItemRow todo={incompleteTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    const span = screen.getByText('Buy milk');
    expect(span.style.textDecoration).toBe('none');
  });

  it('calls onToggle with todo id when checkbox is clicked', async () => {
    const onToggle = vi.fn();
    render(<TodoItemRow todo={incompleteTodo} onToggle={onToggle} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('calls onDelete with todo id when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<TodoItemRow todo={incompleteTodo} onToggle={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
