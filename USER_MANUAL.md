# 🧾 Ohio Ledger: User Manual & Documentation

Welcome to the **Ohio Ledger** documentation. This guide provides a comprehensive overview of the platform's features and step-by-step instructions on how to manage your business finances effectively.

---

## 🌟 Introduction
Ohio Ledger is a premium, smart accounting suite designed for individuals and businesses. It leverages double-entry bookkeeping, OCR-powered receipt processing, and real-time financial analytics to give you total control over your financial health.

---

## 🚀 Getting Started

### 1. Authentication
- **Login/Sign Up**: Access the platform via the `/login` page. You can sign in using your email or social providers (if configured).
- **Session Management**: Your session is securely managed by Supabase Auth.

### 2. Business Setup
- Upon your first login, a default business ("My Business") is automatically created for you.
- **Multiple Businesses**: You can manage multiple business entities under a single account.
- **Default Accounts**: Each new business is seeded with a standard **Chart of Accounts**, including Cash, Inventory, Accounts Payable, Sales Revenue, and common expenses.

---

## 📊 Dashboard: Your Financial Cockpit
The dashboard provides a real-time "Snapshot" of your business performance.

- **Cash Position**: Displays your available liquidity (balance of the 'Cash' account).
- **Total Yield (Income)**: The sum of all revenue generated.
- **Outflow (Expenses)**: The sum of all costs incurred.
- **Net Reserve (Profit)**: Your bottom line (Total Income - Total Expenses).
- **Visual Analytics**: Interactive charts showing trends in income and spending over time.

**How to use:**
- Tap/Click on the **Manual Record** button to quickly log a transaction.
- Tap/Click on **Upload Receipt** to start the OCR processing flow.

---

## 📦 Inventory & Stock Management
The **Stock Ledger** provides a detailed overview of your physical goods, allowing you to track quantities, values, and cost of goods sold.

### Core Features
- **Stock Tracking:** Instantly see exactly how much of each item you have physically in stock.
- **Valuation (FIFO):** The system automatically calculates your total Stock Value based on the actual price you paid for each batch.
- **Low Stock Alerts:** Items dropping below your designated 'Reorder Level' will trigger an amber alert to prevent stockouts.

### Actions
1. **Add New Item:** Define the product by entering its Name, SKU, Category, Selling Price, and Reorder Level.
2. **Buy/Sell Modal:** Record quick inventory transactions directly from the stock ledger. Click "+ Buy" to add units to stock (which dynamically adjusts cost) or "- Sell" to manually reduce them.
3. **Edit/Delete:** Keep your catalog neat by editing item details or removing obsolete items. (Note: The system bravely protects financial integrity by blocking deletions of items with tied records).

---

## 📒 Accounts Management
The **Chart of Accounts** is the backbone of your ledger. It serves as the "brain" of your bookkeeping system, defining the structure of your business's financial data.

### 🧩 What is its function?
1. **Categorization (The "Buckets"):** It provides specific buckets to sort your money. Instead of just seeing total spend, you see exactly how much goes to "Supplies", "Rent", or "Marketing."
2. **Real-Time Tracking:** Each account acts like a separate digital wallet. The **Cash** account tracks liquidity, while **Accounts Payable** tracks what you owe.
3. **Automated Reporting:** These accounts power your financial statements. Income/Expense accounts build your Profit & Loss statement, while Asset/Liability/Equity accounts build your Balance Sheet.
4. **Double-Entry Integrity:** Every transaction moves money *between* these accounts, ensuring your books always stay in balance.

### 📂 Types of Accounts
- **Asset**: Items of value (Cash, Equipment, Inventory).
- **Liability**: Debts owed (Loans, Accounts Payable).
- **Equity**: Owner's investment and retained earnings.
- **Income**: Revenue from sales or services.
- **Expense**: Costs of doing business (Rent, Utilities).

**Actions:**
1. **Create Account**: Add new accounts to track specific categories (e.g., "Marketing Expense").
2. **View Balances**: See the real-time balance for every account in your system.

---

## 💸 How to Enter Records
Recording your data is simple and can be done in two ways depending on whether you have a physical receipt or are recording a direct transaction.

### Step 1: Access the Entry Node
From the **Dashboard**, click on either:
- **Manual Record**: To type in details directly.
- **Upload Receipt**: To use the auto-extraction engine.

---

### Step 2: Choose Your Entry Method

