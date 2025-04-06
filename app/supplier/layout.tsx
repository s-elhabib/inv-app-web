'use client';

import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  Users, 
  TruckIcon,
  ReceiptIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const navigation = [
  { name: 'Dashboard', href: '/supplier', icon: LayoutDashboard },
  { name: 'Suppliers', href: '/supplier/suppliers', icon: Users },
  { name: 'New Order', href: '/supplier/new-order', icon: ShoppingCart },
  { name: 'Orders', href: '/supplier/orders', icon: ReceiptIcon },
  { name: 'Inventory', href: '/supplier/inventory', icon: Package },
];

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Protect supplier routes
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (user?.role !== 'supplier') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'supplier') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <TruckIcon className="h-6 w-6" />
          <span className="font-semibold">Supplier Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {user?.name || 'Supplier'}
          </span>
        </div>
      </header>
      
      <main className="pb-16">{children}</main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="grid h-16 grid-cols-5 items-center">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
