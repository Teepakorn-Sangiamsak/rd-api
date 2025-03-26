# Challenge Management System API

ระบบจัดการชาเลนจ์ (Challenge Management System) คือ API สำหรับบริหารจัดการการสร้างและเข้าร่วมชาเลนจ์ ช่วยให้ผู้ใช้สามารถตั้งเป้าหมาย ติดตามความคืบหน้า และรับรางวัลจากการทำชาเลนจ์สำเร็จ

## คุณสมบัติหลัก

- ระบบสมาชิก: ลงทะเบียน, เข้าสู่ระบบ, อัปเดตโปรไฟล์, และจัดการบัญชี
- การจัดการชาเลนจ์: สร้าง, เข้าร่วม, และส่งหลักฐานการทำสำเร็จ
- ระบบคะแนนประสบการณ์ (EXP) และเลเวลอัป
- ระบบตรารางวัล (Badge) ตามเงื่อนไขต่างๆ
- การจัดการหมวดหมู่ชาเลนจ์
- ระบบสำหรับผู้ดูแล: ตรวจสอบหลักฐาน, แบน/ปลดแบนผู้ใช้

## การติดตั้ง

### ความต้องการของระบบ

- Node.js (v16.x ขึ้นไป)
- MySQL (v8.0 ขึ้นไป)
- บัญชี Cloudinary สำหรับเก็บรูปภาพ

### ขั้นตอนการติดตั้ง

1. Clone repository:
```bash
git clone https://github.com/yourusername/challenge-management-system.git
cd challenge-management-system
```

2. ติดตั้ง dependencies:
```bash
npm install
```

3. กำหนดค่าในไฟล์ `.env`:
```
PORT=8080
DATABASE_URL=mysql://username:password@localhost:3306/challenge_db
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. สร้างฐานข้อมูลและตาราง:
```bash
npx prisma migrate dev
```

5. เริ่มต้นเซิร์ฟเวอร์:
```bash
npm start
```

## โครงสร้าง API

### การยืนยันตัวตน (Authentication)

| Path | Method | Description | Parameters |
|------|--------|-------------|------------|
| `/api/auth/register` | POST | ลงทะเบียนผู้ใช้ใหม่ | { username, firstname, lastname, email, password, confirmPassword } |
| `/api/auth/login` | POST | เข้าสู่ระบบ | { identity, password } |
| `/api/auth/me` | GET | ดึงข้อมูลผู้ใช้ปัจจุบัน | - |

### ผู้ใช้ (User)

| Path | Method | Description | Parameters |
|------|--------|-------------|------------|
| `/api/user/profile` | GET | ดึงข้อมูลโปรไฟล์ผู้ใช้ | - |
| `/api/user/update-profile` | PATCH | อัปเดตโปรไฟล์ | { firstname, lastname, profileImage } |
| `/api/user/update-password` | PATCH | เปลี่ยนรหัสผ่าน | { oldPassword, newPassword, confirmPassword } |
| `/api/user/delete-account` | DELETE | ลบบัญชี | - |
| `/api/user/challenge-history` | GET | ดึงประวัติการทำชาเลนจ์ | - |
| `/api/user/badges` | GET | ดึงตรารางวัลของผู้ใช้ | - |

### ชาเลนจ์ (Challenge)

| Path | Method | Description | Parameters |
|------|--------|-------------|------------|
| `/api/challenges` | POST | สร้างชาเลนจ์ใหม่ | { name, description, expReward, status, requirementType } |
| `/api/challenges` | GET | ดึงชาเลนจ์ทั้งหมด | - |
| `/api/user/challenges` | GET | ดึงชาเลนจ์ที่ผู้ใช้เข้าร่วม | - |
| `/api/user/created-challenges` | GET | ดึงชาเลนจ์ที่ผู้ใช้สร้าง | - |
| `/api/challenges/:challengeId/join` | POST | เข้าร่วมชาเลนจ์ | - |
| `/api/challenges/:challengeId/submit` | POST | ส่งหลักฐานการทำชาเลนจ์ | form-data: proofImages[] |
| `/api/challenges/:challengeId/cancel` | DELETE | ยกเลิกชาเลนจ์ | - |

### หมวดหมู่ (Category)

| Path | Method | Description | Parameters |
|------|--------|-------------|------------|
| `/api/categories` | GET | ดึงหมวดหมู่ทั้งหมด | - |
| `/api/admin/categories` | POST | สร้างหมวดหมู่ใหม่ | { name } |
| `/api/admin/categories/:id` | PATCH | อัปเดตหมวดหมู่ | { name } |
| `/api/admin/categories/:id` | DELETE | ลบหมวดหมู่ | - |

### ตรารางวัล (Badge)

| Path | Method | Description | Parameters |
|------|--------|-------------|------------|
| `/api/badges` | GET | ดึงตรารางวัลทั้งหมด | - |
| `/api/user/badges/eligible` | GET | ตรวจสอบตรารางวัลที่สามารถรับได้ | - |
| `/api/admin/badges` | POST | สร้างตรารางวัลใหม่ | { name, description, condition } |
| `/api/admin/badges/:id` | PATCH | อัปเดตตรารางวัล | { name, description, condition } |
| `/api/admin/badges/:id` | DELETE | ลบตรารางวัล | - |
| `/api/admin/badges/assign` | POST | มอบตรารางวัลให้ผู้ใช้ | { userId, badgeId } |

### ผู้ดูแลระบบ (Admin)

| Path | Method | Description | Parameters |
|------|--------|-------------|------------|
| `/api/admin/users` | GET | ดึงรายชื่อผู้ใช้ทั้งหมด | - |
| `/api/admin/ban-user` | POST | แบนผู้ใช้ | { userId, reason } |
| `/api/admin/unban-user` | POST | ปลดแบนผู้ใช้ | { userId } |
| `/api/admin/challenges/:challengeId/proof/:proofId` | PATCH | ตรวจสอบหลักฐาน | { status } |

## แนวทางการพัฒนาต่อ

- เพิ่มระบบการแจ้งเตือน (Notification)
- เพิ่มระบบจัดอันดับ (Leaderboard)
- เพิ่มการค้นหาและกรองชาเลนจ์
- เพิ่มระบบติดตามชาเลนจ์ประจำวัน
- พัฒนาส่วนติดต่อผู้ใช้ (Frontend)

## ใบอนุญาต

© 2025 Challenge Management System. All rights reserved.