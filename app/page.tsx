'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(user?.role === 'admin' ? '/admin' : '/client');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Streamline your business operations
          </p>
        </div>
        <div className="space-y-4">
          <Button
            className="w-full"
            onClick={() => router.push('/auth/login')}
          >
            Sign In
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/auth/register')}
          >
            Create Account
          </Button>
        </div>
      </Card>
    </div>
  );
}