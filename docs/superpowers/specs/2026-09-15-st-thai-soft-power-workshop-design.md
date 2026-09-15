# ST Thai Soft Power Workshop 2569 — System Design

## 1. เป้าหมายของระบบ

สร้างระบบลงทะเบียนอบรม **ST Thai Soft Power Workshop 2569** สำหรับกิจกรรม Green Business Market ปีการศึกษา 2569 โดยใช้สถาปัตยกรรม **GitHub Pages + Google Apps Script + Google Sheets** รองรับผู้สมัครรวม 150 คน และโควตานักเรียนแผนวิทย์–คณิต 50 คนภายในจำนวนรวมดังกล่าว

ระบบต้องรองรับตั้งแต่การสมัคร การสร้าง QR ประจำตัว การรับชำระเงินทั้งเงินสดและโอนเงิน การออกใบรับเงินให้ปรากฏในระบบนักเรียน การตรวจสอบสถานะ และการ Check-in ในวันอบรม

## 2. ข้อมูลกิจกรรม

- ชื่อกิจกรรม: Workshop Thai Soft Power
- แนวคิด: จากอัตลักษณ์ไทย สู่แผนธุรกิจและผลิตภัณฑ์สร้างสรรค์
- โครงการ: Green Business Market ปีการศึกษา 2569
- วันจัดกิจกรรม: วันจันทร์ที่ 5 ตุลาคม 2569
- เวลา: 08.30–15.00 น.
- สถานที่: ห้องประชุมชั้น 5 อาคารเซนต์เทเรซา
- ค่าลงทะเบียน: 100 บาท/คน
- ค่าลงทะเบียนรวมอาหารกลางวัน อาหารว่าง และน้ำดื่ม
- จำนวนรับทั้งหมด: 150 คน
- โควตาวิทย์–คณิต: 50 คน
- หมดเขตรับสมัคร: 18 กันยายน 2569

## 3. สถาปัตยกรรม

```text
Student / Academic Staff
        │
        ▼
GitHub Pages
Frontend Website
        │ HTTPS API
        ▼
Google Apps Script Web App
Backend / Validation / Business Logic
        │
        ▼
Google Sheets
Central Database
```

### 3.1 GitHub Pages
รับผิดชอบ UI ทั้งฝั่งนักเรียนและเจ้าหน้าที่ เช่น หน้าแรก หน้า Register หน้า Status หน้า Receipt และ Admin Dashboard

### 3.2 Google Apps Script
รับผิดชอบ API, validation, concurrency lock, การสร้างรหัสสมัคร, การยืนยันชำระเงิน, การออกเลขใบรับเงิน, Dashboard summaries และ Check-in

### 3.3 Google Sheets
เป็นฐานข้อมูลกลางของระบบ โดยแยกข้อมูลเป็นหลายชีตเพื่อให้ตรวจสอบย้อนหลังและดูแลได้ง่าย

## 4. กลุ่มผู้ใช้งาน

### 4.1 นักเรียน
- ดูจำนวนผู้สมัครและที่นั่งคงเหลือแบบปัจจุบัน
- สมัครอบรม
- ได้เลขที่สมัครและ QR ประจำตัว
- ตรวจสอบสถานะการสมัครและชำระเงิน
- ดูและพิมพ์ใบรับเงินหลังเจ้าหน้าที่ยืนยัน
- เข้ากลุ่ม LINE ผ่านลิงก์/QR ที่กำหนด
- ใช้ QR เดิม Check-in วันอบรม

### 4.2 ฝ่ายวิชาการ
- ดู Dashboard
- ค้นหาผู้สมัคร
- สแกน QR
- ตรวจข้อมูลผู้สมัครก่อนรับเงิน
- เลือกวิธีชำระ เงินสด/โอน
- ยืนยันการรับเงิน 100 บาท
- ออกใบรับเงิน
- พิมพ์ใบรับเงินซ้ำ
- ยกเลิกรายการโดยไม่ลบเลขใบรับเงิน
- Check-in วันอบรม
- Export รายชื่อและข้อมูลสำหรับเกียรติบัตร

