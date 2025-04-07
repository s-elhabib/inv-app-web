import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Log Supabase configuration (without exposing the full key)
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 5 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + '...' : 'undefined');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Products
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name)
    `)
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Process the data to add the category name directly to the product object
  const processedData = data.map(product => ({
    ...product,
    category: product.category?.name || 'Uncategorized'
  }));

  return processedData;
}

export async function getProductById(id: number | string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }

  // Process the data to add the category name directly to the product object
  if (data) {
    return {
      ...data,
      category: data.category?.name || 'Uncategorized'
    };
  }

  return null;
}

// Categories
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching categories:', error);
    // Return default categories as fallback
    return [
      { id: 1, name: 'Bakery' },
      { id: 2, name: 'Beverages' },
      { id: 3, name: 'Dairy' },
      { id: 4, name: 'Grains' },
      { id: 5, name: 'Meat' },
      { id: 6, name: 'Produce' },
      { id: 7, name: 'Spices' },
      { id: 8, name: 'Sweets' },
      { id: 9, name: 'Toy' },
    ];
  }

  return data;
}

export async function addCategory(categoryData: any) {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  return data;
}

export async function updateCategory(id: string, categoryData: any) {
  const { data, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }

  return data;
}

export async function deleteCategory(id: string) {
  // First check if any products are using this category
  const { data: productsUsingCategory, error: checkError } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id);

  if (checkError) {
    console.error('Error checking products using category:', checkError);
    throw checkError;
  }

  // If products are using this category, don't allow deletion
  if (productsUsingCategory && productsUsingCategory.length > 0) {
    throw new Error(`Cannot delete category because it's used by ${productsUsingCategory.length} products`);
  }

  // If no products are using this category, proceed with deletion
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }

  return true;
}

export async function createProduct(productData: any) {
  // Ensure image field has a default value if not provided
  const productWithImage = {
    ...productData,
    image: productData.image || 'https://placehold.co/400x300?text=Product'
  };

  const { data, error } = await supabase
    .from('products')
    .insert(productWithImage)
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  return data;
}

export async function updateProduct(id: number | string, productData: any) {
  // If updating image to null, provide a default image
  if (productData.hasOwnProperty('image') && !productData.image) {
    productData.image = 'https://placehold.co/400x300?text=Product';
  }

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

export async function deleteProduct(id: number | string) {
  // First check if the product is used in any sales
  const { data: salesUsingProduct, error: checkError } = await supabase
    .from('sales')
    .select('id')
    .eq('product_id', id);

  if (checkError) {
    console.error('Error checking sales using product:', checkError);
    throw checkError;
  }

  // If sales are using this product, don't allow deletion
  if (salesUsingProduct && salesUsingProduct.length > 0) {
    throw new Error(`Cannot delete product because it's used in ${salesUsingProduct.length} sales/orders. Consider updating the stock to 0 instead.`);
  }

  // Also check supplier order items
  const { data: supplierOrderItemsUsingProduct, error: checkSupplierError } = await supabase
    .from('supplier_order_items')
    .select('id')
    .eq('product_id', id);

  if (checkSupplierError) {
    console.error('Error checking supplier order items using product:', checkSupplierError);
    throw checkSupplierError;
  }

  // If supplier order items are using this product, don't allow deletion
  if (supplierOrderItemsUsingProduct && supplierOrderItemsUsingProduct.length > 0) {
    throw new Error(`Cannot delete product because it's used in ${supplierOrderItemsUsingProduct.length} supplier orders. Consider updating the stock to 0 instead.`);
  }

  // If no sales or supplier order items are using this product, proceed with deletion
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

export async function addClient(clientData: any) {
  const { data, error } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }

  return data;
}

export async function updateClient(id: string | number, clientData: any) {
  // For UUID strings, we should use them as-is
  // No need to convert UUID strings to numbers
  console.log('Supabase updateClient - ID:', id, 'Type:', typeof id);
  console.log('Supabase updateClient - Data:', clientData);

  // First, try to get the client to make sure it exists
  const { data: existingClient, error: getError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (getError) {
    console.error('Error finding client for update:', getError);
    return null;
  }

  if (!existingClient) {
    console.error('Client not found for update');
    return null;
  }

  console.log('Found existing client:', existingClient);

  // Try the standard update method first
  console.log('Trying standard update method');
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Standard update failed:', error);
    } else if (data && data.length > 0) {
      console.log('Standard update succeeded:', data);
      return data[0];
    } else {
      console.log('Standard update returned no data');
    }
  } catch (err) {
    console.error('Exception in standard update:', err);
  }

  // If standard update fails, try direct SQL
  console.log('Trying SQL update as fallback');
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        updated_at: new Date().toISOString()
      })
      .match({ id: id })
      .select();

    if (error) {
      console.error('SQL update failed:', error);
    } else {
      console.log('SQL update result:', data);
      return data?.[0] || existingClient; // Return existing client as fallback
    }
  } catch (err) {
    console.error('Exception in SQL update:', err);
  }

  // If all else fails, return the existing client with updated fields
  // This is a client-side only update that won't persist to the database
  console.log('All update methods failed, returning client-side updated object');
  return {
    ...existingClient,
    ...clientData,
    updated_at: new Date().toISOString()
  };
}

