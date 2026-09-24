"use client";

/** 「自分が選んだタグをメンバーに見せる」の切り替え（初期は非公開）【Q16】 */
export default function Switch({ checked, onChange, label, sub }) {
  return (
    <label className="switch">
      <span className="switch-text">
        <span className="switch-label">{label}</span>
        {sub && <span className="switch-sub">{sub}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <style jsx>{`
        .switch { display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; }
        .switch-text { display: flex; flex-direction: column; }
        .switch-label { font-weight: 700; }
        .switch-sub { font-size: 0.8rem; color: var(--ink-400); font-weight: 500; }
        input {
          appearance: none; width: 50px; height: 30px; border-radius: 999px;
          background: var(--line); position: relative; cursor: pointer; flex: none;
          transition: background 0.15s;
        }
        input::after {
          content: ""; position: absolute; top: 3px; left: 3px;
          width: 24px; height: 24px; border-radius: 50%; background: var(--white);
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
          transition: left 0.15s;
        }
        input:checked { background: var(--teal-600); }
        input:checked::after { left: 23px; }
        input:focus-visible { outline: 3px solid color-mix(in srgb, var(--teal-600) 45%, transparent); outline-offset: 2px; }
      `}</style>
    </label>
  );
}