### 4.3 ผู้ดูแลระบบ
- ตั้งค่ากิจกรรม
- เปิด/ปิดรับสมัคร
- กำหนดจำนวนรับ
- กำหนดโควตา
- จัดการสิทธิ์ผู้ดูแล
- ตรวจสอบ Logs

## 5. Flow หลัก

```text
เข้าเว็บไซต์
  ↓
ดูจำนวนที่นั่ง
  ↓
กรอกใบสมัคร
  ↓
ตรวจ duplicate + capacity + quota
  ↓
สร้าง Registration ID
  ↓
สร้าง QR ประจำตัว
  ↓
นักเรียนไปห้องวิชาการ
  ↓
เจ้าหน้าที่สแกน QR
  ↓
เปิดข้อมูลผู้สมัคร
  ↓
เลือก เงินสด / โอน
  ↓
กดยืนยันรับเงิน
  ↓
สร้าง Receipt Number
  ↓
สถานะนักเรียนเปลี่ยนเป็น PAID/CONFIRMED
  ↓
ใบรับเงินปรากฏในระบบนักเรียน
  ↓
วันอบรมใช้ QR เดิม Check-in
```

## 6. หน้าเว็บไซต์

### 6.1 `/`
หน้าแรก แสดงข้อมูลกิจกรรม, จำนวนสมัคร `x/150`, จำนวนคงเหลือ, วิทย์–คณิต `x/50`, ชำระแล้ว และปุ่มสมัคร

### 6.2 `/register`
แบบฟอร์มสมัคร โดยข้อมูลหลักได้แก่
- รหัสนักเรียน
- คำนำหน้า
- ชื่อ
- นามสกุล
- ชื่อเล่น
- ชั้น
- ห้อง
- เลขที่
- แผนการเรียน
- เบอร์โทรศัพท์
- ประเภทผู้สมัคร

ถ้าเป็นตัวแทน Green Business Market ให้เก็บเพิ่ม
- ชื่อกลุ่ม/ชื่อร้าน
- ประเภทสินค้า: อาหาร / เครื่องดื่ม / ขนม
- ชื่อเมนู/แนวคิดสินค้า
- แนวคิด Thai Soft Power

### 6.3 `/success`
แสดงสมัครสำเร็จ, Registration ID, QR Code และสถานะรอชำระเงิน

### 6.4 `/status`
ให้นักเรียนตรวจสอบสถานะโดยใช้ข้อมูลยืนยันที่กำหนด

### 6.5 `/student`
หน้าโปรไฟล์ผู้สมัคร แสดงสถานะสมัคร สถานะชำระ Registration ID QR ใบรับเงิน และลิงก์ LINE

### 6.6 `/receipt`
แสดงใบรับเงินและปุ่มพิมพ์

### 6.7 `/admin`
Dashboard สำหรับฝ่ายวิชาการ

### 6.8 `/admin/scanner`
หน้าสแกน QR และเปิดข้อมูลผู้สมัคร

### 6.9 `/admin/payment`
หน้าเลือกวิธีชำระและยืนยันรับเงิน

### 6.10 `/admin/checkin`
โหมด Check-in วันอบรม

## 7. จำนวนผู้สมัครและโควตา

- `MAX_CAPACITY = 150`
- `SCI_MATH_QUOTA = 50`
- นักเรียนวิทย์–คณิต 50 คนเป็นส่วนหนึ่งของจำนวนรวม 150 คน ไม่ใช่เพิ่มจาก 150
- เมื่อครบ 150 คน ปิดรับสมัครทั้งหมด
- เมื่อวิทย์–คณิตครบ 50 คน ปิดเฉพาะประเภทดังกล่าว
- ใช้ `LockService` ใน Apps Script เพื่อป้องกันการสมัครเกินโควตาจาก concurrent requests

## 8. Registration ID

รูปแบบ:

```text
GBM2569-001
GBM2569-002
...
```

ใช้เป็น primary public identifier ของผู้สมัครและผูกกับ QR

## 9. QR ประจำตัว

QR จะเก็บลิงก์หรือ token ที่อ้างอิง Registration ID เท่านั้น ไม่ฝังข้อมูลส่วนบุคคลทั้งหมด

