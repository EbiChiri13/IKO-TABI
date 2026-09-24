const STEPS = ["希望", "行き先", "宿・ごはん", "スポット"];

// グループの status を、4段の進み具合の何段目にあたるかへ変換
const STEP_INDEX = {
  collecting: 0,
  destination: 1,
  lodging: 2,
  food: 2,
  spot: 3,
  done: 3,
};

/** 全画面の上部に出す4段の進み具合バー */
export default function ProgressSteps({ status }) {
  const current = STEP_INDEX[status] ?? 0;
  return (
    <ol className="steps" aria-label="旅行を決める進み具合">
      {STEPS.map((label, i) => (
        <li key={label} className={i < current ? "done" : i === current ? "now" : ""}>
          {label}
        </li>
      ))}
      <style jsx>{`
        .steps {
          list-style: none; margin: 0; padding: 10px 16px 0;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
          font-size: 0.72rem; color: var(--ink-400); text-align: center;
          background: var(--cream-200);
        }
        li { position: relative; padding-top: 10px; }
        li::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0;
          height: 5px; border-radius: 3px; background: var(--line);
        }
        li.done::before { background: var(--teal-500); }
        li.now::before { background: var(--teal-600); }
        li.now { color: var(--teal-700); font-weight: 700; }
      `}</style>
    </ol>
  );
}
