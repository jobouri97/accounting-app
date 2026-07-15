import "./DismissibleError.css";

function DismissibleError({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="dismissible-error" role="alert">
      <span>{message}</span>
      <button
        type="button"
        className="dismissible-error-close"
        onClick={onDismiss}
        aria-label="Dismiss error"
        title="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}

export default DismissibleError;