QR ใช้ได้สองช่วง
1. ยืนยันการชำระเงิน
2. Check-in วันอบรม

การสแกน QR ไม่ออกใบรับเงินทันที ต้องเปิดข้อมูลและให้เจ้าหน้าที่กด `ยืนยันรับเงิน` ก่อน

## 10. การชำระเงิน

รองรับ 2 วิธี

### 10.1 เงินสด
เจ้าหน้าที่เลือก `เงินสด` → กด `ยืนยันรับเงิน 100 บาท` → สร้างใบรับเงิน

### 10.2 โอนเงิน
เจ้าหน้าที่เลือก `โอนเงิน` และบันทึกข้อมูลที่จำเป็น เช่น วันเวลาโอน/หมายเหตุ/สลิป (ถ้าเปิดใช้) จากนั้นกดยืนยันก่อนออกใบรับเงิน

สถานะที่เกี่ยวข้อง:
- `PENDING_PAYMENT`
- `PAYMENT_REVIEW`
- `PAID`
- `CONFIRMED`

## 11. ใบรับเงิน

หลังยืนยันชำระเงิน ระบบสร้างเลขใบรับเงิน เช่น

```text
GBM-R2569-0001
GBM-R2569-0002
```

ข้อมูลใบรับเงิน:
- เลขที่ใบรับเงิน
- Registration ID
- ชื่อ–นามสกุล
- ชั้น/ห้อง
- รายการ: ค่าเข้าร่วมกิจกรรม Workshop Thai Soft Power
- จำนวน: 100.00 บาท
- ตัวอักษร: หนึ่งร้อยบาทถ้วน
- วิธีชำระ: เงินสด / โอนเงิน
- วันเวลาออกใบรับเงิน
- ผู้รับเงิน
- สถานะ

นักเรียนเห็นใบรับเงินทันทีในหน้า Student หลังเจ้าหน้าที่ยืนยัน

### กติกาใบรับเงิน
- เลขใบรับเงินไม่ reuse
- หากยกเลิกให้เปลี่ยนสถานะเป็น `VOID` หรือ `CANCELLED`
- ห้ามลบแถวใบรับเงินที่ออกแล้ว

## 12. Google Sheets

### 12.1 `Registrations`
คอลัมน์:

```text
registration_id
student_id
prefix
first_name
last_name
nickname
grade
room
number
program
phone
registration_type
group_name
product_type
product_name
soft_power_concept
registration_status
payment_status
created_at
updated_at
```

### 12.2 `Payments`

```text
payment_id
registration_id
amount
payment_method
payment_status
transfer_date
transfer_time
slip_url
received_by
received_at
note
```

### 12.3 `Receipts`

```text
receipt_id
receipt_number
registration_id
payment_id
amount
payment_method
issued_at
issued_by
receipt_status
```

### 12.4 `CheckIn`

```text
checkin_id
registration_id
checkin_date
checkin_time
checked_by
status
```

### 12.5 `Admins`
เก็บบัญชี/อีเมลผู้ดูแลและ role

### 12.6 `Settings`

```text
EVENT_NAME
EVENT_DATE
START_TIME
END_TIME
MAX_CAPACITY
SCI_MATH_QUOTA
FEE
REGISTRATION_DEADLINE
REGISTRATION_OPEN
LINE_GROUP_URL
```

### 12.7 `Logs`
เก็บ audit trail ของกิจกรรมสำคัญ เช่น register, payment confirm, receipt issue, cancel, check-in

## 13. API Design

### Public / Student
- `GET action=eventStatus`
- `POST action=register`
- `GET action=registration&id=...`
- `GET action=studentStatus&id=...`
- `GET action=receipt&id=...`

### Admin
- `GET action=dashboard`
- `GET action=searchRegistration`
- `POST action=confirmPayment`
- `POST action=voidReceipt`
- `POST action=checkIn`

ทุก endpoint ต้องส่ง JSON response รูปแบบสม่ำเสมอ เช่น

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

## 14. สถานะมาตรฐาน

```text
REGISTERED
PENDING_PAYMENT
PAYMENT_REVIEW
PAID
CONFIRMED
CHECKED_IN
CANCELLED
```

Receipt status:

