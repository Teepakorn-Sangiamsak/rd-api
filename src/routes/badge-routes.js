const express = require("express");
const badgeRouter = express.Router();
const badgeController = require("../controllers/badge-controller");
const verifyToken = require("../middlewares/auth-middleware");
const isAdmin = require("../middlewares/isAdmin");

// ดึงรายการตรารางวัลทั้งหมด (ทุกคนเข้าถึงได้)
badgeRouter.get("/badges", badgeController.getAllBadges);

// ตรวจสอบตรารางวัลที่ผู้ใช้สามารถรับได้ (ต้องเข้าสู่ระบบ)
badgeRouter.get("/user/badges/eligible", verifyToken, badgeController.checkUserBadgeEligibility);

// เส้นทางสำหรับ Admin
badgeRouter.post("/admin/badges", verifyToken, isAdmin, badgeController.createBadge);
badgeRouter.patch("/admin/badges/:id", verifyToken, isAdmin, badgeController.updateBadge);
badgeRouter.delete("/admin/badges/:id", verifyToken, isAdmin, badgeController.deleteBadge);
badgeRouter.post("/admin/badges/assign", verifyToken, isAdmin, badgeController.assignBadgeToUser);

module.exports = badgeRouter;