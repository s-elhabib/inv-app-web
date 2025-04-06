"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon,
  Search,
  FileText,
  Home,
  ShoppingBag,
  Package,
  History,
  Settings,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getOrders, getClients } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { generateAndDownloadInvoice, shareViaWhatsApp } from "@/lib/invoice";

interface Order {
  id: string;
  client: {
    id: string;
    name: string;
    phone?: string;
  };
  created_at: string;
  total_amount: number;
  status: string;
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch orders and clients from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ordersData, clientsData] = await Promise.all([
          getOrders(),
          getClients(),
        ]);

        setOrders(ordersData);
        setClients(clientsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter orders by search query and date range
  const filteredOrders = orders.filter((order) => {
    // Filter by client name
    const matchesSearch =
      searchQuery === "" ||
      order.client?.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by date range
    let matchesDateRange = true;
    if (startDate) {
      const orderDate = new Date(order.created_at);
      matchesDateRange = orderDate >= startDate;
    }
    if (endDate) {
      const orderDate = new Date(order.created_at);
      matchesDateRange = matchesDateRange && orderDate <= endDate;
    }

    return matchesSearch && matchesDateRange;
  });

  const handleGenerateInvoice = async (order: Order) => {
    try {
      // Get order items (you'll need to implement this function)
      const orderItems = []; // Placeholder - replace with actual order items

      // Generate invoice
      await generateAndDownloadInvoice(
        {
          id: order.id,
          userId: "1",
          client: order.client,
          products: [],
          status: order.status,
          totalAmount: order.total_amount,
          createdAt: order.created_at,
        },
        orderItems,
        "en"
      );

      toast.success("Invoice generated successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const handleShareViaWhatsApp = (order: Order) => {
    if (!order.client?.phone) {
      toast.error("Client has no phone number");
      return;
    }

    const message = `Hello ${order.client.name}, your invoice #${
      order.id
    } for ${order.total_amount.toFixed(
      2
    )} MAD is ready. Thank you for your business!`;
    
    shareViaWhatsApp(order.client.phone, message);
  };

  const handleApplyDateFilter = () => {
    // The filtering is already handled in the filteredOrders computation
    toast.success("Date filter applied");
  };

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    toast.success("Date filter cleared");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4 pb-16">
      <h1 className="text-2xl font-bold tracking-tight">Client Order History</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Date Filter */}
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <div className="flex-1 w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <span className="text-center">to</span>

        <div className="flex-1 w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApplyDateFilter}>Apply</Button>
          {(startDate || endDate) && (
            <Button variant="outline" onClick={clearDateFilter}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <p className="text-muted-foreground mb-2">No orders found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or date filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {order.client?.name || "Unknown Client"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-500">
                        {order.total_amount.toFixed(2)} MAD
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateInvoice(order)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Invoice
                    </Button>
                    {order.client?.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareViaWhatsApp(order)}
                      >
                        Share
                      </Button>
                    )}
                  </div>
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="ghost" size="sm">
                      Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex justify-around items-center z-20">
        <Link href="/admin" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Dashboard</span>
          </Button>
        </Link>
        <Link href="/admin/new-order" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-xs">New Order</span>
          </Button>
        </Link>
        <Link href="/admin/inventory" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none"
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Inventory</span>
          </Button>
        </Link>
        <Link href="/admin/orders" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none bg-muted"
          >
            <History className="h-5 w-5" />
            <span className="text-xs">Orders History</span>
          </Button>
        </Link>
        <Link href="/admin/settings" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Settings</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
