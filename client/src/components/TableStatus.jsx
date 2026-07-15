import "./TableStatus.css";

function TableStatus({ children }) {
  return (
    <div className="table-status" role="status" aria-live="polite">
      {children}
    </div>
  );
}

export default TableStatus;
