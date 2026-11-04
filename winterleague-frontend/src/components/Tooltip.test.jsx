import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tooltip from './Tooltip';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup() {
  render(
    <>
      <Tooltip label="Score Total">Compare the fifth-best score, then the sixth.</Tooltip>
      <button>Outside</button>
    </>,
  );
  return screen.getByRole('button', { name: 'Score Total' });
}

function advance(ms) {
  act(() => vi.advanceTimersByTime(ms));
}

test('opens on hover, stays open over its content, then closes on leaving', () => {
  const trigger = setup();
  fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  advance(250);

  const tooltip = screen.getByRole('tooltip');
  expect(trigger).toHaveAccessibleDescription(tooltip.textContent);
  expect(tooltip.parentElement).toBe(document.body);

  fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
  fireEvent.pointerEnter(tooltip, { pointerType: 'mouse' });
  advance(500);
  expect(tooltip).toBeInTheDocument();
  fireEvent.pointerLeave(tooltip, { pointerType: 'mouse' });
  advance(120);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('opens on keyboard focus, dismisses with Escape, and leaves focus on the trigger', () => {
  const trigger = setup();
  userEvent.tab();
  expect(trigger).toHaveFocus();
  expect(screen.getByRole('tooltip')).toBeInTheDocument();
  fireEvent.keyDown(trigger, { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();

  userEvent.tab();
  userEvent.tab({ shift: true });
  expect(screen.getByRole('tooltip')).toBeInTheDocument();
  userEvent.tab();
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('touch opens on the first tap, toggles on the next tap, and dismisses outside', () => {
  const trigger = setup();
  fireEvent.pointerEnter(trigger, { pointerType: 'touch' });
  advance(250);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

  fireEvent.pointerDown(trigger, { pointerType: 'touch' });
  fireEvent.focus(trigger);
  fireEvent.click(trigger);
  expect(screen.getByRole('tooltip')).toBeInTheDocument();
  fireEvent.pointerLeave(trigger, { pointerType: 'touch' });
  advance(500);
  expect(screen.getByRole('tooltip')).toBeInTheDocument();

  fireEvent.click(trigger);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.click(trigger);
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('keeps the tooltip within the viewport when the trigger is at its lower right edge', () => {
  const trigger = setup();
  vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
    left: window.innerWidth - 100, right: window.innerWidth,
    top: window.innerHeight - 40, bottom: window.innerHeight, width: 100, height: 40,
  });
  const bounds = vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 320, height: 200,
  });
  fireEvent.focus(trigger);
  expect(screen.getByRole('tooltip')).toHaveStyle({
    left: `${window.innerWidth - 320 - 16}px`, top: `${window.innerHeight - 40 - 200 - 8}px`,
  });
  bounds.mockRestore();
});
