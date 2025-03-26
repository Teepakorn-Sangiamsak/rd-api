const path = require("path");
const fs = require("fs");
const multer = require("multer");

// สร้างโฟลเดอร์ upload-pic ถ้ายังไม่มี
const uploadDir = path.join(__dirname, "../upload-pic");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1000)}`;
    const fileExt = path.extname(file.originalname);
    const fileName = `${file.fieldname}_${uniqueSuffix}${fileExt}`;
    cb(null, fileName);
  },
});

// ตรวจสอบประเภทไฟล์
const fileFilter = (req, file, cb) => {
  // อนุญาตเฉพาะไฟล์รูปภาพ
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น"), false);
  }
};

// จำกัดขนาดไฟล์ (5MB)
const limits = {
  fileSize: 5 * 1024 * 1024,
};

const upload = multer({ 
  storage, 
  fileFilter, 
  limits 
});

module.exports = {
  uploadSingle: upload.single("profileImage"), // สำหรับอัปโหลดรูปเดียว
  uploadMultiple: upload.array("proofImages", 5), // รองรับหลายไฟล์ สูงสุด 5 ไฟล์
};