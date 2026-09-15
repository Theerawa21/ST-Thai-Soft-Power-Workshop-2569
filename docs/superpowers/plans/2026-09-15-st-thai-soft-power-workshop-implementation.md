# ST Thai Soft Power Workshop 2569 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready registration website for ST Thai Soft Power Workshop 2569 using GitHub Pages, Google Apps Script, and Google Sheets, with live capacity, QR-based payment confirmation, receipts, admin dashboard, and event check-in.

**Architecture:** GitHub Pages serves the student/admin frontend. A Google Apps Script Web App exposes a JSON API and owns all authoritative business rules, including duplicate checks, 150-seat capacity, 50-seat science-math quota, payment confirmation, receipt numbering, and check-in. Google Sheets is the persistent database; the frontend never writes to Sheets directly.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, GitHub Pages, Google Apps Script, Google Sheets, QRCode.js, html5-qrcode, Node.js 20+, Vitest/JSDOM for frontend tests, Node `vm` mocks for Apps Script logic tests.

**Spec:** `docs/superpowers/specs/2026-09-15-st-thai-soft-power-workshop-design.md`

## Global Constraints

- Event date: 5 October 2569 (2026-10-05).
- Event time: 08:30–15:00.
- Venue: ห้องประชุมชั้น 5 อาคารเซนต์เทเรซา.
- Registration deadline: 18 September 2569.
- Fee: 100 THB per participant; includes lunch, snack, and drinking water.
- Maximum confirmed registrations: 150.
- Science–Math interested-student quota: 50 within the 150 total, not in addition to it.
- Green Business Market representatives submit 3–4 representatives per group.
- Product categories: อาหาร, เครื่องดื่ม, ขนม.
- Payment methods: CASH and TRANSFER.
- QR scanning must only open the applicant/payment record; payment is never confirmed merely by scanning.
- A receipt number is issued only after an authorized academic-office user confirms payment.
- Issued receipt numbers are immutable and never reused; voiding changes status instead of deleting the row.
- The same applicant QR is reused for event-day check-in.
- Student pages must never expose an admin-only action URL that can confirm payment without authorization.
- Do not store sensitive personal data inside the QR payload; store only a lookup URL/token.
- All capacity/quota writes must use Apps Script `LockService`.

---

## File Structure

```text
/
├─ index.html                      # landing page and live capacity
├─ register.html                   # registration form
├─ success.html                    # post-registration QR/status
├─ status.html                     # student lookup
├─ student.html                    # student dashboard
├─ receipt.html                    # printable receipt
├─ admin/
│  ├─ index.html                   # admin dashboard
│  ├─ scanner.html                 # QR scanner / applicant lookup
│  └─ checkin.html                 # event-day check-in
├─ assets/
│  ├─ css/app.css                  # shared responsive visual system
│  └─ js/
│     ├─ config.js                 # Apps Script endpoint + public config
│     ├─ api.js                    # fetch wrapper and API contract
│     ├─ ui.js                     # shared DOM, alerts, formatting
│     ├─ home.js                   # live capacity rendering
│     ├─ register.js               # form behavior/validation/submission
│     ├─ success.js                # QR generation after registration
│     ├─ status.js                 # student lookup flow
│     ├─ student.js                # student dashboard data/rendering
│     ├─ receipt.js                # receipt render/print
│     ├─ admin.js                  # admin dashboard/payment actions
│     ├─ scanner.js                # QR scanning and payment modal
│     └─ checkin.js                # check-in flow
├─ apps-script/
│  ├─ Code.gs                      # doGet/doPost request router
│  ├─ Config.gs                    # settings and sheet names
│  ├─ Sheets.gs                    # sheet initialization + row helpers
│  ├─ Registration.gs              # register/capacity/quota logic
│  ├─ Payments.gs                  # payment/receipt logic
│  ├─ Students.gs                  # public status/student/receipt reads
│  ├─ Admin.gs                     # admin dashboard/auth helpers
│  ├─ CheckIn.gs                   # event check-in logic
│  ├─ Security.gs                  # admin token/session validation
│  └─ Setup.gs                     # one-time setup function
├─ tests/
│  ├─ frontend/
│  │  ├─ api.test.js
│  │  ├─ register.test.js
│  │  └─ receipt.test.js
│  └─ apps-script/
│     ├─ registration.test.js
│     ├─ payments.test.js
│     └─ checkin.test.js
├─ package.json
├─ vitest.config.js
└─ README.md
```

