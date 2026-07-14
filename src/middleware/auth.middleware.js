const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access token required"
    });
  }

  const token = authHeader.split(" ")[1];

  try {

    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();

  } catch (err) {

    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });

  }

};
