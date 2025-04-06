export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
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
  userId: string;
  client?: Client;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
}