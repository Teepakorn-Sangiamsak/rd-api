const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { cloudinary } = require("../config/cloudinary"); // เพิ่ม import cloudinary

// สร้าง Challenge
exports.createChallenge = async (req, res, next) => {
  try {
    const { name, description, expReward, status, requirementType } = req.body;
    const userId = req.user.id;

    console.log("รับข้อมูล:", req.body);  // 🛠️ Debug: ดูข้อมูลที่รับมา
    console.log("User ID:", userId);       // 🛠️ Debug: ดู userId ที่รับมา

    if (!name || !description) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const newChallenge = await prisma.challenge.create({
      data: {
        name,
        description,
        expReward: parseInt(expReward) || 100,  // 🔄 แปลงเป็น Int
        status: status || "PRIVATE",
        requirementType,
        createdBy: userId,
      },
    });

    res.status(201).json({ message: "สร้าง Challenge สำเร็จ", challenge: newChallenge });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้าง Challenge:", error);  // 🛠️ Debug: ดู Error ที่เกิดขึ้น
    next(error);  // ส่ง Error กลับไป
  }
};

// ดู Challenge ทั้งหมด
exports.getChallenges = async (req, res, next) => {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { status: "PUBLIC" }, // ดึงเฉพาะ Public
      include: {
        creator: { select: { username: true } }, // ดึงชื่อผู้สร้าง
      },
    });

    res.json({ challenges });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการดึงข้อมูล Challenge"));
  }
};

// User เข้าร่วม Challenge
exports.joinChallenge = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await prisma.challenge.findUnique({
      where: { id: parseInt(challengeId) },
    });
    
    if (!challenge) {
      return next(createError(404, "ไม่พบ Challenge"));
    }

    // ตรวจสอบว่าเข้าร่วมแล้วหรือยัง
    const existingParticipation = await prisma.user_Challenge.findFirst({
      where: {
        userId,
        challengeId: parseInt(challengeId)
      }
    });

    if (existingParticipation) {
      return next(createError(400, "คุณได้เข้าร่วม Challenge นี้แล้ว"));
    }

    await prisma.user_Challenge.create({
      data: {
        userId,
        challengeId: parseInt(challengeId),
        status: "IN_PROGRESS",
      },
    });

    res.json({ message: "เข้าร่วม Challenge สำเร็จ" });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการเข้าร่วม Challenge"));
  }
};

// User ส่งหลักฐาน Challenge
exports.submitChallengeProof = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;
    const files = req.files; // รับหลายรูป

    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป" });
    }

    // อัปโหลดแต่ละรูปขึ้น Cloudinary แล้วเก็บ URL
    const imageUrls = [];
    for (let file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "proof_images",
      });
      imageUrls.push(result.secure_url);
    }

    // บันทึก Proof ลงฐานข้อมูล
    const proof = await prisma.user_Proof.create({
      data: {
        userId: req.user.id, 
        challengeId: parseInt(challengeId),
        proofImages: imageUrls, // แก้ไขใช้ imageUrls แทน proofImages
        status: "PENDING",
        submittedAt: new Date(),
      },
    });
    
    // สร้าง Admin Proof Check อัตโนมัติ
    await prisma.admin_Proof_Check.create({
      data: {
        proofId: proof.id,
        status: "PENDING",
      },
    });

    res.json({ message: "ส่ง Proof สำเร็จ", proof });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Admin ตรวจสอบหลักฐาน
exports.verifyProof = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN")
      return next(createError(403, "คุณไม่มีสิทธิ์ตรวจสอบ"));

    const { proofId, status } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return next(createError(400, "กรุณาเลือกสถานะที่ถูกต้อง"));
    }

    const proof = await prisma.user_Proof.update({
      where: { id: parseInt(proofId) },
      data: { status },
      include: { challenge: true }
    });
    
    // ถ้าสถานะเป็น APPROVED ให้อัพเดต EXP ของผู้ใช้
    if (status === "APPROVED") {
      const { updateExpOnChallengeSuccess } = require("./user-controller");
      await updateExpOnChallengeSuccess(proof.userId, proof.challenge.expReward);
      
      // อัพเดตสถานะ User Challenge เป็น COMPLETED
      await prisma.user_Challenge.updateMany({
        where: { 
          userId: proof.userId,
          challengeId: proof.challengeId
        },
        data: { 
          status: "COMPLETED",
          submittedAt: new Date()
        }
      });
    }

    res.json({ message: "อัปเดตสถานะสำเร็จ", proof });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการตรวจสอบหลักฐาน"));
  }
};

// Admin & User ลบ Challenge (เฉพาะเจ้าของหรือแอดมิน)
exports.deleteChallenge = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await prisma.challenge.findUnique({
      where: { id: parseInt(challengeId) },
    });
    if (!challenge) return next(createError(404, "ไม่พบ Challenge"));

    if (req.user.role !== "ADMIN" && challenge.createdBy !== userId) {
      return next(createError(403, "คุณไม่มีสิทธิ์ลบ Challenge นี้"));
    }

    await prisma.challenge.delete({ where: { id: parseInt(challengeId) } });

    res.json({ message: "ลบ Challenge สำเร็จ" });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการลบ Challenge"));
  }
};

// เพิ่มฟังก์ชันใหม่: รับ Challenge ที่ผู้ใช้เข้าร่วม
exports.getUserChallenges = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const userChallenges = await prisma.user_Challenge.findMany({
      where: { userId },
      include: {
        challenge: {
          select: {
            id: true,
            name: true,
            description: true,
            expReward: true,
            requirementType: true,
            creator: {
              select: { username: true }
            }
          }
        }
      }
    });
    
    res.json({ 
      message: "รายการ Challenge ที่ผู้ใช้เข้าร่วม", 
      userChallenges 
    });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการดึงข้อมูล Challenge ของผู้ใช้"));
  }
};

// เพิ่มฟังก์ชันใหม่: รับ Challenge ที่ผู้ใช้สร้าง
exports.getUserCreatedChallenges = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const challenges = await prisma.challenge.findMany({
      where: { createdBy: userId },
      include: {
        userChallenges: {
          select: {
            id: true,
            status: true,
            user: {
              select: { username: true }
            }
          }
        }
      }
    });
    
    res.json({ 
      message: "รายการ Challenge ที่ผู้ใช้สร้าง", 
      challenges 
    });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการดึงข้อมูล Challenge ที่ผู้ใช้สร้าง"));
  }
};