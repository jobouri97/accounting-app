import "./FormError.css";

function FormError({ message, onDismiss }) {
    if (!message) {
        return null;
    }

    return (
        <div className="form-error-message" role="alert">
            <span>{message}</span>

            <button
                type="button"
                className="form-error-close"
                onClick={onDismiss}
                aria-label="Dismiss error"
                title="Dismiss"
            >
                &times;
            </button>
        </div>
    );
}

export default FormError;
