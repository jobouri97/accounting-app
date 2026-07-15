import DismissibleError from "./DismissibleError";

function FormError({ message, onDismiss }) {
    return <DismissibleError message={message} onDismiss={onDismiss} />;
}

export default FormError;
