

# 🧾 Ohio Ledger — Full Accounting Implementation Plan

## Overview
Ohio Ledger is a modern, lightweight accounting system for small businesses, freelancers, and individuals.  
It allows users to upload receipts, manage accounts, maintain a general ledger, generate financial statements, and export reports.  

---

## Features (MVP + Expanded Accounting)

### Core Features (MVP)
- Upload receipts (PDF / images)  
- OCR extraction (merchant, date, amount, type)  
- Manual entry/edit of transactions  
- Dashboard (total income, expenses, net profit)  
- Transaction table with filters/search  
- Export PDF / Excel of statements  

### Accounting Suite Features
1. **Accounts & Chart of Accounts**
   - Predefined account categories: Assets, Liabilities, Equity, Income, Expenses  
   - Ability to create, edit, delete custom accounts  
2. **General Ledger**
   - All transactions post to relevant accounts  
   - Debit & credit tracking  
   - Account-specific ledger view  
   - Date range filtering  
3. **Journal Entries**
   - Manual journal creation  
   - Auto-generated from receipts  
   - Support for double-entry bookkeeping  
4. **Trial Balance**
   - Check Debits = Credits  
   - Summarize accounts per category  
5. **Balance Sheet**
   - Assets = Liabilities + Equity  
   - Snapshot per month, quarter, year  
   - Exportable to PDF / Excel  
6. **Income Statement / Profit & Loss**
   - Summarizes income and expenses  
   - Shows Net Profit / Loss  
   - Category breakdown  
7. **Cash Flow Statement**
   - Tracks cash inflows/outflows  
   - Operating, Investing, Financing sections  
   - Visualizations optional  
8. **Multi-Business & Multi-User Support**
   - Users manage multiple businesses  
   - Roles: Admin, Accountant, Viewer  
9. **Reports & Exports**
   - Ledger, Trial Balance, Balance Sheet, Income Statement, Cash Flow  
   - PDF / Excel exports with customizable branding  

---

## Architecture



Frontend (Next.js)
↓
Upload API
↓
File Storage (Cloudinary / Supabase / S3)
↓
OCR Service (Tesseract.js / Google Vision)
↓
Transaction Parser → Account Mapping
↓
General Ledger
↓
Database (PostgreSQL / Supabase)
↓
Reports Generator (PDF / Excel / Charts)

```

---

## Tech Stack

**Frontend**
- Next.js (App router)  
- Tailwind CSS  
- Chart.js / Recharts for financial charts  
- Upload and preview components  

**Backend**
- Next.js API routes or Node.js server  
- OCR: Tesseract.js (free) or Google Vision API  
- Parser and double-entry logic  
- PDF/Excel export: jsPDF / pdf-lib / xlsx  

**Database & Storage**
- PostgreSQL (recommended) for accounting data  
- Supabase / Firebase for MVP  
- Cloudinary / Supabase Storage / AWS S3 for receipts  

---

## Database Design

**users**
```

id
name
email
role

```

**businesses**
```

id
user_id
name
description

```

**accounts**
```

id
business_id
name
type (Asset, Liability, Equity, Income, Expense)
parent_account (optional)

```

**transactions**
```

id
business_id
account_id
type (Debit / Credit)
amount
merchant
date
category
receipt_url
notes
created_at

```

**journal_entries**
```

id
business_id
description
entries [ { account_id, debit, credit } ]
date

```

---

## Layout & UI

### Sidebar Navigation
- Logo / App Name  
- Menu:
  - Dashboard  
  - Upload Receipt  
  - Transactions  
  - Ledger  
  - Reports  
  - Accounts  
  - Export  
- Dark Gray background, Peach active highlight  

### Header
- Page title  
- Search / Filters  
- Profile / Notifications  

### Main Content
- **Dashboard:** Cards + Charts (Income, Expenses, Net Profit, Cash Flow)  
- **Upload Receipt:** Drag & Drop + Preview + OCR confirmation  
- **Transactions Table:** Filter, sort, edit, delete  
- **Ledger & Accounts:** Account-specific ledger, balances, trial balance  
- **Reports:** Balance Sheet, Income Statement, Cash Flow, PDF/Excel export  

---

## Workflow

1. User creates business account → sets up chart of accounts  
2. User uploads receipts → OCR extracts data  
3. Transactions are mapped to accounts → double-entry applied  
4. Ledger updated → balances recalculated  
5. Dashboard and reports automatically update  
6. Export statements as PDF / Excel  

---

## MVP Build Order

**Phase 1:**  
- Upload receipt, manual entry, store transactions  

**Phase 2:**  
- OCR extraction and parsing  
- Map to accounts  

**Phase 3:**  
- Dashboard + summary charts  

**Phase 4:**  
- General ledger, trial balance  
- Manual journal entries  

**Phase 5:**  
- Financial statements: Balance Sheet, Income Statement, Cash Flow  

**Phase 6:**  
- PDF / Excel export  
- Multi-business & multi-user support  

---

## Timeline (Solo Dev)

| Feature                         | Time (Days) |
|---------------------------------|------------|
| Upload + storage                 | 1–2        |
| OCR + parsing + account mapping  | 3–5        |
| Dashboard + charts               | 2–4        |
| General ledger & trial balance   | 3–5        |
| Journal entries                  | 2–3        |
| Financial statements             | 3–5        |
| PDF / Excel export               | 1–2        |
| Multi-business/user support      | 2–3        |
| Testing & polishing              | 3–4        |

**Total:** ~20–30 days full-time (~4–6 weeks part-time)

---

## Cost Estimate

| Item                   | Cost Estimate            |
|------------------------|-------------------------|
| Cloud storage          | $0–$10/month            |
| OCR API (optional)     | $0–$20/month            |
| Database hosting       | Free–$20/month          |
| PDF / Excel libraries  | Free                     |
| Development (if hired) | $700–$2000              |
| MVP monthly cloud cost | $0–$30                  |

---

## Colors (Branding)

- Peach / Soft Orange `#FFAD80` → Primary buttons / highlights  
- Gold `#FFD700` → Totals, active states  
- Dark Gray `#2E2E2E` → Sidebar, headers  
- Light Gray `#F5F5F5` → Background  
- Medium Gray `#BDBDBD` → Borders, secondary text  
- Green `#4CAF50` → Income / positive values  
- Red `#F44336` → Expenses / negative values  
- Blue `#2196F3` → Info / charts  

---

**Author:** Alabi Ohiocheoya Isaac  
**Project:** Ohio Workspace — Ohio Ledger  
**Date:** April 2026
```
