'use client';

import { useEffect, useState } from 'react';
import { supabase, getProducts, getClients } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TestSupabasePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [productsData, clientsData] = await Promise.all([
          getProducts(),
          getClients()
        ]);
        
        setProducts(productsData);
        setClients(clientsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data from Supabase');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Testing Supabase connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Supabase Connection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Products ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p>No products found</p>
            ) : (
              <ul className="space-y-2">
                {products.slice(0, 5).map((product) => (
                  <li key={product.id} className="border-b pb-2">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Price: {product.price} MAD | Stock: {product.stock}
                    </div>
                  </li>
                ))}
                {products.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    ...and {products.length - 5} more
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Clients ({clients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p>No clients found</p>
            ) : (
              <ul className="space-y-2">
                {clients.slice(0, 5).map((client) => (
                  <li key={client.id} className="border-b pb-2">
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.phone || 'No phone'} | {client.email || 'No email'}
                    </div>
                  </li>
                ))}
                {clients.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    ...and {clients.length - 5} more
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p>Connection status: Connected</p>
      </div>
    </div>
  );
}
