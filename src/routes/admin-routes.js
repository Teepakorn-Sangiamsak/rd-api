const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controllers/admin-controller");
const verifyToken = require("../middlewares/auth-middleware");
const isAdmin = require("../middlewares/isAdmin");

// @@ENDPOINT : http//localhost:8080/api/admin
adminRouter.get("/admin/users", verifyToken, isAdmin, adminController.listUsers);
adminRouter.post("/admin/ban-user", verifyToken, isAdmin, adminController.banUser);
adminRouter.post("/admin/unban-user", verifyToken,isAdmin, adminController.unbanUser);
adminRouter.patch("/admin/challenges/:challengeId/proof/:proofId", verifyToken, isAdmin, adminController.checkProof);

module.exports = adminRouter;
