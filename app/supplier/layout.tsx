"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Users,
  TruckIcon,
  ReceiptIcon,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/supplier", icon: LayoutDashboard },
  { name: "Suppliers", href: "/supplier/suppliers", icon: Users },
  { name: "New Order", href: "/supplier/new-order", icon: ShoppingCart },
  { name: "Orders", href: "/supplier/orders", icon: ReceiptIcon },
  { name: "Inventory", href: "/supplier/inventory", icon: Package },
  { name: "Settings", href: "/supplier/settings", icon: Settings },
];

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Protect supplier routes
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    } else if (user?.role !== "supplier") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "supplier") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <TruckIcon className="h-6 w-6" />
          <span className="font-semibold">Supplier Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.name || "Supplier"}
          </span>
          <button
            onClick={() => {
              useAuth.getState().logout();
              router.push("/auth/login");
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="pb-16">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <div className="grid h-16 grid-cols-6 items-center">
          {navigation.map((item) => {
            const Icon = item.icon;
            // Check if the current path starts with the navigation item's path
            // This ensures the correct item is highlighted even on sub-pages
            // For the dashboard (root path), only highlight when exactly at /supplier
            const isActive =
              item.href === "/supplier"
                ? pathname === "/supplier"
                : pathname.startsWith(item.href);

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
