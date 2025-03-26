const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../upload-pic")),
  filename: (req, file, cb) => {
    let fileExt = path.extname(file.originalname);
    cb(null, `pic_${Date.now()}_${Math.round(Math.random() * 10)}${fileExt}`);
  },
});

// ✅ Export แบบรองรับหลายไฟล์
const upload = multer({ storage: storage });
module.exports = {
  uploadSingle: upload.single('profileImage'), // สำหรับอัปโหลดรูปเดียว
  uploadMultiple: upload.array("proofImages", 5), // ✅ รองรับหลายไฟล์ สูงสุด 5 ไฟล์
};
