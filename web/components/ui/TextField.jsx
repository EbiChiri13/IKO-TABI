"use client";

import { useId } from "react";

export default function TextField({ label, hint, error, ...inputProps }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      {label && (
        <span className="field-label">
          {label}
          {hint && <span className="field-hint">{hint}</span>}
        </span>
      )}
      <input id={id} className="field-input" aria-invalid={!!error} {...inputProps} />
      {error && <span className="field-error">{error}</span>}
      <style jsx>{`
        .field { display: block; margin-bottom: 16px; font-weight: 700; }
        .field-label { display: block; margin-bottom: 6px; }
        .field-hint { font-weight: 500; color: var(--ink-400); font-size: 0.8rem; margin-left: 6px; }
        .field-input {
          display: block; width: 100%;
          min-height: 52px; padding: 12px 16px;
          border: 1.5px solid var(--line); border-radius: var(--radius-sm);
          background: var(--white); color: var(--ink-900);
          font-size: 1rem; font-weight: 500;
        }
        .field-input::placeholder { color: var(--ink-400); }
        .field-input:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--teal-600) 45%, transparent);
          outline-offset: 1px;
        }
        .field-input[aria-invalid="true"] { border-color: var(--danger); }
        .field-error { display: block; margin-top: 6px; color: var(--danger); font-size: 0.82rem; font-weight: 500; }
      `}</style>
    </label>
  );
}
