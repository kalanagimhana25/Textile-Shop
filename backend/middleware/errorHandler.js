export function notFoundHandler(_request, response) {
  response.status(404).json({
    status: "error",
    message: "Route not found.",
  });
}

export function errorHandler(error, _request, response, _next) {
  let statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
  let message = statusCode < 500 ? error.message : "An unexpected server error occurred.";

  if (error.name === "ValidationError" || error.name === "CastError") {
    statusCode = 400;
    message = "The submitted data is invalid.";
  } else if (error.code === 11000) {
    statusCode = 409;
    message = "A record with the same unique value already exists.";
  } else if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body contains invalid JSON.";
  }

  if (statusCode >= 500) {
    console.error(error.message);
  }

  response.status(statusCode).json({
    status: "error",
    message,
  });
}
