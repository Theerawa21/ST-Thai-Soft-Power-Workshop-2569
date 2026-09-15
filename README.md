# ST Thai Soft Power Workshop 2569

ระบบลงทะเบียนอบรม Green Business Market ปีการศึกษา 2569 สำหรับโรงเรียนเซนต์เทเรซา

## Architecture

- **GitHub Pages**: หน้าเว็บไซต์นักเรียนและฝ่ายวิชาการ
- **Google Apps Script**: API, validation, QR/payment/receipt/check-in logic
- **Google Sheets**: ฐานข้อมูลกลาง

## Event

- วันที่: 5 ตุลาคม 2569
- เวลา: 08.30–15.00 น.
- สถานที่: ห้องประชุมชั้น 5 อาคารเซนต์เทเรซา
- ค่าลงทะเบียน: 100 บาท/คน
- จำนวนรับรวม: 150 คน
- โควตาวิทย์–คณิต: 50 คนภายในจำนวนรวม
- หมดเขตรับสมัคร: 18 กันยายน 2569

## Workflow

1. นักเรียนสมัครผ่าน GitHub Pages
2. Apps Script ตรวจ duplicate / 150 seats / 50 science-math quota ภายใต้ `LockService`
3. ระบบสร้าง `GBM2569-xxx` และ QR ประจำตัว
4. ฝ่ายวิชาการสแกน QR แล้วเลือก **เงินสด** หรือ **โอนเงิน**
5. ต้องกด `ยืนยันรับเงิน 100 บาท` ก่อนออกใบรับเงิน
6. ระบบสร้างเลขใบรับเงิน `GBM-R2569-xxxx`
7. ใบรับเงินปรากฏในหน้าของนักเรียนทันที
8. QR เดิมใช้ Check-in วันอบรมได้

## Local tests

```bash
npm install
npm test
```

## Google Sheet + Apps Script setup

1. ใช้ Google Sheet ที่กำหนดเป็นฐานข้อมูลกลาง
2. Apps Script ใช้ **`Code.gs` เพียงไฟล์เดียว** จาก `apps-script/Code.gs`
3. ตั้ง Script Properties:
   - `SPREADSHEET_ID`
   - `ADMIN_TOKEN`
4. รัน `setupSystem()` หนึ่งครั้ง
5. ระบบใช้ชีต:
   - `Registrations`
   - `Payments`
   - `Receipts`
   - `CheckIn`
   - `Admins`
   - `Settings`
   - `Logs`
6. หากมีลิงก์ LINE กลุ่ม ให้แก้ค่า `LINE_GROUP_URL` ในชีต `Settings`
7. Deploy > New deployment > Web app
   - Execute as: Me
   - Who has access: Anyone
8. Web App URL ปัจจุบันถูกเชื่อมไว้ใน `assets/js/config.js` แล้ว

## Admin workflow

เข้า `/admin/index.html` แล้วกรอก Admin token ครั้งแรก ระบบเก็บ token เฉพาะ `sessionStorage` ของแท็บ/เบราว์เซอร์นั้น จากนั้นสามารถเปิด:

- `/admin/scanner.html` รับชำระเงิน
- `/admin/checkin.html` Check-in วันอบรม

QR เพียงเปิดรายการผู้สมัครเท่านั้น การสแกน **ไม่ยืนยันการชำระเงินอัตโนมัติ**

## Receipt rules

- รองรับ `CASH` และ `TRANSFER`
- เลขใบรับเงินออกหลังฝ่ายวิชาการยืนยันเท่านั้น
- เลขที่ออกแล้วห้ามนำกลับมาใช้ซ้ำ
- การยกเลิกใบรับเงินเปลี่ยนสถานะเป็น `VOID` แทนการลบข้อมูล

## GitHub Pages

เมื่อโค้ดพร้อมใช้งานและรวมเข้า `main` ให้เปิด GitHub Pages จาก repository settings โดยเลือก Deploy from branch `main` / root.

## Development branch

งานพัฒนา V1 อยู่บน `feature/registration-system-v1` จนกว่าจะผ่านการตรวจสอบและพร้อมรวมเข้า `main`.
