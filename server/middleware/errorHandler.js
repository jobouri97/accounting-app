export function asyncHandler(handler, fallbackMessage) { //asyncHandler is used around controller functions in nearly every route file
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

export function errorHandler(error, req, res, next) { //Express recognizes error middleware by its four parameters
                                                      //When an error occurs Express skips normal middleware and searches for the next middleware with four parameters (since normal middleware has three.)
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

/* They work together, but have different roles.
If the controller succeeds, the response continues normally.
If the controller throws an error, asyncHandler catches it and forwards it to the global errorHandler (to transform the error into json format)*/