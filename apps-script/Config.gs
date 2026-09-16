const APP = Object.freeze({
  TIMEZONE: 'Asia/Bangkok',
  MAX_CAPACITY: 200,
  MARKET_REP_QUOTA: 150,
  SCI_MATH_QUOTA: 50,
  FEE: 100,
  REGISTRATION_PREFIX: 'GBM2569-',
  RECEIPT_PREFIX: 'GBM-R2569-',
  SHEETS: {
    REGISTRATIONS: 'Registrations',
    PAYMENTS: 'Payments',
    RECEIPTS: 'Receipts',
    CHECKIN: 'CheckIn',
    ADMINS: 'Admins',
    SETTINGS: 'Settings',
    LOGS: 'Logs'
  }
});

const HEADERS = Object.freeze({
  Registrations: [
    'registration_id','student_id','prefix','first_name','last_name','nickname',
    'grade','room','number','program','phone','registration_type','group_name',
    'product_type','product_name','soft_power_concept','public_token',
    'registration_status','payment_status','created_at','updated_at'
  ],
  Payments: [
    'payment_id','registration_id','amount','payment_method','payment_status',
    'transfer_date','transfer_time','slip_url','received_by','received_at','note'
  ],
  Receipts: [
    'receipt_id','receipt_number','registration_id','payment_id','amount',
    'payment_method','issued_at','issued_by','receipt_status'
  ],
  CheckIn: ['checkin_id','registration_id','checkin_date','checkin_time','checked_by','status'],
  Admins: ['email','display_name','role','active','created_at'],
  Settings: ['key','value','updated_at'],
  Logs: ['log_id','timestamp','actor','action','entity_type','entity_id','details_json']
});

function defaultSettings_() {
  return {
    EVENT_NAME: 'Workshop Thai Soft Power',
    EVENT_DATE: '2026-10-05',
    START_TIME: '08:30',
    END_TIME: '15:00',
    VENUE: 'ห้องประชุมชั้น 5 อาคารเซนต์เทเรซา',
    MAX_CAPACITY: '200',
    MARKET_REP_QUOTA: '150',
    SCI_MATH_QUOTA: '50',
    FEE: '100',
    REGISTRATION_DEADLINE: '2026-09-18',
    REGISTRATION_OPEN: 'TRUE',
    LINE_GROUP_URL: ''
  };
}
