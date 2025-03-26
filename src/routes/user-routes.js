const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/user-controller");
const verifyToken = require("../middlewares/auth-middleware");
const { uploadSingle, uploadMultiple } = require("../middlewares/upload");

// รายละเอียดผู้ใช้และโปรไฟล์
userRouter.get("/user/profile", verifyToken, userController.getUserProfile);
userRouter.patch("/user/update-profile", verifyToken, uploadSingle, userController.updateProfile);
userRouter.patch("/user/update-password", verifyToken, userController.updatePassword);
userRouter.delete("/user/delete-account", verifyToken, userController.deleteAccount);

// ประวัติและสถิติ
userRouter.get("/user/challenge-history", verifyToken, userController.getUserChallengeHistory);
userRouter.get("/user/badges", verifyToken, userController.getUserBadges);

// การส่งหลักฐาน
userRouter.patch(
  "/user/challenges/:challengeId/submit",
  verifyToken,
  uploadMultiple,
  userController.submitProof
);

module.exports = userRouter;