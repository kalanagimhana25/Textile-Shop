export function requireAdmin(request, response, next) {
  if (request.user?.role !== "admin") {
    response.status(403).json({
      status: "error",
      message: "Administrator access is required.",
    });
    return;
  }

  next();
}
