type Callback = (index: number) => void;
type VoidCallback = () => void;

let onAnswerSelect: Callback | null = null;
let onNextQuestion: VoidCallback | null = null;
let onEscape: VoidCallback | null = null;
let enabled = true;

function handleKeyPress(e: KeyboardEvent): void {
  if (!enabled) return;

  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

  const key = e.key.toUpperCase();
  const code = e.code;

  if (['A', 'B', 'C', 'D'].includes(key)) {
    e.preventDefault();
    onAnswerSelect?.(key.charCodeAt(0) - 65);
  } else if (['1', '2', '3', '4'].includes(key)) {
    e.preventDefault();
    onAnswerSelect?.(parseInt(key) - 1);
  }

  if (code === 'Space' || code === 'Enter') {
    // A focused button or link handles Enter/Space itself (that is how
    // keyboard users press "Next", a lifeline or "Play again"). Hijacking the
    // key there made those controls impossible to activate (WCAG 2.1.1).
    const tag = active?.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'SELECT') return;
    e.preventDefault();
    onNextQuestion?.();
  }

  if (code === 'Escape') {
    e.preventDefault();
    onEscape?.();
  }
}

export function initKeyboard(): void {
  document.addEventListener('keydown', handleKeyPress);
}

export function setAnswerCallback(cb: Callback): void { onAnswerSelect = cb; }
export function setNextCallback(cb: VoidCallback): void { onNextQuestion = cb; }
export function setEscapeCallback(cb: VoidCallback): void { onEscape = cb; }
export function setEnabled(v: boolean): void { enabled = v; }
