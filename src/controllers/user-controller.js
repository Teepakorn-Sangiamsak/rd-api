const path = require("path");
const fs = require("fs/promises");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { cloudinary } = require("../config/cloudinary");

// อัปเดตโปรไฟล์
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstname, lastname } = req.body;
    const userId = req.user.id;
    let profileImageUrl = req.user.profileImage;

    console.log(" ตรวจสอบค่า req.file:", req.file);

    if (req.file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "profile_images",
          public_id: path.parse(req.file.path).name,
          overwrite: true,
          use_filename: true,
        });

        console.log("อัปโหลดสำเร็จ:", uploadResult);
        profileImageUrl = uploadResult.secure_url;

        // ลบไฟล์จากเซิร์ฟเวอร์หลังจากอัปโหลดไปยัง Cloudinary
        await fs.unlink(req.file.path);
      } catch (uploadError) {
        console.error(
          "อัปโหลดไปยัง Cloudinary ไม่สำเร็จ:",
          uploadError.message
        );
        return next(createError(500, "อัปโหลดรูปภาพไม่สำเร็จ"));
      }
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstname,
        lastname,
        profileImage: profileImageUrl,
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        profileImage: true,
      },
    });

    res.json({ message: "อัปเดตข้อมูลโปรไฟล์สำเร็จ", user: updatedUser });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error.message);
    next(createError(500, "เกิดข้อผิดพลาดในเซิร์ฟเวอร์"));
  }
};

// อัปเดตรหัสผ่าน
exports.updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return createError(400, "กรุณากรอกข้อมูลให้ครบถ้วน");
    }
    if (newPassword !== confirmPassword) {
      return createError(400, "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return createError(404, "ไม่พบผู้ใช้");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return createError(400, "รหัสผ่านเดิมไม่ถูกต้อง");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน"));
  }
};

// ลบบัญชีผู้ใช้
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return createError(404, "ไม่พบผู้ใช้");
    }

    await prisma.user.delete({ where: { id: req.user.id } });

    res.json({ message: "ลบบัญชีสำเร็จ" });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการลบบัญชี"));
  }
};

exports.submitProof = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    // ตรวจสอบว่ามีไฟล์อัปโหลดมาจริง ๆ
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป" });
    }

    // สร้าง Array ของ URL รูปภาพ
    const proofImages = req.files.map((file) => `/upload-pic/${file.filename}`);

    // บันทึกข้อมูลลง Database (user_proof)
    const proof = await prisma.user_Proof.create({
      data: {
        userId: userId,
        challengeId: parseInt(challengeId),
        proofImages: proofImages, // บันทึกเป็น Array
        status: "PENDING",
        submittedAt: new Date(),
      },
    });

    // บันทึกข้อมูลลง Database (admin_proof_check)
    await prisma.admin_Proof_Check.create({
      data: {
        proofId: proof.id,
        status: "PENDING",
      },
    });

    res.json({
      message: "อัปโหลด Proof สำเร็จ",
      proof,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
};

// ใช้ export แบบนี้แทน module.exports = {...}
exports.updateExpOnChallengeSuccess = async (userId, expReward) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { exp: true, level: true },
  });

  if (!user) throw new Error("User not found");

  let totalExp = user.exp + expReward;
  let level = user.level;

  // ปรับสูตรให้เลเวล 1 ใช้ 1000 EXP
  let expToNextLevel = Math.floor(1000 * Math.pow(1.2, level - 1));
  let currentExp = totalExp; // 🛠 เก็บค่า EXP ปัจจุบันไว้ใช้ในหลอด

  // ถ้ายังมี EXP เกินพอที่จะเลเวลอัป
  while (currentExp >= expToNextLevel) {
    currentExp -= expToNextLevel;
    level += 1;
    expToNextLevel = Math.floor(1000 * Math.pow(1.2, level - 1)); // 🔥 ปรับสูตรต่อไป
  }

  // บันทึกลงฐานข้อมูล
  await prisma.user.update({
    where: { id: userId },
    data: {
      exp: currentExp, // 🛠 เหลือเท่าไหร่เก็บเท่านั้น
      level: level,
    },
  });

  // ส่งค่า EXP ปัจจุบัน, EXP ที่ต้องใช้ไปด้วย
  return {
    currentExp: currentExp,
    expToNextLevel: expToNextLevel,
    level: level,
  };
};

// ฟังก์ชันดึงข้อมูล Profile และ EXP ของ User
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { username: true, level: true, exp: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User profile fetched successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
