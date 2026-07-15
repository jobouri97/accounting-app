export function asyncHandler(handler, fallbackMessage) {
  return function handleAsyncRequest(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch((error) => {
      const normalizedError = error instanceof Error
        ? error
        : new Error("Request handler rejected without an Error object");

      normalizedError.fallbackMessage ??= fallbackMessage;
      next(normalizedError);
    });
  };
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(`${req.method} ${req.originalUrl} error:`, error);

  const status = Number.isInteger(error.status)
    ? error.status
    : Number.isInteger(error.statusCode)
      ? error.statusCode
      : 500;
  const message = status >= 500
    ? error.fallbackMessage || "Internal server error"
    : error.message;

  return res.status(status).json({ message });
}
