

````markdown
# 🧾 Ohio Ledger

Ohio Ledger is a lightweight, modern expense and income tracking system built for small businesses, freelancers, and individuals.  
It allows users to upload receipts (PDF or images), automatically extract transaction data using OCR, view reports on a dashboard, and export statements as PDF or Excel.

---

## Features

- **Upload Receipts**: Support for PDF and image files (JPEG, PNG).  
- **OCR Extraction**: Automatically extracts merchant, date, amount, category, and type (income/expense).  
- **Transaction Storage**: Saves transactions in a database for reporting.  
- **Dashboard**: Visualize total income, expenses, net profit, and category breakdown.  
- **Export Options**: Generate PDF and Excel statements.  

### Optional Future Features
- Auto-categorization using AI  
- Multi-business support  
- Bank statement imports  
- Invoice generation  
- Tax calculations  

---

## Tech Stack

**Frontend**
- Next.js  
- Tailwind CSS  
- Recharts / Chart.js (dashboard charts)  

**Backend**
- Next.js API routes or Node.js server  
- OCR: Tesseract.js (free) or Google Vision API (paid)  
- PDF/Excel export: jsPDF / pdf-lib / xlsx  

**Database & Storage**
- PostgreSQL (recommended)  
- Supabase / Firebase (for fast MVP)  
- File Storage: Cloudinary / Supabase Storage / AWS S3  

---

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ohio-ledger.git
cd ohio-ledger
````

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `.env.local`:

```env
DATABASE_URL=your_database_url
CLOUDINARY_URL=your_cloudinary_url
OCR_API_KEY=your_ocr_api_key  # optional if using Tesseract.js
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Usage

1. Upload a receipt (PDF or image).
2. OCR automatically extracts merchant, date, amount, and category.
3. Confirm and save the transaction.
4. View totals and charts on the dashboard.
5. Export statements as PDF or Excel.

---

## Folder Structure

```
ohio-ledger/
 ├── app/                # Frontend pages and routing
 ├── components/         # UI components
 │   ├── upload/
 │   ├── receipt-preview/
 │   ├── dashboard/
 │   └── charts/
 ├── lib/                # Libraries and helper functions
 │   ├── ocr.ts
 │   ├── parser.ts
 │   ├── export-pdf.ts
 │   └── export-excel.ts
 ├── api/                # API routes
 │   ├── upload.ts
 │   ├── parse.ts
 │   └── export.ts
```

---

## Contributing

1. Fork the repo
2. Create a new branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Commit (`git commit -m 'Add feature'`)
5. Push (`git push origin feature/my-feature`)
6. Open a pull request

---

## License

MIT License © 2026 Alabi Ohiocheoya Isaac

---

## Contact

Project: [Ohio Workspace](https://ohiocodespace.vercel.app)
Author: Alabi Ohiocheoya Isaac
Email: [ohioalabi@gmail.com ](mailto:[ohiocodespace@gmail.com])

```
