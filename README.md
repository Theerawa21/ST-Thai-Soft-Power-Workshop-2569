# ST Thai Soft Power Workshop 2569

ระบบลงทะเบียนอบรม Green Business Market ปีการศึกษา 2569 สำหรับโรงเรียนเซนต์เทเรซา

## Architecture

- GitHub Pages: student/admin frontend
- Google Apps Script: API and business logic
- Google Sheets: persistent data store

## Event

- วันที่: 5 ตุลาคม 2569
- เวลา: 08.30–15.00 น.
- สถานที่: ห้องประชุมชั้น 5 อาคารเซนต์เทเรซา
- ค่าลงทะเบียน: 100 บาท/คน
- จำนวนรับรวม: 150 คน
- โควตาวิทย์–คณิต: 50 คนภายในจำนวนรวม

## Local tests

```bash
npm install
npm test
```

## Apps Script setup

1. สร้าง Google Apps Script project ที่ผูกกับ Google Sheet ฐานข้อมูล
2. คัดลอกไฟล์ใน `apps-script/` เข้า Apps Script project
3. รัน `setupSystem()` หนึ่งครั้ง
4. Deploy เป็น Web App
5. นำ Web App URL ไปใส่ใน `assets/js/config.js`

## Branch

งานพัฒนา V1 อยู่บน `feature/registration-system-v1` จนกว่าจะผ่านการตรวจสอบและพร้อมรวมเข้า `main`.
