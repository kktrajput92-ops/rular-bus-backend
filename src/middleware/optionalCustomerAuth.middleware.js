const customerAuthMiddleware = require(
  "./customerAuth.middleware"
);

const optionalCustomerAuthMiddleware = (
  req,
  res,
  next
) => {
  const authorization =
    req.headers.authorization || "";

  if (
    !authorization.startsWith("Bearer ")
  ) {
    req.customer = null;
    req.customerToken = null;
    return next();
  }

  return customerAuthMiddleware(
    req,
    res,
    next
  );
};

module.exports =
  optionalCustomerAuthMiddleware;