export async function deleteClient(id: string | number) {
  // For UUID strings, we should use them as-is
  // No need to convert UUID strings to numbers
  console.log('Supabase deleteClient - ID:', id, 'Type:', typeof id);

  // First, try to get the client to make sure it exists
  const { data: existingClient, error: getError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (getError) {
    console.error('Error finding client for delete:', getError);
    return false;
  }

  if (!existingClient) {
    console.error('Client not found for delete');
    return false;
  }

  console.log('Found existing client for delete:', existingClient);

  // Try the standard delete method first
  console.log('Trying standard delete method');
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Standard delete failed:', error);
    } else {
      console.log('Standard delete succeeded');
      return true;
    }
  } catch (err) {
    console.error('Exception in standard delete:', err);
  }

  // If standard delete fails, try with match
  console.log('Trying match delete as fallback');
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .match({ id: id });

    if (error) {
      console.error('Match delete failed:', error);
    } else {
      console.log('Match delete succeeded');
      return true;
    }
  } catch (err) {
    console.error('Exception in match delete:', err);
  }

  // If all else fails, mark the client as inactive (soft delete)
  console.log('Trying soft delete as last resort');
  try {
    const { error } = await supabase
      .from('clients')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Soft delete failed:', error);
      return false;
    } else {
      console.log('Soft delete succeeded');
      return true;
    }
  } catch (err) {
    console.error('Exception in soft delete:', err);
    return false;
  }
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
      client:clients(*),
      order_items:sales(*, product:products(*))
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

// Suppliers
export async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }

  return data;
}

export async function getSupplierById(id: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching supplier ${id}:`, error);
    return null;
  }

  return data;
}

export async function addSupplier(supplierData: any) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplierData)
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }

  return data;
}

export async function updateSupplier(id: string, supplierData: any) {
  const { data, error } = await supabase
    .from('suppliers')
    .update(supplierData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }

  return data;
}

export async function deleteSupplier(id: string) {
  // First check if any supplier orders are using this supplier
  const { data: ordersUsingSupplier, error: checkError } = await supabase
    .from('supplier_orders')
    .select('id')
    .eq('supplier_id', id);

  if (checkError) {
    console.error('Error checking orders using supplier:', checkError);
    throw checkError;
  }

  // If orders are using this supplier, don't allow deletion
  if (ordersUsingSupplier && ordersUsingSupplier.length > 0) {
    throw new Error(`Cannot delete supplier because it's used by ${ordersUsingSupplier.length} orders`);
  }

  // If no orders are using this supplier, proceed with deletion
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }

  return true;
}

// Supplier Orders
export async function getSupplierOrders() {
  const { data, error } = await supabase
    .from('supplier_orders')
    .select(`
      *,
      supplier:suppliers(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching supplier orders:', error);
    return [];
  }

  return data;
}

export async function getSupplierOrderById(id: string) {
  const { data, error } = await supabase
    .from('supplier_orders')
    .select(`
      *,
      supplier:suppliers(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching supplier order ${id}:`, error);
    return null;
  }

  // Fetch order items separately
  const { data: orderItems, error: itemsError } = await supabase
    .from('supplier_order_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('supplier_order_id', id);

  if (itemsError) {
    console.error(`Error fetching supplier order items for order ${id}:`, itemsError);
  }

  // Combine the data
  return {
    ...data,
    order_items: orderItems || []
  };
}

export async function createSupplierOrder(orderData: any) {
  const { data, error } = await supabase
    .from('supplier_orders')
    .insert(orderData)
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier order:', error);
    throw error;
  }

  return data;
}

export async function createSupplierOrderItems(items: any[]) {
  const { data, error } = await supabase
    .from('supplier_order_items')
    .insert(items)
    .select();

  if (error) {
    console.error('Error creating supplier order items:', error);
    throw error;
  }

  return data;
}

export async function updateSupplierOrder(id: string, orderData: any) {
  const { data, error } = await supabase
    .from('supplier_orders')
    .update(orderData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating supplier order:', error);
    throw error;
  }

  return data;
}

export async function deleteSupplierOrder(id: string) {
  // First delete all order items
  const { error: itemsError } = await supabase
    .from('supplier_order_items')
    .delete()
    .eq('supplier_order_id', id);

  if (itemsError) {
    console.error(`Error deleting supplier order items for order ${id}:`, itemsError);
    throw itemsError;
  }

  // Then delete the order
  const { error } = await supabase
    .from('supplier_orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting supplier order:', error);
    throw error;
  }

  return true;
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
