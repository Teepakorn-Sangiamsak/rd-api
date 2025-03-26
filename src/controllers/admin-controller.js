const { z } = require("zod");
const {
  proofSchema,
  proofParamsSchema,
} = require("../validators/proofValidator");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { updateExpOnChallengeSuccess } = require("./user-controller");

// ดึงรายชื่อผู้ใช้ทั้งหมด
exports.listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        bannedUser: {
          select: { id: true, reason: true, bannedAt: true },
        },
      },
    });
    res.json({ message: "List of users", users });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในเซิร์ฟเวอร์"));
  }
};

// แบนผู้ใช้
exports.banUser = async (req, res, next) => {
  try {
    const { userId, reason } = req.body;

    if (req.user.role !== "ADMIN") {
      return next(createError(403, "คุณไม่มีสิทธิ์แบนผู้ใช้"));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return createError(404, "ไม่พบผู้ใช้");
    }

    const isBanned = await prisma.banned_User.findUnique({ where: { userId } });
    if (isBanned) {
      return createError(400, "ผู้ใช้นี้ถูกแบนแล้ว");
    }

    await prisma.banned_User.create({
      data: {
        userId,
        reason: reason || "No reason provided",
        status: "BANNED",
      },
    });

    res.json({ message: "แบนผู้ใช้สำเร็จ" });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการแบนผู้ใช้"));
  }
};

// ปลดแบนผู้ใช้
exports.unbanUser = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (req.user.role !== "ADMIN") {
      return createError(403, "คุณไม่มีสิทธิ์ปลดแบนผู้ใช้");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return createError(404, "ไม่พบผู้ใช้");
    }

    const isBanned = await prisma.banned_User.findUnique({ where: { userId } });
    if (!isBanned) {
      return createError(400, "ผู้ใช้ไม่ได้ถูกแบน");
    }

    await prisma.banned_User.delete({ where: { userId } });
    res.json({ message: "ปลดแบนผู้ใช้สำเร็จ" });
  } catch (error) {
    next(createError(500, "เกิดข้อผิดพลาดในการปลดแบนผู้ใช้"));
  }
};

exports.checkProof = async (req, res, next) => {
  try {
    // Validate params
    const params = proofParamsSchema.parse(req.params);
    const body = proofSchema.parse(req.body);

    const { challengeId, proofId } = params;
    const { status } = body;

    console.log(" challengeId:", challengeId);
    console.log(" proofId:", proofId);

    const proof = await prisma.user_Proof.findFirst({
      where: {
        id: parseInt(proofId),
        challengeId: parseInt(challengeId),
      },
      include: {
        challenge: {
          select: {
            id: true,
            expReward: true,
          },
        },
      },
    });

    console.log(" proof:", proof); // Log ข้อมูล proof

    if (!proof) {
      console.log(" Proof not found");
      return res.status(404).json({ message: "Proof not found" });
    }

    const adminProofCheck = await prisma.admin_Proof_Check.findFirst({
      where: { proofId: parseInt(proofId) },
    });

    console.log(" adminProofCheck:", adminProofCheck);

    if (!adminProofCheck) {
      console.log(" Admin Proof Check not found");
      return res.status(404).json({ message: "Admin Proof Check not found" });
    }

    const updatedProof = await prisma.admin_Proof_Check.update({
      where: { id: adminProofCheck.id },
      data: {
        status,
        checkedAt: new Date(),
        adminId: req.user.id,
      },
    });

    if (status === "APPROVED" && proof.challenge && proof.challenge.expReward) {
      console.log("เพิ่ม EXP:", proof.challenge.expReward);
      await updateExpOnChallengeSuccess(
        proof.userId,
        proof.challenge.expReward
      );
    }

    res.json({ message: "Proof updated successfully", updatedProof });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(" Validation Error:", error.errors);
      return res
        .status(400)
        .json({ message: "Invalid data format", errors: error.errors });
    }

    console.error(" Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
