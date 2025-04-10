import { supabase } from './supabase';

// Store the original fetch method
const originalFetch = supabase.fetch.bind(supabase);

// Override the fetch method with our interceptor
supabase.fetch = async function interceptedFetch(url: string, options: any) {
  // Check if this is a supplier_orders request with the problematic query
  if (url.includes('supplier_orders') && url.includes('select=*%2Csupplier%3Asuppliers(*)')) {
    // Replace with optimized query
    const optimizedUrl = url.replace(
      'select=*%2Csupplier%3Asuppliers(*)',
      'select=id%2Cstatus%2Ctotal_amount%2Ccreated_at%2Cinvoice_number%2Csupplier_id%2Csupplier%3Asuppliers!inner(id%2Cname)'
    );
    
    // Add pagination if not present
    const hasRange = url.includes('range=');
    const optimizedUrlWithRange = hasRange 
      ? optimizedUrl 
      : `${optimizedUrl}&range=0,19`;
    
    console.log('Optimized Supabase query:', optimizedUrlWithRange);
    
    // Call the original fetch with the optimized URL
    return originalFetch(optimizedUrlWithRange, options);
  }
  
  // For all other requests, proceed normally
  return originalFetch(url, options);
};

export default function initSupabaseInterceptor() {
  console.log('Supabase request interceptor initialized');
  return null;
}
