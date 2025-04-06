"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TruckIcon,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getSuppliers, getSupplierOrders, getProducts } from "@/lib/supabase";
import { toast } from "sonner";

export default function SupplierDashboardPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [suppliersData, ordersData, productsData] = await Promise.all([
          getSuppliers(),
          getSupplierOrders(),
          getProducts(),
        ]);

        setSuppliers(suppliersData);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats
  const totalSuppliers = suppliers.length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const totalProducts = products.length;
  
  // Calculate total spent on orders
  const totalSpent = orders.reduce(
    (sum, order) => sum + (order.total_amount || 0),
    0
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Quick action cards
  const quickActions = [
    {
      title: "Add New Supplier",
      description: "Register a new supplier in the system",
      icon: Users,
      href: "/supplier/suppliers",
      color: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-500 dark:text-blue-300",
    },
    {
      title: "Create Order",
      description: "Place a new order with a supplier",
      icon: ShoppingCart,
      href: "/supplier/new-order",
      color: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-500 dark:text-green-300",
    },
    {
      title: "Manage Inventory",
      description: "View and update your inventory",
      icon: Package,
      href: "/supplier/inventory",
      color: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-500 dark:text-purple-300",
    },
    {
      title: "View Orders",
      description: "Check status of existing orders",
      icon: TruckIcon,
      href: "/supplier/orders",
      color: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-500 dark:text-orange-300",
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Supplier Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{totalSuppliers}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-green-500 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">{pendingOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <TruckIcon className="h-5 w-5 text-orange-500 dark:text-orange-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-500 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className={`h-12 w-12 rounded-full ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                  </div>
                  <h3 className="font-medium text-lg mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-grow">
                    {action.description}
                  </p>
                  <div className="flex items-center text-sm text-primary">
                    <span>Get started</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link href="/supplier/orders">
            <Button variant="ghost" className="text-sm">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 flex justify-center">
                <p>Loading recent orders...</p>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-6 flex justify-center">
                <p>No orders found</p>
              </CardContent>
            </Card>
          ) : (
            orders.slice(0, 3).map((order) => (
              <Link key={order.id} href={`/supplier/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {order.supplier?.name || "Unknown Supplier"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Order #{order.id.substring(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                          order.status === 'received' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
