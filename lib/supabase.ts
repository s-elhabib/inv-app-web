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

export async function createProduct(productData: any) {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  return data;
}

export async function updateProduct(id: number, productData: any) {
  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }

  return data;
}

export async function deleteProduct(id: number) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }

  return true;
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
      client:clients(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }

  // Fetch order items (sales) separately
  const { data: orderItems, error: itemsError } = await supabase
    .from('sales')
    .select(`
      *,
      product:products(*)
    `)
    .eq('order_id', id);

  if (itemsError) {
    console.error(`Error fetching order items for order ${id}:`, itemsError);
  }

  // Combine the data
  return {
    ...data,
    order_items: orderItems || []
  };
}

// Order Items (stored in sales table)
export async function createOrderItems(items: any[]) {
  // Convert order_items format to sales table format
  const salesItems = items.map(item => ({
    order_id: item.order_id,
    product_id: item.product_id,
    client_id: item.client_id, // Use the client_id passed from the order
    quantity: item.quantity,
    unit_price: item.price,
    amount: item.price * item.quantity
  }));

  const { data, error } = await supabase
    .from('sales')
    .insert(salesItems)
    .select();

  if (error) {
    console.error('Error creating order items:', error);
    throw error;
  }

  return data;
}
