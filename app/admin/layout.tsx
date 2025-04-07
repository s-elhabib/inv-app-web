"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "New Order", href: "/admin/new-order", icon: ShoppingCart },
  { name: "Inventory", href: "/admin/inventory", icon: Package },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Logout", href: "#", icon: LogOut, action: "logout" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Protect admin routes
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    } else if (user?.role !== "admin") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          <span className="font-semibold">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.name || "Admin"}
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
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="grid h-16 grid-cols-5 items-center">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            // Handle logout action
            if (item.action === "logout") {
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    useAuth.getState().logout();
                    router.push("/auth/login");
                  }}
                  className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            }

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
