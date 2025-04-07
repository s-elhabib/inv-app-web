-- Reset and populate database with sample data
-- WARNING: This script will delete all existing data!

-- First, delete all data from tables in the correct order to avoid foreign key constraints
DELETE FROM supplier_order_items;
DELETE FROM supplier_orders;
DELETE FROM sales;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM clients;
DELETE FROM suppliers;

-- Now populate tables with sample data

-- 1. Categories
INSERT INTO categories (id, name, created_at)
VALUES 
  (gen_random_uuid(), 'Electronics', NOW()),
  (gen_random_uuid(), 'Clothing', NOW()),
  (gen_random_uuid(), 'Food', NOW()),
  (gen_random_uuid(), 'Home Goods', NOW()),
  (gen_random_uuid(), 'Office Supplies', NOW());

-- Store category IDs in variables for later use
DO $$
DECLARE
  electronics_id UUID;
  clothing_id UUID;
  food_id UUID;
  home_goods_id UUID;
  office_supplies_id UUID;
BEGIN
  SELECT id INTO electronics_id FROM categories WHERE name = 'Electronics' LIMIT 1;
  SELECT id INTO clothing_id FROM categories WHERE name = 'Clothing' LIMIT 1;
  SELECT id INTO food_id FROM categories WHERE name = 'Food' LIMIT 1;
  SELECT id INTO home_goods_id FROM categories WHERE name = 'Home Goods' LIMIT 1;
  SELECT id INTO office_supplies_id FROM categories WHERE name = 'Office Supplies' LIMIT 1;

  -- 2. Products
  -- Added sellingPrice column as it exists in the schema and has a NOT NULL constraint
  INSERT INTO products (id, name, price, stock, category_id, created_at, image, "sellingPrice", inactive)
  VALUES 
    (gen_random_uuid(), 'Smartphone', 2000, 10, electronics_id, NOW(), 'https://placehold.co/400x300?text=Smartphone', 2500, false),
    (gen_random_uuid(), 'T-shirt', 50, 20, clothing_id, NOW(), 'https://placehold.co/400x300?text=T-shirt', 100, false),
    (gen_random_uuid(), 'Chocolate Bar', 10, 50, food_id, NOW(), 'https://placehold.co/400x300?text=Chocolate', 15, false),
    (gen_random_uuid(), 'Desk Lamp', 150, 15, home_goods_id, NOW(), 'https://placehold.co/400x300?text=Lamp', 200, false),
    (gen_random_uuid(), 'Notebook', 20, 30, office_supplies_id, NOW(), 'https://placehold.co/400x300?text=Notebook', 30, false);
END $$;

-- 3. Clients
INSERT INTO clients (id, name, phone, email, created_at)
VALUES 
  (gen_random_uuid(), 'Ahmed Hassan', '0612345678', 'ahmed@example.com', NOW()),
  (gen_random_uuid(), 'Fatima Zahra', '0623456789', 'fatima@example.com', NOW()),
  (gen_random_uuid(), 'Mohammed Ali', '0634567890', 'mohammed@example.com', NOW()),
  (gen_random_uuid(), 'Aisha Benali', '0645678901', 'aisha@example.com', NOW()),
  (gen_random_uuid(), 'Youssef Mansour', '0656789012', 'youssef@example.com', NOW());

-- 4. Suppliers
INSERT INTO suppliers (id, name, phone, email, address, created_at)
VALUES 
  (gen_random_uuid(), 'Global Electronics', '0512345678', 'global@example.com', 'Casablanca Industrial Zone', NOW()),
  (gen_random_uuid(), 'Fashion Wholesale', '0523456789', 'fashion@example.com', 'Marrakech Commercial Center', NOW()),
  (gen_random_uuid(), 'Food Distributors', '0534567890', 'food@example.com', 'Rabat Business District', NOW()),
  (gen_random_uuid(), 'Home Essentials', '0545678901', 'home@example.com', 'Tangier Port Area', NOW()),
  (gen_random_uuid(), 'Office Pro Supplies', '0556789012', 'office@example.com', 'Agadir Commercial Zone', NOW());

-- Store supplier IDs in variables for later use
DO $$
DECLARE
  electronics_supplier_id UUID;
  clothing_supplier_id UUID;
  food_supplier_id UUID;
  home_supplier_id UUID;
  office_supplier_id UUID;
BEGIN
  SELECT id INTO electronics_supplier_id FROM suppliers WHERE name = 'Global Electronics' LIMIT 1;
  SELECT id INTO clothing_supplier_id FROM suppliers WHERE name = 'Fashion Wholesale' LIMIT 1;
  SELECT id INTO food_supplier_id FROM suppliers WHERE name = 'Food Distributors' LIMIT 1;
  SELECT id INTO home_supplier_id FROM suppliers WHERE name = 'Home Essentials' LIMIT 1;
  SELECT id INTO office_supplier_id FROM suppliers WHERE name = 'Office Pro Supplies' LIMIT 1;

  -- 5. Supplier Orders
  INSERT INTO supplier_orders (id, supplier_id, invoice_number, total_amount, status, created_at)
  VALUES 
    (gen_random_uuid(), electronics_supplier_id, 'INV-001', 10000, 'completed', NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), clothing_supplier_id, 'INV-002', 5000, 'completed', NOW() - INTERVAL '25 days'),
    (gen_random_uuid(), food_supplier_id, 'INV-003', 2000, 'completed', NOW() - INTERVAL '20 days'),
    (gen_random_uuid(), home_supplier_id, 'INV-004', 3000, 'pending', NOW() - INTERVAL '15 days'),
    (gen_random_uuid(), office_supplier_id, 'INV-005', 1500, 'pending', NOW() - INTERVAL '10 days');
