"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, ShoppingCart, Eye, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupplierOrders, getSupplierById } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { DatePickerWithRange } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { SupplierOrder } from "@/lib/types";

export default function SupplierOrdersPage() {
  const searchParams = useSearchParams();
  const supplierId = searchParams.get("supplier");

  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [filterSupplier, setFilterSupplier] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchOrders();

    // If supplier ID is provided in URL, fetch supplier details
    if (supplierId) {
      fetchSupplierDetails(supplierId);
    }
  }, [supplierId]);

  const fetchSupplierDetails = async (id: string) => {
    try {
      const supplier = await getSupplierById(id);
      if (supplier) {
        setFilterSupplier({
          id: supplier.id,
          name: supplier.name,
        });
      }
    } catch (error) {
      console.error("Error fetching supplier details:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const ordersData = await getSupplierOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Filter orders by search query and date range
  const filteredOrders = orders.filter((order) => {
    // Filter by supplier name or invoice number
    const matchesSearch =
      searchQuery === "" ||
      (order.supplier?.name &&
        order.supplier.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (order.invoice_number &&
        order.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by date range
    let matchesDateRange = true;
    if (dateRange?.from) {
      const orderDate = new Date(order.created_at);
      const orderDateOnly = new Date(
        orderDate.getFullYear(),
        orderDate.getMonth(),
        orderDate.getDate()
      );

      const startDateOnly = new Date(
        dateRange.from.getFullYear(),
        dateRange.from.getMonth(),
        dateRange.from.getDate()
      );
      matchesDateRange = orderDateOnly >= startDateOnly;
    }

    if (dateRange?.to) {
      const orderDate = new Date(order.created_at);
      const orderDateOnly = new Date(
        orderDate.getFullYear(),
        orderDate.getMonth(),
        orderDate.getDate()
      );

      const endDateOnly = new Date(
        dateRange.to.getFullYear(),
        dateRange.to.getMonth(),
        dateRange.to.getDate()
      );
      // Add one day to end date to include the entire end date
      const endDatePlusOne = new Date(endDateOnly);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      matchesDateRange = matchesDateRange && orderDateOnly < endDatePlusOne;
    }

    // Filter by supplier if one is selected
    const matchesSupplier =
      !filterSupplier || order.supplier_id === filterSupplier.id;

    return matchesSearch && matchesDateRange && matchesSupplier;
  });

  return (
    <div className="container mx-auto p-4 pb-16">
      {filterSupplier && (
        <div className="flex items-center mb-4">
          <Link
            href="/supplier/suppliers"
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-1"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Suppliers
          </Link>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supplier Orders</h1>
          <p className="text-muted-foreground">
            {filterSupplier ? (
              <span className="flex items-center">
                Showing orders from{" "}
                <span className="font-medium ml-1">{filterSupplier.name}</span>
                <Button
                  variant="link"
                  className="h-auto p-0 ml-2"
                  onClick={() => {
                    setFilterSupplier(null);
                    window.history.pushState({}, "", "/supplier/orders");
                  }}
                >
                  (Clear filter)
                </Button>
              </span>
            ) : (
              "View and manage your supplier orders"
            )}
          </p>
        </div>
        <Link href="/supplier/new-order">
          <Button>
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by supplier or invoice number..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "order" : "orders"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || dateRange?.from || dateRange?.to
                ? "No orders match your search criteria"
                : "No orders found"}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {order.supplier?.name || "Unknown Supplier"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(parseISO(order.created_at), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>{order.invoice_number || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            order.status === "received"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/supplier/orders/${order.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