---

### Task 1: Project skeleton, test harness, and shared frontend API contract

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `assets/js/config.js`
- Create: `assets/js/api.js`
- Create: `assets/js/ui.js`
- Create: `tests/frontend/api.test.js`
- Create: `README.md`

**Interfaces:**
- Consumes: none.
- Produces: `apiRequest(action, payload = {}, options = {}) -> Promise<object>`, `formatThaiDate()`, `formatMoney()`, `showMessage()`.

- [ ] **Step 1: Write the failing API wrapper test**

```js
import { describe, it, expect, vi } from 'vitest';
import { apiRequest } from '../../assets/js/api.js';

describe('apiRequest', () => {
  it('posts action and payload as JSON and returns parsed result', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, data: { remaining: 63 } })
    }));

    const result = await apiRequest('eventStatus', { sample: 1 });

    expect(fetch).toHaveBeenCalledOnce();
    expect(result.data.remaining).toBe(63);
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- tests/frontend/api.test.js`
Expected: FAIL because `assets/js/api.js` does not exist.

- [ ] **Step 3: Implement minimal config/API/UI modules**

`assets/js/config.js`:

```js
export const APP_CONFIG = {
  API_URL: 'PASTE_APPS_SCRIPT_WEB_APP_URL_HERE',
  EVENT_NAME: 'Workshop Thai Soft Power',
  MAX_CAPACITY: 150,
  SCI_MATH_QUOTA: 50,
  FEE: 100
};
```

`assets/js/api.js`:

```js
import { APP_CONFIG } from './config.js';

export async function apiRequest(action, payload = {}, options = {}) {
  const response = await fetch(APP_CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload, ...options })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error?.message || 'เกิดข้อผิดพลาด');
  return result;
}
```

`assets/js/ui.js` exports Thai date/money/message helpers with no network dependency.

- [ ] **Step 4: Add Node/Vitest config and run tests**

`package.json` scripts:

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

Run: `npm install && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.js assets/js tests/frontend README.md
git commit -m "chore: scaffold workshop registration web app"
```

---

### Task 2: Landing page with live capacity and registration state

**Files:**
- Create: `index.html`
- Create: `assets/css/app.css`
- Create: `assets/js/home.js`
- Modify: `tests/frontend/api.test.js`

**Interfaces:**
- Consumes: `apiRequest('eventStatus')`.
- Produces UI fields with IDs `totalCount`, `remainingCount`, `scienceMathCount`, `paidCount`, `registerButton`.

- [ ] **Step 1: Add failing test for event status request**

```js
it('requests eventStatus without exposing admin credentials', async () => {
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, data: {} }) }));
  await apiRequest('eventStatus');
  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.action).toBe('eventStatus');
  expect(body.adminToken).toBeUndefined();
});
```

- [ ] **Step 2: Run test and verify it fails if contract differs**

Run: `npm test -- tests/frontend/api.test.js`
Expected: PASS only after request body matches the public API contract.

- [ ] **Step 3: Build `index.html` and responsive visual system**

The page must show:
- ST Thai Soft Power Workshop 2569 title.
- 5 October 2569, 08:30–15:00, venue.
- Fee 100 THB.
- Cards: total `x/150`, remaining, science–math `x/50`, paid.
- Register button disabled when `registrationOpen=false` or `remaining=0`.

- [ ] **Step 4: Implement `home.js`**

```js
import { apiRequest } from './api.js';

async function loadStatus() {
  const { data } = await apiRequest('eventStatus');
  document.querySelector('#totalCount').textContent = `${data.total}/150`;
  document.querySelector('#remainingCount').textContent = data.remaining;
  document.querySelector('#scienceMathCount').textContent = `${data.scienceMath}/50`;
  document.querySelector('#paidCount').textContent = data.paid;
  document.querySelector('#registerButton').disabled = !data.registrationOpen || data.remaining <= 0;
}

loadStatus();
setInterval(loadStatus, 30000);
```

