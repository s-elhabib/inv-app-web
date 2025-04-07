-- Add inactive column to products table
ALTER TABLE products ADD COLUMN inactive BOOLEAN DEFAULT FALSE;
