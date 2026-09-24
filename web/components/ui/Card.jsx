export default function Card({ as: Tag = "div", children, className = "", ...rest }) {
  return (
    <Tag className={`card ${className}`} {...rest}>
      {children}
      <style jsx>{`
        .card {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
          padding: 18px;
        }
      `}</style>
    </Tag>
  );
}
