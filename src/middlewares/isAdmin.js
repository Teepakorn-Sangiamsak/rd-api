const createError = require("../utils/createError");

const isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return createError(403, "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
  }
  next();
};

module.exports = isAdmin;
