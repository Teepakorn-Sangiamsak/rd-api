const express = require("express");
const categoryRouter = express.Router();
const categoryController = require("../controllers/category-controller");
const verifyToken = require("../middlewares/auth-middleware");
const isAdmin = require("../middlewares/isAdmin");

categoryRouter.post("/admin/categories", verifyToken, isAdmin, categoryController.createCategory);
categoryRouter.get("/categories", categoryController.getCategories);
categoryRouter.patch("/admin/categories/:id", verifyToken, isAdmin, categoryController.updateCategory);
categoryRouter.delete("/admin/categories/:id", verifyToken, isAdmin, categoryController.deleteCategory);

module.exports = categoryRouter;
