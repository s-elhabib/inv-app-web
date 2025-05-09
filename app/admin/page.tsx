"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Box,
  TrendingUp,
  TrendingDown,
  BarChart,
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
import { cn } from "@/lib/utils";
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
          return orderDate >= startOfDay(now) && orderDate <= endOfDay(now);
        });
        break;
      case "week":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 7)) &&
            orderDate <= endOfDay(now)
          );
        });
        break;
      case "15days":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 15)) &&
            orderDate <= endOfDay(now)
          );
        });
        break;
      case "month":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 30)) &&
            orderDate <= endOfDay(now)
          );
        });
        break;
      case "all":
      default:
        filteredOrders = orders;
    }

    // Calculate total revenue for filtered orders
    return filteredOrders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    );
  };

  const totalRevenue = calculateRevenueForTimeframe(revenueTimeframe);

  // Calculate inventory value
  const totalInventoryValue = products.reduce((sum, product) => {
    return sum + (product.price * product.stock || 0);
  }, 0);

  // Calculate profit based on timeframe
  const [profitTimeframe, setProfitTimeframe] = useState("today");
  const [showProfit, setShowProfit] = useState(false);

  // Calculate profit for different timeframes based on actual sales data
  const calculateProfitForTimeframe = (timeframe: string) => {
    let filteredOrders = [];
    const now = new Date();

    // Filter orders based on timeframe
    switch (timeframe) {
      case "today":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return orderDate >= startOfDay(now) && orderDate <= endOfDay(now);
        });
        break;
      case "week":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 7)) &&
            orderDate <= endOfDay(now)
          );
        });
        break;
      case "15days":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 15)) &&
            orderDate <= endOfDay(now)
          );
        });
        break;
      case "month":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 30)) &&
            orderDate <= endOfDay(now)
          );
        });
        break;
      default:
        filteredOrders = orders;
    }

    // Calculate total profit by summing up the profit from each sale
    let totalProfit = 0;

    // Loop through each order
    filteredOrders.forEach((order) => {
      // If the order has order_items (sales), calculate profit for each item
      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach((item: any) => {
          // Calculate profit for this item (selling price - buying price) * quantity
          // unit_price is the selling price stored in the sales table
          const sellingPrice = item.unit_price || 0;
          // product.price is the buying price stored in the products table
          const buyingPrice = item.product?.price || 0;
          const quantity = item.quantity || 0;
          // Calculate profit without any tax deduction
          const itemProfit = (sellingPrice - buyingPrice) * quantity;
          totalProfit += itemProfit;
        });
      } else {
        // If order_items is not available, estimate profit as 30% of the order total
        // This is a fallback for older orders that might not have detailed item data
        const estimatedProfit = (order.total_amount || 0) * 0.3;
        totalProfit += estimatedProfit;
      }
    });

    return totalProfit;
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
          return orderDate >= startOfDay(now) && orderDate <= endOfDay(now);
        });
        break;
      case "week":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 7)) &&
            orderDate <= endOfDay(now)
          );
        });
        break;
      case "month":
        filteredOrders = orders.filter((order) => {
          const orderDate = parseISO(order.created_at);
          return (
            orderDate >= startOfDay(subDays(now, 30)) &&
            orderDate <= endOfDay(now)
          );
        });
        break;
      default:
        filteredOrders = orders;
    }

    // Group by date and sum amounts
    const groupedData: { [key: string]: number } = {};

    filteredOrders.forEach((order) => {
      const date = format(parseISO(order.created_at), "MMM dd");
      if (!groupedData[date]) {
        groupedData[date] = 0;
      }
      groupedData[date] += order.total_amount || 0;
    });

    // Convert to array format for chart
    const chartData = Object.keys(groupedData).map((date) => ({
      name: date,
      value: groupedData[date],
    }));

    setChartData(
      chartData.length > 0 ? chartData : [{ name: "No Data", value: 0 }]
    );
  };

  // Format numbers for display
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M MAD`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k MAD`;
    } else {
      return `${value.toFixed(2)} MAD`;
    }
  };

  const stats = [
    {
      title: "Total Clients",
      value: totalClients,
      icon: Users,
      trend: "+100%",
      trendUp: true,
    },
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      trend: "+100%",
      trendUp: true,
    },
    {
      title: "Total Revenue(ROSITA)",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      trend: "",
      // trendUp: false,
      timeframe: revenueTimeframe,
      setTimeframe: setRevenueTimeframe,
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      trend: "-8%",
      trendUp: false,
    },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 space-y-6 pb-16 bg-background max-w-full overflow-x-hidden">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-4">
                  <stat.icon className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-bold mb-1">
                {stat.value}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {stat.title}
              </p>
              {stat.setTimeframe ? (
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                  <Button
                    variant={stat.timeframe === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() => stat.setTimeframe("today")}
                    className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 rounded-full"
                  >
                    Today
                  </Button>
                  <Button
                    variant={stat.timeframe === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => stat.setTimeframe("week")}
                    className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 rounded-full"
                  >
                    This Week
                  </Button>
                  <Button
                    variant={
                      stat.timeframe === "15days" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => stat.setTimeframe("15days")}
                    className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 rounded-full"
                  >
                    15 Days
                  </Button>
                  <Button
                    variant={stat.timeframe === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => stat.setTimeframe("month")}
                    className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 rounded-full"
                  >
                    This Month
                  </Button>
                  <Button
                    variant={stat.timeframe === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => stat.setTimeframe("all")}
                    className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 rounded-full"
                  >
                    All Time
                  </Button>
                </div>
              ) : (
                <p
                  className={cn(
                    "flex items-center text-xs",
                    stat.trendUp ? "text-green-500" : "text-red-500"
                  )}
                >
                  {stat.trendUp ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {stat.trend}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inventory and Profit Cards - One per row on all screen sizes */}
      {/* Total Inventory Value Card */}
      <Card className="overflow-hidden shadow-sm mt-4">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start">
            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-4">
              <Box className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-bold mb-1">
            {/* {formatCurrency(totalInventoryValue)} */}
            {totalInventoryValue} MAD
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
            Total Inventory Value(RAS LML)
          </p>
          <p className="flex items-center text-xs text-green-500">
            {/* <TrendingUp className="mr-1 h-3 w-3" /> */}
          </p>
        </CardContent>
      </Card>

      {/* Total Profit Card */}
      <Card className="overflow-hidden shadow-sm mt-4">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-4">
              <BarChart className="h-6 w-6 text-accent-foreground" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowProfit(!showProfit)}
              className="h-8 w-8"
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
                  className="h-4 w-4"
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
                  className="h-4 w-4"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              )}
            </Button>
          </div>
          <div className="text-xl sm:text-3xl font-bold mb-1">
            {showProfit ? formatCurrency(totalProfit) : "****"}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
            Total Profit
          </p>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <Button
              variant={profitTimeframe === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setProfitTimeframe("today")}
              className="text-[10px] sm:text-xs h-6 sm:h-8 px-2 rounded-full"
            >
              Today
            </Button>
            <Button
              variant={profitTimeframe === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setProfitTimeframe("week")}
              className="text-[10px] sm:text-xs h-6 sm:h-8 px-2 rounded-full"
            >
              This Week
            </Button>
            <Button
              variant={profitTimeframe === "15days" ? "default" : "outline"}
              size="sm"
              onClick={() => setProfitTimeframe("15days")}
              className="text-[10px] sm:text-xs h-6 sm:h-8 px-2 rounded-full"
            >
              15 Days
            </Button>
            <Button
              variant={profitTimeframe === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setProfitTimeframe("month")}
              className="text-[10px] sm:text-xs h-6 sm:h-8 px-2 rounded-full"
            >
              This Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className="mt-4">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle>Revenue Over Time</CardTitle>
          <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
            <Button
              variant={selectedTimeframe === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe("today")}
              className="text-[10px] sm:text-xs h-6 sm:h-8 px-2 rounded-full"
            >
              Today
            </Button>
            <Button
              variant={selectedTimeframe === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe("week")}
              className="text-[10px] sm:text-xs h-6 sm:h-8 px-2 rounded-full"
            >
              This Week
            </Button>
            <Button
              variant={selectedTimeframe === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe("month")}
              className="text-[10px] sm:text-xs h-6 sm:h-8 px-2 rounded-full"
            >
              15 Days
            </Button>
            <Button
              variant={selectedTimeframe === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe("all")}
              className="text-[10px] sm:text-xs h-6 sm:h-8 px-2 rounded-full"
            >
              This Month
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading chart data...</p>
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
    </div>
  );
}