#### 📡 Option A: Neural OCR Scan (Recommended for Receipts)
1. **Upload**: Drag and drop your receipt (JPG, PNG, or PDF) into the upload zone.
2. **Auto-Process**: The "Neural Scan" will start automatically, extracting the Merchant, Date, and Amount.
3. **Verify**: Review the extracted data in the **Journal Verification** form. Ensure the "Value Volume" (Amount) and "Mapping Account" are correct.

#### 📝 Option B: Manual Protocol
1. Select **"Enter Manually"** below the upload zone.
2. Fill in the **Merchant Identity**, **Value**, and **Date** manually.

---

### Step 3: Define the Accounting Logic
This is where you tell the system how to treat the money. You can switch between two primary tracks using the top toggle:

#### A. Standard Ledger (Most Common)
For regular expenses or income not related to physical goods:
1. **Mapping Account**: Choose the specific category from your Chart of Accounts (e.g., "Office Supplies" or "Sales Revenue").
2. **Flow Protocol**: Mark it as **Expense** or **Income**.

#### B. Inventory Track
Use this when logging the purchase or sale of physical stock:
1. **Select Inventory Item**: Pick the exact item you are trading.
2. **Quantity**: Enter how many units are involved. (*The system automatically calculates the total value based on your registry price!*)
3. **Flow Protocol**: Mark it as **Buy Stock** or **Sell Stock**.

#### Common Fields for Both Tracks:
- **Settlement Protocol (Payment Method)**:
    - **Cash**: Immediate payment made or received.
    - **Payable (Credit)**: Purchased from Supplier on credit.
    - **Loan**: Funded by a loan.
    - **Receivable**: Sold to a Client on credit.

---

### Step 4: Commit
Once verified, click **"Commit to Secure Ledger"**. The transaction will be posted to the General Ledger and reflected in your reports immediately.

---

## 🧭 The General Ledger
While the "Transactions" list shows high-level events (e.g., "Paid Salaries"), the **General Ledger** shows the atomic movement of every penny.

- **Account Filtering:** Select a specific account (like "Rent Expense") to see only transactions affecting that account.
- **Running Balance:** When filtering by a single account, the ledger calculates a running balance, showing you exactly how much was in the account at any point in history.
- **Drill-Down:** Every line in the ledger is tied to a Journal Entry, providing full traceability from a single line back to the original source.

---

## 📓 Transaction History (The Journal)
The Transaction history represents your "Journal"—the chronological record of business events.
- **Unified View:** See income and expenses together.
- **Categorization:** Automatically identifies whether an event was an Inflow (Income) or Outflow (Expense).
- **Audit Trail:** Access receipts and metadata for every recorded entry.

---

## 📈 Financial Reporting (The Big Four)
Ohio Ledger automatically compiles your data into professional financial statements:

1. **Income Statement (P&L):** Shows your revenue minus expenses over a period. This tells you if you are making a profit or a loss.
2. **Balance Sheet:** A snapshot of what you **Own** (Assets) vs. what you **Owe** (Liabilities) and your **Equity**.
3. **Cash Flow Statement:** Tracks the physical movement of cash in and out of your business, ensuring you stay liquid.
4. **Trial Balance:** A diagnostic tool that lists all account balances to ensure that Total Debits equal Total Credits—the ultimate check for accounting accuracy.

---

## 🌓 Interface & Accessibility
- **Theme Toggle**: Switch between **Light Mode** and **Dark Mode** using the sun/moon icon in the sidebar or mobile header.
- **Responsive Design**:
    - **Desktop**: Access features via the persistent **AppSidebar**.
    - **Mobile**: Use the **MobileNavbar** at the bottom of the screen for quick navigation and the **MobileHeader** for theme switching.

---

## 📚 Accounting Glossary for Beginners
- **Debit (DR)**: An entry that increases an Asset or Expense account, or decreases a Liability or Equity account.
- **Credit (CR)**: An entry that increases a Liability, Equity, or Income account, or decreases an Asset or Expense account.
- **Liquidity**: How quickly you can turn assets into cash.
- **Net Profit**: What remains after all expenses are subtracted from all income.

---

## 🛠 Support & Feedback
For further assistance or to report issues, please contact the development team at [ohioalabi@gmail.com](mailto:ohioalabi@gmail.com).

*© 2026 Ohio Ledger - Premium Accounting Suite*
