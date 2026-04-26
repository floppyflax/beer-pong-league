/**
 * CodeInput — Everything ELO DS (§5.2)
 *
 * OTP-style code input with N separate boxes (default: 6).
 * Used in Join, EventJoin, AuthCallback OTP flows.
 *
 * - uppercase=true by default (6-char join codes are uppercase)
 * - Filters to alphanumeric only
 * - Auto-advances focus to next box on input
 * - Backspace on empty box focuses previous
 */

import { useRef } from 'react';
import clsx from 'clsx';

export interface CodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  /** Active / focused highlight state */
  active?: boolean;
  uppercase?: boolean;
  className?: string;
}

export function CodeInput({
  length = 6,
  value,
  onChange,
  autoFocus = false,
  active = false,
  uppercase = true,
  className,
}: CodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = value.padEnd(length, '').slice(0, length).split('');

  const handleInput = (i: number, raw: string) => {
    const ch = uppercase ? raw.toUpperCase() : raw;
    const filtered = ch.replace(/[^A-Z0-9]/gi, '').slice(0, 1);
    if (!filtered) return;

    const next = chars.slice();
    next[i] = filtered;
    onChange(next.join('').trimEnd());

    // Advance focus
    if (i < length - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[i]) {
        const next = chars.slice();
        next[i] = '';
        onChange(next.join('').trimEnd());
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < length - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/[^A-Z0-9]/gi, '')
      .slice(0, length);
    onChange(uppercase ? pasted.toUpperCase() : pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div
      className={clsx('flex gap-2', className)}
      data-testid="code-input"
    >
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="text"
          maxLength={1}
          value={ch.trim()}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          aria-label={`Caractère ${i + 1} sur ${length}`}
          className={clsx(
            'w-10 h-12 text-center text-lg font-mono font-bold rounded-md border transition-colors',
            'bg-navy-soft text-white',
            ch.trim()
              ? 'border-electric-blue text-white'
              : active
                ? 'border-electric-blue/60'
                : 'border-card',
            'focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue/30',
          )}
          data-testid={`code-input-box-${i}`}
        />
      ))}
    </div>
  );
}
