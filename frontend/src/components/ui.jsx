export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

export function Spinner() {
  return <div className="spinner" />;
}

export function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}
