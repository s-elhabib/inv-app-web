'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, DollarSign, Box, Home, ShoppingBag, History, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 700 },
];

const stats = [
  {
    title: "Total Clients",
    value: "21",
    icon: Users,
    trend: "+100%",
    trendUp: true,
  },
  {
    title: "Total Products",
    value: "97",
    icon: Package,
    trend: "+100%",
    trendUp: true,
  },
  {
    title: "Total Revenue",
    value: "174.7k MAD",
    icon: DollarSign,
    trend: "-8%",
    trendUp: false,
  },
  {
    title: "Total Orders",
    value: "51",
    icon: ShoppingCart,
    trend: "-8%",
    trendUp: false,
  },
  {
    title: "Total Inventory Value",
    value: "769.1k MAD",
    icon: Box,
    trend: "0%",
    trendUp: true,
  },
];

export default function AdminPage() {
  return (
    <div className="container mx-auto p-4 space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to your dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={cn(
                  "text-xs",
                  stat.trendUp ? "text-green-500" : "text-red-500"
                )}>
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex justify-around items-center z-20">
        <Link href="/admin" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none bg-muted"
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
            className="flex flex-col h-full w-full rounded-none"
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
