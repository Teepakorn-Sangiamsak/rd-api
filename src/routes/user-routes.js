const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/user-controller");
const verifyToken = require("../middlewares/auth-middleware");
const { uploadSingle, uploadMultiple } = require("../middlewares/upload");

// @@ENDPOINT : http//localhost:8080/api/user
userRouter.patch("/user/update-profile", verifyToken, uploadSingle, userController.updateProfile);
userRouter.patch("/user/update-password", verifyToken, userController.updatePassword);
userRouter.delete("/user/delete-account", verifyToken, userController.deleteAccount);
userRouter.patch(
    "/user/challenges/:challengeId/submit",
    verifyToken,
    uploadMultiple,
    userController.submitProof
  );
  userRouter.get("/user/profile", verifyToken, userController.getUserProfile);

module.exports = userRouter;