END $$;

-- 6. Orders and Sales
DO $$
DECLARE
  client_id1 UUID;
  client_id2 UUID;
  client_id3 UUID;
  client_id4 UUID;
  client_id5 UUID;
  product_id1 UUID;
  product_id2 UUID;
  product_id3 UUID;
  product_id4 UUID;
  product_id5 UUID;
  order_id1 UUID;
  order_id2 UUID;
  order_id3 UUID;
  order_id4 UUID;
  order_id5 UUID;
BEGIN
  -- Get client IDs
  SELECT id INTO client_id1 FROM clients ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO client_id2 FROM clients ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO client_id3 FROM clients ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO client_id4 FROM clients ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO client_id5 FROM clients ORDER BY created_at LIMIT 1 OFFSET 4;
  
  -- Get product IDs
  SELECT id INTO product_id1 FROM products ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO product_id2 FROM products ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO product_id3 FROM products ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO product_id4 FROM products ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO product_id5 FROM products ORDER BY created_at LIMIT 1 OFFSET 4;
  
  -- Create orders - removed the total column as it doesn't exist in the schema
  INSERT INTO orders (id, client_id, created_at)
  VALUES 
    (gen_random_uuid(), client_id1, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), client_id2, NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), client_id3, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), client_id4, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), client_id5, NOW() - INTERVAL '1 day');
  
  -- Get order IDs
  SELECT id INTO order_id1 FROM orders ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO order_id2 FROM orders ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO order_id3 FROM orders ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO order_id4 FROM orders ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO order_id5 FROM orders ORDER BY created_at LIMIT 1 OFFSET 4;
  
  -- Create sales
  INSERT INTO sales (id, order_id, product_id, quantity, price, created_at)
  VALUES 
    (gen_random_uuid(), order_id1, product_id1, 1, 2500, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), order_id2, product_id2, 3, 100, NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), order_id3, product_id3, 3, 15, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), order_id4, product_id4, 2, 200, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), order_id5, product_id5, 3, 30, NOW() - INTERVAL '1 day');
END $$;

-- 7. Supplier Order Items
DO $$
DECLARE
  supplier_order_id1 UUID;
  supplier_order_id2 UUID;
  supplier_order_id3 UUID;
  supplier_order_id4 UUID;
  supplier_order_id5 UUID;
  product_id1 UUID;
  product_id2 UUID;
  product_id3 UUID;
  product_id4 UUID;
  product_id5 UUID;
BEGIN
  -- Get supplier order IDs
  SELECT id INTO supplier_order_id1 FROM supplier_orders ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO supplier_order_id2 FROM supplier_orders ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO supplier_order_id3 FROM supplier_orders ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO supplier_order_id4 FROM supplier_orders ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO supplier_order_id5 FROM supplier_orders ORDER BY created_at LIMIT 1 OFFSET 4;
  
  -- Get product IDs
  SELECT id INTO product_id1 FROM products ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO product_id2 FROM products ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO product_id3 FROM products ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO product_id4 FROM products ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO product_id5 FROM products ORDER BY created_at LIMIT 1 OFFSET 4;
  
  -- Create supplier order items
  INSERT INTO supplier_order_items (id, supplier_order_id, product_id, quantity, price, created_at)
  VALUES 
    (gen_random_uuid(), supplier_order_id1, product_id1, 5, 2000, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), supplier_order_id2, product_id2, 100, 50, NOW() - INTERVAL '25 days'),
    (gen_random_uuid(), supplier_order_id3, product_id3, 200, 10, NOW() - INTERVAL '20 days'),
    (gen_random_uuid(), supplier_order_id4, product_id4, 20, 150, NOW() - INTERVAL '15 days'),
    (gen_random_uuid(), supplier_order_id5, product_id5, 75, 20, NOW() - INTERVAL '10 days');
END $$;

-- Verify data was inserted correctly
SELECT 'Categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'Clients' as table_name, COUNT(*) as record_count FROM clients
UNION ALL
SELECT 'Suppliers' as table_name, COUNT(*) as record_count FROM suppliers
UNION ALL
SELECT 'Supplier Orders' as table_name, COUNT(*) as record_count FROM supplier_orders
UNION ALL
SELECT 'Orders' as table_name, COUNT(*) as record_count FROM orders
UNION ALL
SELECT 'Sales' as table_name, COUNT(*) as record_count FROM sales
UNION ALL
SELECT 'Supplier Order Items' as table_name, COUNT(*) as record_count FROM supplier_order_items;
