const express = require("express");
const authRouter = express.Router();
const authController = require("../controllers/auth-controller");
const verifyToken = require("../middlewares/auth-middleware");

// @@ENDPOINT : http//localhost:8080/api
authRouter.post("/auth/register", authController.register);
authRouter.post("/auth/login", authController.login);
authRouter.get("/auth/me", verifyToken, authController.currentUser);

module.exports = authRouter;
