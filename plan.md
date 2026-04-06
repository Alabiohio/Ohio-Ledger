

```markdown
# 🧾 Ohio Ledger — Implementation Plan

## Overview
Ohio Ledger is a receipt and expense/income tracking system designed for small businesses, freelancers, and individuals.  
Users can upload receipts (PDF or images), automatically extract transaction data via OCR, generate statements, and export them as PDF or Excel.

---

## Features (MVP)
- **Receipt Upload:** Support PDF and image files.  
- **OCR Extraction:** Extract merchant, date, amount, category, and type (income/expense).  
- **Transaction Storage:** Save extracted data in a database.  
- **Dashboard:** Display total income, total expenses, net profit, and charts.  
- **Export Options:** Export statements to PDF or Excel.  

Optional Future Features:
- Auto-categorization using AI
- Multiple businesses/accounts
- Bank statement import
- Invoice generator
- Tax calculations

---

## Architecture

```

Frontend (Next.js)
↓
Upload API
↓
File Storage (Cloudinary / Supabase / S3)
↓
OCR Service (Tesseract.js / Google Vision)
↓
Transaction Parser
↓
Database (PostgreSQL / Firebase)
↓
Reports Generator (PDF / Excel)

```

---

## Tech Stack

**Frontend**
- Next.js (App router)
- Tailwind CSS
- Recharts / Chart.js (dashboard charts)
- Upload and preview components

**Backend**
- Next.js API routes (or Node.js server)
- OCR service (Tesseract.js recommended)
- Parsing and validation logic
- Export endpoints (PDF/Excel)

**Database**
- PostgreSQL (recommended)  
OR
- Firebase / Supabase (for fast MVP)

**File Storage**
- Cloudinary (free tier)  
OR
- Supabase Storage  
OR
- AWS S3

**Export Libraries**
- PDF: jsPDF / pdf-lib
- Excel: xlsx

---

## Database Design

**users**
```

id
name
email

```

**transactions**
```

id
user_id
type (expense/income)
amount
merchant
date
category
receipt_url
notes
created_at

```

**categories**
```

Food, Transport, Office, Utilities, Salary, Other

```

---

## Upload & OCR Flow

1. User uploads receipt (image/PDF)  
2. File is stored in cloud storage  
3. OCR service extracts text  
4. Parser extracts transaction details:
   - Merchant
   - Date
   - Amount
   - Type
   - Category (optional)  
5. User previews and confirms  
6. Transaction is saved in the database  
7. Dashboard updates automatically  

---

## Dashboard Design

**Cards**
- Total Income
- Total Expenses
- Net Profit

**Charts**
- Monthly expenses
- Category breakdown
- Income vs Expense

**Tables**
- Transaction list with filters and search

---

## Export Features

### PDF Export
- Generates summary or detailed statements
- Library: jsPDF / pdf-lib

Example:
```

Ohio Ledger Statement
Date Range: Jan 1 – Jan 31, 2026

Income: ₦50,000
Expenses: ₦20,000
Net Profit: ₦30,000

```

### Excel Export
- Generates table with transaction details
- Library: xlsx

Columns:
```

Date | Merchant | Category | Amount | Type

```

---

## Folder Structure

```

ohio-ledger/
├── app/
├── components/
│   ├── upload/
│   ├── receipt-preview/
│   ├── dashboard/
│   └── charts/
├── lib/
│   ├── ocr.ts
│   ├── parser.ts
│   ├── export-pdf.ts
│   └── export-excel.ts
├── api/
│   ├── upload.ts
│   ├── parse.ts
│   └── export.ts

```

---

## MVP Build Order

**Phase 1:**  
- Upload receipts  
- Store images  
- Manual entry (optional)

**Phase 2:**  
- OCR extraction and parsing

**Phase 3:**  
- Dashboard & totals

**Phase 4:**  
- PDF export

**Phase 5:**  
- Excel export

---

## Estimated Timeline

| Feature                 | Time (Solo Dev) |
|-------------------------|----------------|
| Upload + storage        | 1–2 days       |
| OCR + parsing           | 2–5 days       |
| Dashboard + charts      | 2–4 days       |
| PDF export              | 1–2 days       |
| Excel export            | 1–2 days       |
| Testing & polishing     | 2–3 days       |

**Total:** ~10–18 days full-time (~2–3 weeks)

---

## Estimated Costs

| Item                   | Cost Estimate            |
|------------------------|-------------------------|
| Cloud storage          | $0–$10/month            |
| OCR API (optional)     | $0–$20/month            |
| Database hosting       | Free–$20/month          |
| PDF / Excel libraries  | Free                     |
| Development (if hired) | $500–$1500              |
| **MVP monthly cloud cost** | $0–$30               |

---

## Notes
- Start with **Tesseract.js** for free OCR during MVP.  
- Use free tiers (Supabase, Cloudinary, Vercel) to minimize costs.  
- Keep export generation client-side if possible to reduce backend load.  
- Future features (AI auto-categorization, multiple businesses, bank imports) can be added once MVP is stable.

---

**Author:** Alabi Ohiocheoya Isaac  
**Project:** Ohio Workspace — Ohio Ledger  
**Date:** April 2026
```


