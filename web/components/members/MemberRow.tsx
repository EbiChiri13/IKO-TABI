import Badge from "@/components/ui/Badge";

/** メンバー1人分の行（回答待ち画面）。公開を選んだ人だけタグが見える【Q16】 */
export default function MemberRow({ nickname, role, answered, isMe, tags }) {
  return (
    <li className="row">
      <div className="head">
        <span className="name">
          {nickname}
          {isMe && <span className="you">（あなた）</span>}
        </span>
        {role === "host" && <Badge tone="host">幹事</Badge>}
        <span className="spacer" />
        <Badge tone={answered ? "ok" : "wait"}>{answered ? "回答済み" : "未回答"}</Badge>
      </div>
      {tags && (
        <p className="tags">
          {tags.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </p>
      )}
      <style jsx>{`
        .row { padding: 10px 0; border-top: 1px solid var(--line); }
        .row:first-child { border-top: 0; }
        .head { display: flex; align-items: center; gap: 8px; }
        .name { font-weight: 800; }
        .you { font-weight: 500; color: var(--ink-400); font-size: 0.82rem; }
        .spacer { flex: 1; }
        .tags { margin-top: 6px; }
        .tag {
          display: inline-block; font-size: 0.75rem; padding: 2px 9px; border-radius: var(--radius-pill);
          background: var(--cream-100); color: var(--ink-600); margin: 2px 4px 0 0;
        }
      `}</style>
    </li>
  );
}
