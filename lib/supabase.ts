import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Products
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  return data;
}

// Clients
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  
  return data;
}

// Orders
export async function createOrder(orderData: any) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }
  
  return data;
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  
  return data;
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(*),
      order_items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }
  
  return data;
}

// Order Items
export async function createOrderItems(items: any[]) {
  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select();
  
  if (error) {
    console.error('Error creating order items:', error);
    throw error;
  }
  
  return data;
}
