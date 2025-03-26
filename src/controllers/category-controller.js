const prisma = require("../config/prisma");
const createError = require("../utils/createError");

// สร้างหมวดหมู่ใหม่
exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return next(createError(400, "กรุณากรอกชื่อหมวดหมู่"));
    }

    const newCategory = await prisma.category.create({
      data: { name },
    });

    res.status(201).json({ message: "สร้างหมวดหมู่สำเร็จ", category: newCategory });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการสร้างหมวดหมู่"));
  }
};

// อ่านหมวดหมู่ทั้งหมด
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany();
    res.json({ message: "รายการหมวดหมู่", categories });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการดึงหมวดหมู่"));
  }
};

// อัปเดตหมวดหมู่
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return next(createError(400, "กรุณากรอกชื่อหมวดหมู่"));
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json({ message: "อัปเดตหมวดหมู่สำเร็จ", category: updatedCategory });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่"));
  }
};

// ลบหมวดหมู่
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "ลบหมวดหมู่สำเร็จ" });
  } catch (error) {
    console.error(error);
    next(createError(500, "เกิดข้อผิดพลาดในการลบหมวดหมู่"));
  }
};