- [ ] **Step 5: Verify in browser and test suite**

Run: `npm test`
Expected: all tests PASS. Open `index.html` locally and verify mobile width 390px and desktop width 1440px have no horizontal scrolling.

- [ ] **Step 6: Commit**

```bash
git add index.html assets/css/app.css assets/js/home.js tests/frontend/api.test.js
git commit -m "feat: add live workshop landing page"
```

---

### Task 3: Google Sheets schema, Apps Script router, setup, capacity, and registration

**Files:**
- Create: `apps-script/Config.gs`
- Create: `apps-script/Sheets.gs`
- Create: `apps-script/Code.gs`
- Create: `apps-script/Registration.gs`
- Create: `apps-script/Setup.gs`
- Create: `tests/apps-script/registration.test.js`

**Interfaces:**
- Consumes: POST `{ action: 'eventStatus'|'register', payload: {...} }`.
- Produces: JSON `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
- Produces Sheets: `Registrations`, `Payments`, `Receipts`, `CheckIn`, `Admins`, `Settings`, `Logs`.

- [ ] **Step 1: Write failing pure business-rule tests**

Test cases:

```js
it('rejects registration when total reaches 150', () => {
  expect(validateCapacity({ total: 150, scienceMath: 20 }, 'MARKET_REP')).toEqual({
    ok: false,
    code: 'CAPACITY_FULL'
  });
});

