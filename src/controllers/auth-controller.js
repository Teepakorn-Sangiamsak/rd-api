const createError = require("../utils/createError");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
exports.register = async (req, res, next) => {
  try {
    // รับค่าจาก Body
    const {
      username,
      firstname,
      lastname,
      email,
      password,
      confirmPassword,
      role,
    } = req.body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (
      !username ||
      !firstname ||
      !lastname ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return createError(400, "กรุณากรอกข้อมูลให้ครบถ้วน");
    }

    if (password !== confirmPassword) {
      return createError(400, "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
    }

    // ตรวจสอบว่าอีเมลนี้ถูกใช้งานแล้วหรือยัง
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return createError(409, "อีเมลนี้ถูกใช้งานแล้ว");
    }

    // เข้ารหัสรหัสผ่าน (bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างบัญชีใหม่
    const newUser = await prisma.user.create({
      data: {
        username,
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role: role || "USER", // ค่าเริ่มต้นเป็น USER
      },
    });

    // สร้าง JWT Token
    const payload = {
      id: newUser.id,
      username: newUser.username,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      role: newUser.role,
    };
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "15d",
    });

    // ตอบกลับ
    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      token,
      user: payload, // ส่งข้อมูล user กลับไปยกเว้น password
    });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในเซิร์ฟเวอร์"));
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { identity, password } = req.body;

    if (!identity || !password) {
      return createError(400, "กรุณากรอกอีเมลหรือชื่อผู้ใช้และรหัสผ่าน");
    }

    // ค้นหาผู้ใช้จาก email หรือ username และเช็คว่าโดนแบนหรือไม่
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identity }, { username: identity }],
      },
      include: {
        bannedUser: true, // ดึงข้อมูลแบนของผู้ใช้มาด้วย
      },
    });

    // ถ้าไม่พบผู้ใช้
    if (!user) {
      return createError(400, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }

    // ถ้าผู้ใช้ถูกแบน
    if (user.bannedUser) {
      return res
        .status(403)
        .json({
          message: `บัญชีของคุณถูกแบน: ${
            user.bannedUser.reason || "ไม่ระบุเหตุผล"
          }`,
        });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return createError(400, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.SECRET_KEY,
      { expiresIn: "15d" }
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในเซิร์ฟเวอร์"));
  }
};

// ดึงข้อมูลผู้ใช้ปัจจุบัน CurrentUser
exports.currentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return createError(404, "ไม่พบข้อมูลผู้ใช้");
    }

    res.json({ message: "ข้อมูลผู้ใช้ปัจจุบัน", user });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในเซิร์ฟเวอร์"));
  }
};
