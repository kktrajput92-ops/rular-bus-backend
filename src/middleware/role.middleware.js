const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!allowedRoles.includes(Number(req.user.role_id))) {
      return res.status(403).json({
        success: false,
        message: "Access Forbidden",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
