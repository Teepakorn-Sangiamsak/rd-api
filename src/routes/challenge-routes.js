const express = require("express");
const challengeRouter = express.Router();
const challengeController = require("../controllers/challenge-controller");
const verifyToken = require("../middlewares/auth-middleware");
const isAdmin = require("../middlewares/isAdmin");
const { uploadMultiple } = require("../middlewares/upload");

// เส้นทางทั่วไป
challengeRouter.post("/challenges", verifyToken, challengeController.createChallenge);
challengeRouter.get("/challenges", challengeController.getChallenges);
challengeRouter.post("/challenges/:challengeId/join", verifyToken, challengeController.joinChallenge);
challengeRouter.delete("/challenges/:challengeId/cancel", verifyToken, challengeController.deleteChallenge);

// เส้นทางสำหรับดูชาเลนจ์ของผู้ใช้
challengeRouter.get("/user/challenges", verifyToken, challengeController.getUserChallenges);
challengeRouter.get("/user/created-challenges", verifyToken, challengeController.getUserCreatedChallenges);

// เส้นทางสำหรับตรวจสอบหลักฐาน
challengeRouter.post(
  "/challenges/:challengeId/submit", 
  verifyToken, 
  uploadMultiple, 
  challengeController.submitChallengeProof
);
challengeRouter.patch(
  "/admin/challenges/verify", 
  verifyToken, 
  isAdmin, 
  challengeController.verifyProof
);

module.exports = challengeRouter;