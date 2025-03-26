const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    if (!token) {
      return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อน" });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trim();
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: "บัญชีนี้ไม่มีอยู่ในระบบ" });
    }

    req.user = user; 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token ไม่ถูกต้อง" });
  }
};

module.exports = verifyToken;
