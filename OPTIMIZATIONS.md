# Performance Optimizations

This document outlines the performance optimizations implemented in the application to improve data retrieval speed and overall application performance.

## 1. React Query for Caching and State Management

We've implemented React Query to provide efficient data fetching, caching, and state management:

```jsx
// Example usage in a component
const { data, isLoading } = useQuery({
  queryKey: ['supplierOrders', page, searchQuery],
  queryFn: () => getSupplierOrders({
    page,
    pageSize,
    searchQuery,
    returnLegacyFormat: false,
  }),
  keepPreviousData: true,
});
```

Benefits:
- Automatic caching of query results
- Deduplication of identical requests
- Background refetching for stale data
- Pagination support with `keepPreviousData`
- Loading and error states

## 2. Optimized Supabase Queries

We've optimized database queries to be more efficient:

```typescript
// Example of an optimized query
let query = supabase
  .from('orders')
  .select(`
    id, status, total_amount, created_at, invoice_number, client_id,
    client:clients(id, name, phone),
    order_items:sales(id, quantity, amount, product_id)
  `, { count: 'exact' })
  .order('created_at', { ascending: false });
```

Benefits:
- Selecting only needed fields reduces data transfer
- Optimized joins with specific field selection
- Using count option efficiently for pagination
- Proper error handling and logging

## 3. Query Pagination

We've implemented pagination for all list views:

```typescript
// Pagination in query functions
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;
query = query.range(from, to);
```

Benefits:
- Reduced initial load time
- Lower memory usage
- Better performance with large datasets
- Improved user experience

## 4. Server-Side Filtering

We've moved filtering logic from client to server:

```typescript
// Server-side filtering example
if (searchQuery) {
  query = query.or(
    `client.name.ilike.%${searchQuery}%,invoice_number.ilike.%${searchQuery}%`
  );
}

if (dateFrom) {
  query = query.gte('created_at', dateFrom);
}
```

Benefits:
- Reduced data transfer
- Faster filtering operations
- Better scalability with large datasets
- More efficient use of database capabilities

## 5. Database Indexes

We've added database indexes for frequently queried columns:

```sql
-- Example indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
```

Benefits:
- Faster query execution
- Improved sorting performance
- Better join performance
- Reduced database load

## 6. Additional Optimizations

### Debouncing for Search Inputs

```jsx
const [searchQuery, setSearchQuery] = useState("");
const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

// Use debouncedSearchQuery for filtering
```

### Backward Compatibility

We've maintained backward compatibility while adding new features:

```typescript
// Return in legacy format if requested
if (returnLegacyFormat) {
  return data || [];
}

// Return in new format with pagination info
return { data: data || [], count: count || 0, error: null };
```

## How to Apply Database Indexes

See the `db/README.md` file for instructions on how to apply the database indexes.

## Future Optimization Opportunities

1. **Implement Server-Side Rendering** for initial page loads
2. **Add Prefetching** for predictable navigation patterns
3. **Optimize Images** with proper sizing and formats
4. **Implement Code Splitting** for faster initial load times
5. **Add Service Worker** for offline capabilities and caching
