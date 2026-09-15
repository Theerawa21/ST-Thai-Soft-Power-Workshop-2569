const SYSTEM_CONFIG = Object.freeze({
  TIMEZONE: 'Asia/Bangkok',
  MAX_CAPACITY: 150,
  SCI_MATH_QUOTA: 50,
  FEE: 100,
  EVENT_DATE: '2026-10-05',
  REGISTRATION_DEADLINE: '2026-09-18T23:59:59+07:00',
  SHEETS: Object.freeze({
    REGISTRATIONS: 'Registrations',
    PAYMENTS: 'Payments',
    RECEIPTS: 'Receipts',
    CHECKIN: 'CheckIn',
    ADMINS: 'Admins',
    SETTINGS: 'Settings',
    LOGS: 'Logs'
  })
});

const SHEET_HEADERS = Object.freeze({
  Registrations: [
    'registration_id','public_token','student_id','prefix','first_name','last_name','nickname',
    'grade','room','number','program','phone','registration_type','group_name','product_type',
    'product_name','soft_power_concept','registration_status','payment_status','created_at','updated_at'
  ],
  Payments: [
    'payment_id','registration_id','amount','payment_method','payment_status','transfer_reference',
    'transfer_note','received_by','received_at','created_at'
  ],
  Receipts: [
    'receipt_id','receipt_number','registration_id','payment_id','amount','payment_method',
    'issued_at','issued_by','receipt_status'
  ],
  CheckIn: ['checkin_id','registration_id','checkin_at','checked_by','status'],
  Admins: ['admin_id','display_name','email','active','created_at'],
  Settings: ['key','value','updated_at'],
  Logs: ['log_id','action','registration_id','detail','actor','created_at']
});
