const prisma = require("../config/prisma");
const createError = require("../utils/createError");

// สร้างตรารางวัลใหม่ (Admin เท่านั้น)
exports.createBadge = async (req, res, next) => {
  try {
    const { name, description, condition } = req.body;

    if (!name || !condition) {
      return next(createError(400, "กรุณากรอกชื่อและเงื่อนไขของตรารางวัล"));
    }

    // ตรวจสอบว่าเงื่อนไขถูกต้อง
    const validConditions = ["EXP", "CHALLENGE_COMPLETED", "SPECIAL_ACHIEVEMENT"];
    if (!validConditions.includes(condition)) {
      return next(createError(400, "เงื่อนไขของตรารางวัลไม่ถูกต้อง"));
    }

    const newBadge = await prisma.badge.create({
      data: {
        name,
        description,
        condition,
      },
    });

    res.status(201).json({ message: "สร้างตรารางวัลสำเร็จ", badge: newBadge });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการสร้างตรารางวัล"));
  }
};

// ดึงรายการตรารางวัลทั้งหมด
exports.getAllBadges = async (req, res, next) => {
  try {
    const badges = await prisma.badge.findMany();
    res.json({ message: "รายการตรารางวัลทั้งหมด", badges });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการดึงรายการตรารางวัล"));
  }
};

// อัปเดตตรารางวัล (Admin เท่านั้น)
exports.updateBadge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, condition } = req.body;

    if (!name) {
      return next(createError(400, "กรุณากรอกชื่อตรารางวัล"));
    }

    // ตรวจสอบว่าเงื่อนไขถูกต้อง (ถ้ามีการส่งมา)
    if (condition) {
      const validConditions = ["EXP", "CHALLENGE_COMPLETED", "SPECIAL_ACHIEVEMENT"];
      if (!validConditions.includes(condition)) {
        return next(createError(400, "เงื่อนไขของตรารางวัลไม่ถูกต้อง"));
      }
    }

    const updatedBadge = await prisma.badge.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        condition,
      },
    });

    res.json({ message: "อัปเดตตรารางวัลสำเร็จ", badge: updatedBadge });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการอัปเดตตรารางวัล"));
  }
};

// ลบตรารางวัล (Admin เท่านั้น)
exports.deleteBadge = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.badge.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "ลบตรารางวัลสำเร็จ" });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการลบตรารางวัล"));
  }
};

// มอบตรารางวัลให้ผู้ใช้ (Admin เท่านั้น)
exports.assignBadgeToUser = async (req, res, next) => {
  try {
    const { userId, badgeId } = req.body;

    // ตรวจสอบว่ามีผู้ใช้
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) {
      return next(createError(404, "ไม่พบผู้ใช้"));
    }

    // ตรวจสอบว่ามีตรารางวัล
    const badge = await prisma.badge.findUnique({
      where: { id: parseInt(badgeId) },
    });
    if (!badge) {
      return next(createError(404, "ไม่พบตรารางวัล"));
    }

    // ตรวจสอบว่าผู้ใช้มีตรารางวัลนี้แล้วหรือไม่
    const existingBadge = await prisma.user_Badge.findFirst({
      where: {
        userId: parseInt(userId),
        badgeId: parseInt(badgeId),
      },
    });
    if (existingBadge) {
      return next(createError(400, "ผู้ใช้มีตรารางวัลนี้อยู่แล้ว"));
    }

    // มอบตรารางวัล
    const userBadge = await prisma.user_Badge.create({
      data: {
        userId: parseInt(userId),
        badgeId: parseInt(badgeId),
      },
    });

    res.status(201).json({ message: "มอบตรารางวัลสำเร็จ", userBadge });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการมอบตรารางวัล"));
  }
};

// ตรวจสอบตรารางวัลของผู้ใช้
exports.checkUserBadgeEligibility = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // ข้อมูลผู้ใช้
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true }
    });
    
    // จำนวนชาเลนจ์ที่ทำสำเร็จ
    const completedChallenges = await prisma.user_Challenge.count({
      where: {
        userId,
        status: "COMPLETED"
      }
    });
    
    // รายการตรารางวัลที่มีอยู่ในระบบ
    const allBadges = await prisma.badge.findMany();
    
    // ตรารางวัลที่ผู้ใช้มีอยู่แล้ว
    const userBadges = await prisma.user_Badge.findMany({
      where: { userId },
      select: { badgeId: true }
    });
    const userBadgeIds = userBadges.map(ub => ub.badgeId);
    
    // ตรวจสอบตรารางวัลที่ผู้ใช้ควรได้รับ
    const eligibleBadges = allBadges.filter(badge => {
      // ถ้ามีตรารางวัลนี้แล้ว ข้ามไป
      if (userBadgeIds.includes(badge.id)) return false;
      
      // ตรวจสอบตามเงื่อนไขของตรารางวัล
      if (badge.condition === "EXP") {
        // ตัวอย่าง: ตรารางวัลตามเลเวล (กำหนดเองตามเงื่อนไขที่ต้องการ)
        // สมมติว่าตรารางวัลมีฟิลด์ requiredLevel เพิ่มเติม (อาจต้องปรับตามโครงสร้างฐานข้อมูลจริง)
        return true; // ในที่นี้อนุญาตทุกตรารางวัล EXP
      } else if (badge.condition === "CHALLENGE_COMPLETED") {
        // ตัวอย่าง: ตรารางวัลตามจำนวนชาเลนจ์ที่ทำสำเร็จ
        // สมมติว่าตรารางวัลมีฟิลด์ requiredChallenges เพิ่มเติม
        return true; // ในที่นี้อนุญาตทุกตรารางวัลการทำชาเลนจ์สำเร็จ
      }
      return false;
    });
    
    res.json({
      message: "ตรารางวัลที่สามารถรับได้",
      eligibleBadges
    });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการตรวจสอบตรารางวัล"));
  }
};

// ตรวจสอบและมอบตรารางวัลอัตโนมัติ
exports.checkAndAssignBadges = async (userId) => {
  try {
    // ดึงข้อมูลผู้ใช้
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true }
    });
    
    // จำนวนชาเลนจ์ที่ทำสำเร็จ
    const completedChallenges = await prisma.user_Challenge.count({
      where: {
        userId,
        status: "COMPLETED"
      }
    });
    
    // ค้นหาตรารางวัลที่เข้าเงื่อนไข
    const eligibleBadges = await prisma.badge.findMany();
    
    // ตรารางวัลที่ผู้ใช้มีอยู่แล้ว
    const userBadges = await prisma.user_Badge.findMany({
      where: { userId },
      select: { badgeId: true }
    });
    const userBadgeIds = userBadges.map(ub => ub.badgeId);
    
    // มอบตรารางวัลใหม่
    const newBadges = [];
    for (const badge of eligibleBadges) {
      // ถ้ามีตรารางวัลนี้แล้ว ข้ามไป
      if (userBadgeIds.includes(badge.id)) continue;
      
      let isEligible = false;
      
      // ตรวจสอบตามเงื่อนไขของตรารางวัล
      if (badge.condition === "EXP" && user.level >= 5) {
        isEligible = true;
      } else if (badge.condition === "CHALLENGE_COMPLETED" && completedChallenges >= 5) {
        isEligible = true;
      }
      
      if (isEligible) {
        // มอบตรารางวัล
        const newBadge = await prisma.user_Badge.create({
          data: {
            userId,
            badgeId: badge.id
          }
        });
        newBadges.push(newBadge);
      }
    }
    
    return newBadges;
  } catch (error) {
    console.error("Error checking and assigning badges:", error);
    return [];
  }
};