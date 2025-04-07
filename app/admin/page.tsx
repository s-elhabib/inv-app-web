"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Box,
  Home,
  ShoppingBag,
  History,
  Settings,
  BarChart,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { getClients, getProducts, getOrders } from "@/lib/supabase";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";

export default function AdminPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("today");
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  // Calculate stats
  const totalClients = clients.length;
  const totalProducts = products.length;
  const totalOrders = orders.length;

  // Calculate revenue based on timeframe
  const [revenueTimeframe, setRevenueTimeframe] = useState("today");

  // Calculate revenue for different timeframes
  const calculateRevenueForTimeframe = (timeframe: string) => {
    let filteredOrders = [];
    const now = new Date();

    // Filter orders based on timeframe
    switch (timeframe) {
      case "today":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(now) && orderDate <= endOfDay(now)
          );
        });
        break;
      case "week":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 7)) && orderDate <= endOfDay(now)
          );
        });
        break;
      case "month":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 30)) && orderDate <= endOfDay(now)
          );
        });
        break;
      default:
        filteredOrders = orders;
    }

    // Calculate total revenue for filtered orders
    return filteredOrders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    );
  };

  // Calculate inventory value
  const totalInventoryValue = products.reduce(
    (sum, product) => sum + (product.price || 0) * (product.stock || 0),
    0
  );

  // Show/hide profit
  const [showProfit, setShowProfit] = useState(false);
  const [profitTimeframe, setProfitTimeframe] = useState("today");

  // Calculate profit for different timeframes (30% of revenue)
  const calculateProfitForTimeframe = (timeframe: string) => {
    let filteredOrders = [];
    const now = new Date();

    // Filter orders based on timeframe
    switch (timeframe) {
      case "today":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(now) && orderDate <= endOfDay(now)
          );
        });
        break;
      case "week":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 7)) && orderDate <= endOfDay(now)
          );
        });
        break;
      case "15days":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 15)) && orderDate <= endOfDay(now)
          );
        });
        break;
      case "month":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 30)) && orderDate <= endOfDay(now)
          );
        });
        break;
      default:
        filteredOrders = orders;
    }

    // Calculate total revenue for filtered orders
    const filteredRevenue = filteredOrders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    );

    // Calculate profit (30% of revenue)
    return filteredRevenue * 0.3;
  };

  const totalProfit = calculateProfitForTimeframe(profitTimeframe);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [clientsData, productsData, ordersData] = await Promise.all([
          getClients(),
          getProducts(),
          getOrders(),
        ]);

        setClients(clientsData);
        setProducts(productsData);
        setOrders(ordersData);

        // Generate chart data based on orders
        generateChartData(ordersData, selectedTimeframe);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedTimeframe]);

  const generateChartData = (orders: any[], timeframe: string) => {
    let filteredOrders = [];
    const now = new Date();

    // Filter orders based on timeframe
    switch (timeframe) {
      case "today":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(now) && orderDate <= endOfDay(now)
          );
        });
        break;
      case "week":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 7)) && orderDate <= endOfDay(now)
          );
        });
        break;
      case "month":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 30)) && orderDate <= endOfDay(now)
          );
        });
        break;
      default:
        filteredOrders = orders;
    }

    // Group orders by date
    const groupedOrders = filteredOrders.reduce((acc, order) => {
      const date = format(parseISO(order.created_at), "MMM dd");
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += order.total_amount || 0;
      return acc;
    }, {});

    // Convert to chart data format
    const data = Object.keys(groupedOrders).map((date) => ({
      name: date,
      value: groupedOrders[date],
    }));

    setChartData(data);
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

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 pb-20">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-1 sm:mt-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Total Clients
                </p>
                <p className="text-lg sm:text-2xl font-bold">{totalClients}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-1 sm:mt-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Total Products
                </p>
                <p className="text-lg sm:text-2xl font-bold">{totalProducts}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-1 sm:mt-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Total Orders
                </p>
                <p className="text-lg sm:text-2xl font-bold">{totalOrders}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-1 sm:mt-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Revenue
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {formatCurrency(calculateRevenueForTimeframe(revenueTimeframe))}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-300" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
              <Button
                variant={revenueTimeframe === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setRevenueTimeframe("today")}
                className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
              >
                Today
              </Button>
              <Button
                variant={revenueTimeframe === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setRevenueTimeframe("week")}
                className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
              >
                Week
              </Button>
              <Button
                variant={revenueTimeframe === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setRevenueTimeframe("month")}
                className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
              >
                Month
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link href="/admin/new-order">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 sm:block">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center sm:mb-4">
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 dark:text-green-300" />
                  </div>
                  <div className="sm:mt-0">
                    <h3 className="font-medium text-base sm:text-lg sm:mb-2">New Order</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground sm:mb-4 flex-grow hidden sm:block">
                      Create a new customer order
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-primary mt-2 sm:mt-0">
                  <span>Get started</span>
                  <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/inventory">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 sm:block">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center sm:mb-4">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 dark:text-blue-300" />
                  </div>
                  <div className="sm:mt-0">
                    <h3 className="font-medium text-base sm:text-lg sm:mb-2">Inventory</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground sm:mb-4 flex-grow hidden sm:block">
                      Manage your product inventory
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-primary mt-2 sm:mt-0">
                  <span>View inventory</span>
                  <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/orders">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 sm:block">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center sm:mb-4">
                    <History className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 dark:text-orange-300" />
                  </div>
                  <div className="sm:mt-0">
                    <h3 className="font-medium text-base sm:text-lg sm:mb-2">Order History</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground sm:mb-4 flex-grow hidden sm:block">
                      View and manage past orders
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-primary mt-2 sm:mt-0">
                  <span>View orders</span>
                  <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/admin/settings">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 sm:block">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center sm:mb-4">
                    <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 dark:text-purple-300" />
                  </div>
                  <div className="sm:mt-0">
                    <h3 className="font-medium text-base sm:text-lg sm:mb-2">Settings</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground sm:mb-4 flex-grow hidden sm:block">
                      Configure system settings
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-primary mt-2 sm:mt-0">
                  <span>Manage settings</span>
                  <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Profit and Inventory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Total Inventory Value Card */}
        <Card>
          <CardContent className="p-3 sm:p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-1 sm:mt-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Inventory Value
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {formatCurrency(totalInventoryValue)}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                <Box className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 dark:text-teal-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Profit Card */}
        <Card>
          <CardContent className="p-3 sm:p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="mt-1 sm:mt-2">
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  Total Profit
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowProfit(!showProfit)}
                    className="h-5 w-5 p-0"
                  >
                    {showProfit ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    )}
                  </Button>
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {showProfit ? formatCurrency(totalProfit) : "****"}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-300" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
              <Button
                variant={profitTimeframe === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfitTimeframe("today")}
                className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
              >
                Today
              </Button>
              <Button
                variant={profitTimeframe === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfitTimeframe("week")}
                className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
              >
                Week
              </Button>
              <Button
                variant={profitTimeframe === "15days" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfitTimeframe("15days")}
                className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
              >
                15 Days
              </Button>
              <Button
                variant={profitTimeframe === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfitTimeframe("month")}
                className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
              >
                Month
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">Revenue Over Time</CardTitle>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <Button
              variant={selectedTimeframe === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe("today")}
              className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
            >
              Today
            </Button>
            <Button
              variant={selectedTimeframe === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe("week")}
              className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
            >
              Week
            </Button>
            <Button
              variant={selectedTimeframe === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe("month")}
              className="text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full"
            >
              Month
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm">Loading chart data...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} MAD`, "Revenue"]} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex justify-around items-center z-20">
        <Link href="/admin" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none text-primary"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Dashboard</span>
          </Button>
        </Link>
        <Link href="/admin/new-order" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none text-muted-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-xs">New Order</span>
          </Button>
        </Link>
        <Link href="/admin/inventory" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none text-muted-foreground"
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Inventory</span>
          </Button>
        </Link>
        <Link href="/admin/orders" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none text-muted-foreground"
          >
            <History className="h-5 w-5" />
            <span className="text-xs">Orders History</span>
          </Button>
        </Link>
        <Link href="/admin/settings" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none text-muted-foreground"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Settings</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
