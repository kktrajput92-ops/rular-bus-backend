const jwt = require("jsonwebtoken");

const createCustomerAccessToken = (customer) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      customer_profile_id: customer.id,
      phone: customer.phone,
      email: customer.email || null,
      token_type: "CUSTOMER_ACCESS",
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.CUSTOMER_JWT_EXPIRES_IN ||
        process.env.JWT_EXPIRES_IN ||
        "7d",
    }
  );
};

module.exports = {
  createCustomerAccessToken,
};
