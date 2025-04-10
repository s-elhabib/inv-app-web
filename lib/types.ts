export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client' | 'supplier';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Order {
  id: string;
  invoiceNumber?: string;
  client?: Client;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  created_at?: string;
}

export interface SupplierOrder {
  id: string;
  supplier_id: string;
  supplier?: Supplier;
  invoice_number?: string;
  invoice_image?: string;
  total_amount: number;
  status: 'pending' | 'received';
  created_at: string;
  notes?: string;
}

export interface SupplierOrderItem {
  id: string;
  supplier_order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  price: number;
  total: number;
}