# ST Thai Soft Power Workshop 2569

ระบบลงทะเบียนอบรม **Workshop Thai Soft Power** สำหรับกิจกรรม **Green Business Market ปีการศึกษา 2569** ของโรงเรียนเซนต์เทเรซา

## ฟังก์ชันหลัก

- หน้าเว็บไซต์แสดงจำนวนผู้สมัครแบบปัจจุบัน `x/150` และจำนวนที่นั่งคงเหลือ
- โควตานักเรียนแผนวิทย์–คณิต 50 คน ภายในจำนวนรวม 150 คน
- ตัวแทน Green Business Market กลุ่มละ 3–4 คน (ระบบจำกัดไม่เกิน 4 คนต่อชื่อกลุ่ม)
- สมัครแล้วได้รับ `GBM2569-xxx` และ QR ประจำตัวทันที
- ฝ่ายวิชาการสแกน QR แล้วตรวจข้อมูลก่อนยืนยันรับเงิน 100 บาท
- รองรับ **เงินสด** และ **โอนเงิน**
- หลังเจ้าหน้าที่ยืนยัน ระบบออกเลขใบรับเงิน `GBM-R2569-xxxx`
- หน้า Student อัปเดตสถานะทุก 10 วินาที และแสดงปุ่มใบรับเงินเมื่อชำระสำเร็จ
- QR เดิมใช้ Check-in ในวันอบรมได้
- Dashboard แสดงผู้สมัคร ชำระแล้ว รอชำระ ยอดเงิน และจำนวน Check-in
- ใบรับเงินพิมพ์หรือ Save as PDF จาก Browser ได้

## โครงสร้าง

- `GitHub Pages` — Frontend นักเรียนและฝ่ายวิชาการ
- `Google Apps Script Web App` — API และ Business Rules
- `Google Sheets` — ฐานข้อมูลกลาง

Frontend จะไม่เขียน Google Sheet โดยตรง

## 1. เตรียม Google Sheet

ใช้ Google Sheet ที่ต้องการเป็นฐานข้อมูล จากนั้นเปิด **ส่วนขยาย > Apps Script**

คัดลอกไฟล์ `.gs` จากโฟลเดอร์ `apps-script/` เข้า Apps Script Project ได้แก่:

- `Config.gs`
- `Sheets.gs`
- `Setup.gs`
- `Registration.gs`
- `Students.gs`
- `Security.gs`
- `Admin.gs`
- `Payments.gs`
- `CheckIn.gs`
- `Code.gs`

จากนั้นรันฟังก์ชัน:

```text
setupSystem()
```

ระบบจะสร้างชีต:

`Registrations`, `Payments`, `Receipts`, `CheckIn`, `Admins`, `Settings`, `Logs`

> หาก Apps Script เป็น standalone project ให้ตั้ง Script Property ชื่อ `SPREADSHEET_ID` เป็น ID ของ Google Sheet ก่อนรัน `setupSystem()`

## 2. ตั้ง Admin Token

รันครั้งเดียวใน Apps Script editor:

```javascript
setInitialAdminToken('CHANGE-THIS-TO-A-LONG-RANDOM-TOKEN', 'ฝ่ายวิชาการ')
```

ใช้ Token ยาวอย่างน้อย 12 ตัวอักษร และ **ห้ามใส่ Token ลง GitHub**

ฝ่ายวิชาการจะกรอก Token นี้ที่หน้า `/admin/` และระบบเก็บไว้ใน `sessionStorage` ของ Browser เท่านั้น

## 3. Deploy Apps Script เป็น Web App

ใน Apps Script:

1. กด **Deploy > New deployment**
2. เลือก **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Deploy
6. คัดลอก URL ที่ลงท้ายด้วย `/exec`

การเปิดให้ Anyone จำเป็นสำหรับแบบฟอร์มสมัครสาธารณะ แต่คำสั่ง Admin ยังต้องผ่าน `ADMIN_TOKEN` ฝั่ง Server ทุกครั้ง

## 4. เชื่อม Frontend กับ API

แก้ไฟล์:

`assets/js/config.js`

จาก:

```javascript
API_URL: 'PASTE_APPS_SCRIPT_WEB_APP_URL_HERE'
```

เป็น URL `/exec` ที่ได้จาก Apps Script แล้ว commit การเปลี่ยนแปลง

> URL ของ Web App ไม่ใช่ข้อมูลลับ แต่ Admin Token เป็นข้อมูลลับ

## 5. เปิด GitHub Pages

หลัง merge code เข้า `main`:

1. GitHub Repository > **Settings > Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`
4. Folder: `/ (root)`
5. Save

หน้าแรกจะอยู่ที่ GitHub Pages URL ของ repository นี้

## 6. ขั้นตอนใช้งาน

### นักเรียน

1. เปิดเว็บและดูจำนวนที่นั่ง
2. สมัคร
3. รับ QR ประจำตัว
4. แสดง QR ต่อฝ่ายวิชาการ
5. หลังเจ้าหน้าที่ยืนยันรับเงิน หน้า Student จะเปลี่ยนเป็น “ชำระเงินเรียบร้อยแล้ว” ภายในประมาณ 10 วินาที
6. กดดู/พิมพ์ใบรับเงิน
7. วันอบรมใช้ QR เดิม Check-in

### ฝ่ายวิชาการ

1. เปิด `/admin/`
2. กรอก Admin Token
3. เปิด `รับชำระเงิน`
4. สแกน QR นักเรียน
5. ตรวจชื่อและเลขที่สมัคร
6. เลือก `เงินสด` หรือ `โอนเงิน`
7. กด **ยืนยันรับเงิน 100 บาท**
8. ระบบออกเลขใบรับเงินครั้งเดียว หากสแกนซ้ำจะไม่ออกเลขใหม่

## 7. ข้อมูลกิจกรรมตั้งต้น

- วันจันทร์ที่ 5 ตุลาคม 2569
- เวลา 08.30–15.00 น.
- ห้องประชุมชั้น 5 อาคารเซนต์เทเรซา
- ค่าลงทะเบียน 100 บาท/คน
- รวมอาหารกลางวัน อาหารว่าง และน้ำดื่ม
- รับรวม 150 คน
- วิทย์–คณิต 50 คน ภายใน 150 คน
- หมดเขตรับสมัคร 18 กันยายน 2569

ค่าตั้งต้นอยู่ใน `Settings` และ `Config.gs`

## 8. ความปลอดภัย

- QR มีเฉพาะ opaque token ไม่เก็บชื่อ เบอร์โทร หรือข้อมูลส่วนบุคคลใน payload
- การสแกน QR **ไม่** ยืนยันการชำระเงินอัตโนมัติ
- `confirmPayment`, `dashboard`, `checkIn`, `voidReceipt` ต้องผ่าน Admin Token ฝั่ง Apps Script
- การสมัครและการออกเลขใบรับเงินใช้ `LockService` ป้องกันการชนกันเมื่อมีหลายคำขอพร้อมกัน
- เลขใบรับเงินที่ออกแล้วไม่ถูกนำกลับมาใช้ใหม่ การยกเลิกเปลี่ยนสถานะเป็น `VOID`
- ไม่ควรแชร์ URL หน้า Student ที่มี token ต่อสาธารณะ

## 9. การทดสอบใน repository

ชุดทดสอบหลักใช้ Node built-in test runner เพื่อให้รันได้โดยไม่ต้องติดตั้ง dependency เพิ่ม:

```bash
npm test
```

ครอบคลุม API contract, capacity 150, quota 50, validation, receipt numbering, payment methods และ check-in payment requirement

## หมายเหตุเรื่องใบรับเงิน

ระบบใช้คำว่า **ใบรับเงินกิจกรรม** หากโรงเรียนต้องการใช้เป็น “ใบเสร็จรับเงินทางบัญชี” อย่างเป็นทางการ ให้ฝ่ายการเงินกำหนดรูปแบบ เลขเอกสาร และผู้มีอำนาจลงนามก่อนนำไปใช้จริง