```text
ISSUED
VOID
```

## 15. Dashboard

การ์ดสรุปด้านบน:
- ผู้สมัครทั้งหมด `x/150`
- ที่นั่งคงเหลือ
- ตัวแทน Green Business Market
- วิทย์–คณิต `x/50`
- ชำระแล้ว
- รอชำระ
- ยอดรับเงินแล้ว

ตารางรายชื่อ:
- Registration ID
- ชื่อ
- ชั้น/ห้อง
- ประเภท
- สถานะสมัคร
- สถานะชำระ
- วิธีชำระ
- เลขใบรับเงิน
- Actions

## 16. Security

- GitHub Pages เป็น frontend สาธารณะ แต่ห้ามฝัง Spreadsheet ID ที่มีสิทธิ์แก้ไขหรือข้อมูลลับที่ไม่จำเป็น
- Apps Script เป็นตัวกลางการเขียนข้อมูลทุกครั้ง
- Admin actions ต้องมี authentication/authorization แยกจาก public API
- ห้ามให้ QR เพียงอย่างเดียวสามารถยืนยันเงินได้
- ต้อง validate ทุกค่าฝั่ง Apps Script แม้ frontend จะ validate แล้ว
- ใช้ LockService ตอน register และออกเลข receipt
- Log ทุก admin mutation

## 17. Error Handling

ข้อความสำคัญที่ระบบต้องรองรับ:
- สมัครซ้ำ
- จำนวนผู้สมัครเต็ม 150 คน
- โควตาวิทย์–คณิตเต็ม 50 คน
- Registration ID ไม่ถูกต้อง
- ชำระเงินซ้ำ
- ออกใบรับเงินซ้ำ
- QR ไม่ถูกต้อง
- ยังไม่ชำระแต่พยายาม Check-in
- API/Sheet ชั่วคราวใช้งานไม่ได้

ผู้ใช้ต้องได้รับข้อความภาษาไทยที่เข้าใจง่าย และ backend ต้องไม่เผย stack trace ต่อหน้าเว็บ

## 18. Testing Criteria

ก่อนเปิดใช้จริงต้องทดสอบอย่างน้อย:
1. สมัครคนแรกสำเร็จ
2. ตรวจ duplicate student ID
3. สมัครพร้อมกันหลาย request โดยยอดไม่เกิน 150
4. วิทย์–คณิตเกิน 50 ไม่ได้
5. QR เรียกข้อมูลถูกคน
6. เงินสดออกใบรับเงินได้
7. โอนเงินออกใบรับเงินหลังยืนยันเท่านั้น
8. scan ซ้ำไม่สร้าง receipt ซ้ำ
9. ใบรับเงินเห็นในระบบนักเรียนทันทีหลังยืนยัน
10. receipt ที่ void ไม่ถูกนำเลขกลับมาใช้
11. Check-in สำเร็จเฉพาะผู้มีสิทธิ์
12. Dashboard totals ตรงกับข้อมูลจริง

## 19. Phase 1 Scope

Phase 1 จะทำเฉพาะสิ่งจำเป็นสำหรับใช้งานจริง:
- หน้าแรก + real-time counters
- Register
- Registration ID + QR
- Student status
- Admin dashboard
- QR scanner
- เงินสด + โอนเงิน
- Receipt
- Check-in
- Settings + Logs

ยังไม่รวม payment gateway อัตโนมัติ, certificate generator, SMS หรือ LINE Messaging API

## 20. Success Criteria

ระบบถือว่าพร้อมใช้งานเมื่อ:
- รับสมัครได้โดยไม่เกิน quota
- จำนวนผู้สมัครหน้าเว็บตรงกับ Sheet
- QR ของนักเรียนสแกนแล้วเปิดข้อมูลถูกต้อง
- เจ้าหน้าที่รับเงินได้ทั้งเงินสดและโอน
- หลังยืนยัน นักเรียนเห็นใบรับเงินของตนเอง
- ระบบไม่สร้าง receipt ซ้ำ
- Admin เห็นยอดสมัครและยอดเงินตรงกับข้อมูลจริง
- สามารถ Check-in วันงานด้วย QR เดิมได้
