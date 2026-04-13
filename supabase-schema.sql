-- Ohio Ledger - Accounting Suite Schema
-- Run this in your Supabase SQL Editor

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS journal_entry_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS transactions CASCADE; -- from MVP

-- 2. Users Table
-- This extends the Supabase Auth user table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Admin' CHECK (role IN ('Admin', 'Accountant', 'Viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: We can create a trigger to automatically add a new Auth user to our public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Businesses Table
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 4. Accounts Table (Chart of Accounts)
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
  category TEXT, -- e.g., 'Current Asset', 'Long Term Liability'
  is_default BOOLEAN DEFAULT false, -- To mark system-level accounts
  monthly_budget NUMERIC DEFAULT 0, -- For tracking Budget vs Actual
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 5. Journal Entries Table
-- Used for high-level transaction recording (e.g., 'Bought Supplies')
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 6. Journal Entry Lines Table
-- Handles the specific debits and credits of the double-entry system
CREATE TABLE journal_entry_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  debit NUMERIC DEFAULT 0 NOT NULL,
  credit NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 7. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own user record
CREATE POLICY "Users can view their own record" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can only see and manage their own businesses
CREATE POLICY "Users can manage their own businesses" ON businesses
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage accounts in their businesses
CREATE POLICY "Users can manage accounts of their businesses" ON accounts
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Users can manage journal entries in their businesses
CREATE POLICY "Users can manage journal entries of their businesses" ON journal_entries
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Users can manage journal entry lines linked to their businesses (via journal entry)
CREATE POLICY "Users can manage lines of their business journal entries" ON journal_entry_lines
  FOR ALL USING (
    journal_entry_id IN (
      SELECT id FROM journal_entries WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    )
  );

-- Helper function to seed default accounts when a business is created
CREATE OR REPLACE FUNCTION public.seed_default_accounts()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.accounts (business_id, name, type, category, is_default) VALUES
  (new.id, 'Cash', 'Asset', 'Current Asset', true),
  (new.id, 'Accounts Receivable', 'Asset', 'Current Asset', true),
  (new.id, 'Inventory', 'Asset', 'Current Asset', true),
  (new.id, 'Accounts Payable', 'Liability', 'Current Liability', true),
  (new.id, 'Loan Payable', 'Liability', 'Long Term Liability', true),
  (new.id, 'Owner''s Equity', 'Equity', 'Equity', true),
  (new.id, 'Retained Earnings', 'Equity', 'Equity', true),
  (new.id, 'Sales Revenue', 'Income', 'Operating Income', true),
  (new.id, 'Cost of Goods Sold', 'Expense', 'Operating Expense', true),
  (new.id, 'Rent Expense', 'Expense', 'Operating Expense', true),
  (new.id, 'Utilities Expense', 'Expense', 'Operating Expense', true),
  (new.id, 'Office Supplies', 'Expense', 'Operating Expense', true);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_business_created ON businesses;
CREATE TRIGGER on_business_created
  AFTER INSERT ON businesses
  FOR EACH ROW EXECUTE PROCEDURE public.seed_default_accounts();
