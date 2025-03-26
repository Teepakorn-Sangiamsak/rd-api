const path = require("path");
const fs = require("fs/promises");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { cloudinary } = require("../config/cloudinary");
const bcrypt = require("bcryptjs"); // เพิ่ม import bcrypt

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
      return next(createError(400, "กรุณากรอกข้อมูลให้ครบถ้วน"));
    }
    if (newPassword !== confirmPassword) {
      return next(createError(400, "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน"));
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return next(createError(404, "ไม่พบผู้ใช้"));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return next(createError(400, "รหัสผ่านเดิมไม่ถูกต้อง"));
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
      return next(createError(404, "ไม่พบผู้ใช้"));
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

    // อัปโหลดไฟล์ไปยัง Cloudinary
    const imageUrls = [];
    for (const file of req.files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "challenge_proofs",
        });
        imageUrls.push(result.secure_url);
        
        // ลบไฟล์ชั่วคราวหลังจากอัปโหลด
        await fs.unlink(file.path);
      } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
      }
    }

    // บันทึกข้อมูลลง Database (user_proof)
    const proof = await prisma.user_Proof.create({
      data: {
        userId: userId,
        challengeId: parseInt(challengeId),
        proofImages: JSON.stringify(imageUrls), // แปลงเป็น JSON string
        status: "PENDING",
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

  // สร้าง Badge ถ้าผู้ใช้เลเวลอัป
  if (level > user.level) {
    await checkAndCreateBadge(userId, 'EXP', level);
  }

  // ส่งค่า EXP ปัจจุบัน, EXP ที่ต้องใช้ไปด้วย
  return {
    currentExp: currentExp,
    expToNextLevel: expToNextLevel,
    level: level,
  };
};

// เพิ่มฟังก์ชันสำหรับการตรวจสอบและสร้าง Badge
const checkAndCreateBadge = async (userId, condition, value) => {
  try {
    // ค้นหา Badge ที่ตรงเงื่อนไข
    let badges = [];
    
    if (condition === 'EXP') {
      // หา Badge ที่ต้องการระดับที่น้อยกว่าหรือเท่ากับระดับปัจจุบัน
      badges = await prisma.badge.findMany({
        where: {
          condition: 'EXP',
          // ตัวอย่างเช่น บนฐานข้อมูลอาจมีฟิลด์เพิ่มเติมเช่น requiredLevel
          // WHERE requiredLevel <= value
        }
      });
    } else if (condition === 'CHALLENGE_COMPLETED') {
      // หา Badge ที่เกี่ยวกับการทำชาเลนจ์สำเร็จ
      badges = await prisma.badge.findMany({
        where: {
          condition: 'CHALLENGE_COMPLETED',
        }
      });
    }
    
    // ตรวจสอบว่ามี Badge ที่ต้องมอบให้ผู้ใช้หรือไม่
    for (const badge of badges) {
      // ตรวจสอบว่าผู้ใช้มี Badge นี้แล้วหรือไม่
      const existingBadge = await prisma.user_Badge.findFirst({
        where: {
          userId,
          badgeId: badge.id
        }
      });
      
      if (!existingBadge) {
        // ถ้ายังไม่มี ให้สร้าง Badge ใหม่
        await prisma.user_Badge.create({
          data: {
            userId,
            badgeId: badge.id
          }
        });
      }
    }
  } catch (error) {
    console.error("Error creating badge:", error);
  }
};

// ฟังก์ชันดึงข้อมูล Profile และ EXP ของ User
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true,
        username: true, 
        firstname: true,
        lastname: true,
        email: true,
        profileImage: true,
        level: true, 
        exp: true,
        createdAt: true,
        userBadges: {
          select: {
            badge: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            earnedAt: true
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // คำนวณ EXP ที่ต้องการเพื่อเลเวลอัป
    const expToNextLevel = Math.floor(1000 * Math.pow(1.2, user.level - 1));
    
    // นับจำนวน Challenge ที่ทำสำเร็จ
    const completedChallenges = await prisma.user_Challenge.count({
      where: {
        userId: req.user.id,
        status: "COMPLETED"
      }
    });

    res.json({ 
      message: "User profile fetched successfully", 
      user: {
        ...user,
        expToNextLevel,
        completedChallenges
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// เพิ่มฟังก์ชันดึงประวัติการทำชาเลนจ์
exports.getUserChallengeHistory = async (req, res, next) => {
  try {
    const history = await prisma.user_Challenge.findMany({
      where: { userId: req.user.id },
      include: {
        challenge: {
          select: {
            id: true,
            name: true,
            description: true,
            expReward: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
    
    // จัดกลุ่มตามสถานะ
    const grouped = {
      completed: history.filter(c => c.status === 'COMPLETED'),
      inProgress: history.filter(c => c.status === 'IN_PROGRESS'),
      pending: history.filter(c => c.status === 'PENDING')
    };
    
    // สถิติต่างๆ
    const stats = {
      total: history.length,
      completed: grouped.completed.length,
      inProgress: grouped.inProgress.length,
      pending: grouped.pending.length,
      completionRate: history.length > 0 
        ? (grouped.completed.length / history.length * 100).toFixed(2) + '%' 
        : '0%',
      totalExpEarned: grouped.completed.reduce((sum, c) => sum + c.challenge.expReward, 0)
    };

    res.json({
      message: "Challenge history fetched successfully",
      history: grouped,
      stats
    });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการดึงประวัติการทำชาเลนจ์"));
  }
};

// เพิ่มฟังก์ชันดึง Badge ทั้งหมดของผู้ใช้
exports.getUserBadges = async (req, res, next) => {
  try {
    const userBadges = await prisma.user_Badge.findMany({
      where: { userId: req.user.id },
      include: {
        badge: true
      },
      orderBy: { earnedAt: 'desc' }
    });
    
    res.json({
      message: "User badges fetched successfully",
      badges: userBadges
    });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการดึงข้อมูล Badge ของผู้ใช้"));
  }
};