it('rejects science-math registration when science quota reaches 50', () => {
  expect(validateCapacity({ total: 120, scienceMath: 50 }, 'SCI_MATH')).toEqual({
    ok: false,
    code: 'SCI_MATH_FULL'
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/apps-script/registration.test.js`
Expected: FAIL because Apps Script business functions do not exist.

- [ ] **Step 3: Implement constants/schema/setup**

`Config.gs` must define sheet names, 150 capacity, 50 science-math quota, fee 100, deadline, timezone `Asia/Bangkok`.

`Setup.gs` function `setupSystem()` must create missing sheets and header rows exactly once, then seed `Settings` keys:

```text
EVENT_NAME
EVENT_DATE
START_TIME
END_TIME
VENUE
MAX_CAPACITY
SCI_MATH_QUOTA
FEE
REGISTRATION_DEADLINE
REGISTRATION_OPEN
```

- [ ] **Step 4: Implement registration under `LockService`**

`registerStudent(payload)` must:
1. validate required fields;
2. lock with `LockService.getScriptLock().waitLock(10000)`;
3. count active registrations;
4. count `SCI_MATH` registrations;
5. reject duplicate `student_id` among non-cancelled registrations;
6. reject over-capacity/quota;
7. generate `GBM2569-001` style ID;
8. append registration with `PENDING_PAYMENT`;
9. log action;
10. release lock in `finally`.

- [ ] **Step 5: Implement `eventStatus()` and router**

`Code.gs` routes actions through a map, never `eval()`:

```js
const PUBLIC_ACTIONS = {
  eventStatus: () => getEventStatus(),
  register: payload => registerStudent(payload),
  studentStatus: payload => getStudentStatus(payload),
  receipt: payload => getStudentReceipt(payload)
};
```

- [ ] **Step 6: Run tests and manual setup test**

Run: `npm test -- tests/apps-script/registration.test.js`
Expected: PASS.

In Apps Script editor, run `setupSystem()` once and verify all seven sheets are present with one header row each.

- [ ] **Step 7: Commit**

```bash
git add apps-script tests/apps-script/registration.test.js
git commit -m "feat: add Apps Script registration backend"
```

---

### Task 4: Registration form, success QR, student lookup, and student dashboard

**Files:**
- Create: `register.html`
- Create: `success.html`
- Create: `status.html`
- Create: `student.html`
- Create: `assets/js/register.js`
- Create: `assets/js/success.js`
- Create: `assets/js/status.js`
- Create: `assets/js/student.js`
- Create: `tests/frontend/register.test.js`
- Create: `apps-script/Students.gs`

**Interfaces:**
- Consumes: `register`, `studentStatus` API actions.
- Produces: stored `registration_id` in session/local storage only as convenience, never as sole authentication.
- QR payload: public student lookup URL with opaque token or registration reference, not personal fields.

- [ ] **Step 1: Write failing form validation tests**

```js
import { validateRegistrationForm } from '../../assets/js/register.js';

it('requires market representatives to include group and product type', () => {
  const result = validateRegistrationForm({
    registration_type: 'MARKET_REP',
    group_name: '',
    product_type: ''
  });
  expect(result.ok).toBe(false);
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `npm test -- tests/frontend/register.test.js`
Expected: FAIL because validator does not exist.

- [ ] **Step 3: Build form behavior**

The form must include student ID, prefix, name, surname, nickname, grade, room, number, program, phone, registration type. When type is `MARKET_REP`, reveal group name, product type (อาหาร/เครื่องดื่ม/ขนม), product name, and Thai Soft Power concept.

- [ ] **Step 4: Build success QR page**

Use QRCode.js to render a QR from a student lookup URL returned by the backend. The page shows Registration ID, `รอชำระเงิน`, and instruction to show QR at the academic office.

- [ ] **Step 5: Implement student status read API**

`Students.gs` returns only student-safe fields: masked student ID when appropriate, name, class, registration/payment/check-in status, receipt number if paid, and student QR token/URL.

Student lookup must require two matching factors, e.g. `registration_id + last 4 digits of phone` or `student_id + phone`.

- [ ] **Step 6: Run tests and manual flow**

Run: `npm test`
Expected: all tests PASS.

Manual: register a test student, confirm success page shows `GBM2569-xxx` and a scannable QR.

- [ ] **Step 7: Commit**

```bash
git add register.html success.html status.html student.html assets/js apps-script/Students.gs tests/frontend/register.test.js
git commit -m "feat: add student registration and QR flow"
```

---

### Task 5: Admin security, QR scan, payment confirmation, and immutable receipt issuance

**Files:**
- Create: `apps-script/Security.gs`
- Create: `apps-script/Admin.gs`
- Create: `apps-script/Payments.gs`
- Create: `admin/index.html`
- Create: `admin/scanner.html`
- Create: `assets/js/admin.js`
- Create: `assets/js/scanner.js`
- Create: `tests/apps-script/payments.test.js`

**Interfaces:**
- Consumes admin request with server-verifiable `adminToken`.
- Produces `confirmPayment(registrationId, method, transferMeta, adminIdentity)`.
- Receipt format: `GBM-R2569-0001`.

- [ ] **Step 1: Write failing payment tests**

```js
it('does not issue a receipt before payment confirmation', () => {
  expect(canIssueReceipt({ payment_status: 'PENDING_PAYMENT' })).toBe(false);
});

it('refuses a second receipt for the same confirmed payment', () => {
  expect(canIssueReceipt({ payment_status: 'PAID', receipt_number: 'GBM-R2569-0001' })).toBe(false);
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `npm test -- tests/apps-script/payments.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement admin authorization**

`Security.gs` must validate an admin token stored in Script Properties or verify an approved admin identity. Public requests cannot call `confirmPayment`, `dashboard`, or `checkIn` successfully.

- [ ] **Step 4: Implement payment/receipt transaction**

Within one script lock:
1. fetch active applicant;
2. reject already-paid or cancelled records;
3. validate method `CASH|TRANSFER`;
4. append `Payments` row for 100 THB;
5. generate next immutable receipt number;
6. append `Receipts` row;
7. update registration to `PAID` then `CONFIRMED`;
8. append audit log;
9. return receipt summary.

For `TRANSFER`, accept transfer date/time/reference/note and optional slip URL metadata; still require manual admin confirmation.

- [ ] **Step 5: Build admin scanner/payment UI**

Use `html5-qrcode` for camera scanning. After scan, show applicant detail first, payment status, amount 100 THB, payment method selector, then explicit `ยืนยันรับเงิน 100 บาท` button. Disable the button after success to prevent double clicks.

- [ ] **Step 6: Run tests and manual duplicate-scan test**

Run: `npm test -- tests/apps-script/payments.test.js`
Expected: PASS.

Manual: scan same paid QR twice. Second attempt must display already-paid status and must not create another receipt.

- [ ] **Step 7: Commit**

```bash
git add apps-script/Security.gs apps-script/Admin.gs apps-script/Payments.gs admin assets/js/admin.js assets/js/scanner.js tests/apps-script/payments.test.js
git commit -m "feat: add QR payment confirmation and receipts"
```

---

### Task 6: Student receipt page and print layout

**Files:**
- Create: `receipt.html`
- Create: `assets/js/receipt.js`
- Create: `tests/frontend/receipt.test.js`
- Modify: `assets/css/app.css`
- Modify: `apps-script/Students.gs`

**Interfaces:**
- Consumes: `receipt` public read action with student verification.
- Produces printable receipt containing receipt no., Registration ID, name, class, amount, Thai text amount, payment method, timestamp, receiver, and status.

- [ ] **Step 1: Write failing receipt formatting test**

```js
import { receiptViewModel } from '../../assets/js/receipt.js';

it('formats 100 THB as one hundred baht receipt data', () => {
  const vm = receiptViewModel({ amount: 100, payment_method: 'CASH' });
  expect(vm.amount).toBe('100.00 บาท');
  expect(vm.amountText).toBe('หนึ่งร้อยบาทถ้วน');
  expect(vm.paymentMethod).toBe('เงินสด');
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/frontend/receipt.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement receipt renderer and print CSS**

Receipt heading: `โรงเรียนเซนต์เทเรซา` and `ใบรับเงินกิจกรรม Workshop Thai Soft Power 2569`. Add `@media print` to hide navigation/buttons and fit A4 cleanly.

- [ ] **Step 4: Add student receipt endpoint rules**

Return receipt only when registration is PAID/CONFIRMED/CHECKED_IN and verification factors match. Never return admin token or internal audit fields.

- [ ] **Step 5: Run tests and print preview**

Run: `npm test -- tests/frontend/receipt.test.js`
Expected: PASS.

Manual: browser Print Preview must show one clean page with no controls.

- [ ] **Step 6: Commit**

```bash
git add receipt.html assets/js/receipt.js assets/css/app.css apps-script/Students.gs tests/frontend/receipt.test.js
git commit -m "feat: add printable student receipt"
```

---

### Task 7: Dashboard statistics and event-day check-in using the same QR

**Files:**
- Create: `apps-script/CheckIn.gs`
- Create: `admin/checkin.html`
- Create: `assets/js/checkin.js`
- Create: `tests/apps-script/checkin.test.js`
- Modify: `apps-script/Admin.gs`
- Modify: `admin/index.html`
- Modify: `assets/js/admin.js`

**Interfaces:**
- Consumes: authorized `dashboard` and `checkIn` actions.
- Produces dashboard `{ total, remaining, marketRep, scienceMath, paid, pendingPayment, checkedIn, revenue }`.
- Produces idempotent check-in record keyed by Registration ID.

- [ ] **Step 1: Write failing check-in tests**

```js
it('requires paid status before check-in', () => {
  expect(validateCheckIn({ registration_status: 'REGISTERED', payment_status: 'PENDING_PAYMENT' })).toEqual({
    ok: false,
    code: 'PAYMENT_REQUIRED'
  });
});

it('treats repeated check-in as already checked in, not a second record', () => {
  expect(validateCheckIn({ payment_status: 'PAID', checked_in: true }).code).toBe('ALREADY_CHECKED_IN');
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/apps-script/checkin.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement dashboard aggregation**

Compute counts from authoritative Sheets rows, not frontend counters. Revenue equals sum of non-void PAID payments/receipts.

- [ ] **Step 4: Implement check-in transaction**

Scan same QR, validate paid status, reject cancelled registration, append one `CheckIn` row, update registration to `CHECKED_IN`, and log action. Re-scan returns `ALREADY_CHECKED_IN` with original time.

- [ ] **Step 5: Build admin dashboard and check-in UI**

Dashboard cards:
- Applicants x/150
- Remaining
- Science–Math x/50
- Paid
- Pending payment
- Checked in
- Revenue THB

Check-in page uses camera scanner plus manual Registration ID fallback.

- [ ] **Step 6: Run full tests and manual end-to-end scenario**

Run: `npm test`
Expected: all tests PASS.

Manual scenario: register → scan/pay → receipt visible → scan at check-in → student status shows checked in.

- [ ] **Step 7: Commit**

```bash
git add apps-script/CheckIn.gs admin/checkin.html admin/index.html assets/js/checkin.js assets/js/admin.js tests/apps-script/checkin.test.js
git commit -m "feat: add dashboard and workshop check-in"
```

---

### Task 8: Deployment configuration, CORS-safe request behavior, GitHub Pages readiness, and operator documentation

**Files:**
- Modify: `assets/js/config.js`
- Modify: `apps-script/Code.gs`
- Modify: `README.md`
- Create: `docs/DEPLOYMENT.md`

**Interfaces:**
- Consumes deployed Apps Script Web App URL.
- Produces documented setup/deploy process with one URL value in frontend config.

- [ ] **Step 1: Add a configuration guard test**

Add test asserting API requests fail with a clear message when `API_URL` remains `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE`.

- [ ] **Step 2: Run and verify failure**

Run: `npm test`
Expected: FAIL until guard is implemented.

- [ ] **Step 3: Implement deployment guard and JSON response helper**

Ensure Apps Script accepts `text/plain` JSON POST from GitHub Pages to avoid unnecessary browser preflight behavior, and every handler returns a JSON `ContentService` response.

- [ ] **Step 4: Write exact deployment instructions**

`docs/DEPLOYMENT.md` must include:
1. create/open Google Sheet;
2. open Extensions → Apps Script;
3. copy each `apps-script/*.gs` file;
4. set spreadsheet ID / Script Properties;
5. run `setupSystem()`;
6. create admin secret/token in Script Properties;
7. deploy Web App as the owner with required access setting;
8. copy `/exec` URL into `assets/js/config.js`;
9. enable GitHub Pages from `main` root;
10. execute end-to-end smoke test.

- [ ] **Step 5: Run final verification**

Run: `npm test`
Expected: PASS.

Also verify repository has no real admin secret, bank credentials, or private student data committed.

- [ ] **Step 6: Commit**

```bash
git add assets/js/config.js apps-script/Code.gs README.md docs/DEPLOYMENT.md tests
git commit -m "docs: add deployment and production checks"
```

---

## Final Acceptance Test

Use a clean test spreadsheet and deployed test Apps Script endpoint.

1. Status page shows `0/150`, science–math `0/50`, paid `0`.
2. Register a MARKET_REP test student and verify `GBM2569-001` + QR.
3. Register the same student ID again; expect duplicate rejection.
4. Register a SCI_MATH student; status updates science–math count.
5. Admin scans first QR; no receipt exists before confirmation.
6. Admin selects CASH and confirms 100 THB; exactly one payment and one receipt are created.
7. Student dashboard immediately shows PAID/CONFIRMED and receipt `GBM-R2569-0001`.
8. Re-scan for payment; no second receipt is created.
9. Print receipt; preview is one page and contains correct name, 100.00 บาท, หนึ่งร้อยบาทถ้วน, and payment method.
10. Switch to check-in mode and scan the same QR; check-in succeeds once.
11. Scan it again; system reports already checked in and does not append a duplicate row.
12. Fill test data to science–math 50; the 51st SCI_MATH registration is rejected while other capacity can remain.
13. Fill active registration count to 150; the next registration is rejected.
14. Dashboard totals match the sheet rows and revenue equals confirmed non-void receipts × 100 THB.
15. Public/student API calls cannot invoke admin payment/check-in/dashboard actions without valid authorization.

## Plan Self-Review

- Spec coverage: registration, live counters, capacity/quota, QR, CASH/TRANSFER, manual payment confirmation, immutable receipts, student receipt view, admin dashboard, check-in, Sheets, Apps Script API, GitHub Pages, concurrency, and security are all mapped to tasks.
- Placeholder scan: the only intentional deployment placeholder is the Apps Script URL, and Task 8 explicitly guards and replaces it during deployment.
- Type/contract consistency: registration types are `MARKET_REP|SCI_MATH`; payment methods are `CASH|TRANSFER`; primary public ID is `GBM2569-xxx`; receipt is `GBM-R2569-xxxx`; public read actions and admin actions remain separated.
