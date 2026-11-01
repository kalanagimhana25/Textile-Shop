export function requireCustomer(request, response, next) {
  if (request.user?.role !== "customer") {
    response.status(403).json({
      status: "error",
      message: "A customer account is required to place an order.",
    });
    return;
  }

  next();
}
