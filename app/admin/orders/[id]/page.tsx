"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Home,
  ShoppingBag,
  Package,
  History,
  Settings,
  Loader2,
  Phone,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getOrderById, getOrders, deleteAdminOrder } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateAndDownloadInvoice, shareViaWhatsApp } from "@/lib/invoice";
import { CartItem } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// This function is no longer needed since we're using server-side rendering
// But we'll keep it commented out for reference
/*
export async function generateStaticParams() {
  const orders = await getOrders();
  return orders.map((order) => ({
    id: order.id.toString(),
  }));
}
*/

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const orderData = await getOrderById(params.id);
        if (orderData) {
          setOrder(orderData);
        } else {
          toast.error("Order not found");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const handleGenerateInvoice = async () => {
    if (!order) return;

    try {
      // Convert order items (sales) to CartItem format
      const cartItems: CartItem[] = order.order_items.map((item: any) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.unit_price || item.amount / item.quantity, // Use unit_price or calculate from amount
        quantity: item.quantity,
      }));

      // Generate invoice
      await generateAndDownloadInvoice(
        {
          id: order.id,
          invoiceNumber: order.invoice_number,
          client: order.client,
          products: order.order_items.map((item: any) => ({
            productId: item.product_id,
            quantity: item.quantity,
          })),
          status: order.status,
          totalAmount: order.total_amount,
          createdAt: order.created_at,
        },
        cartItems,
        "ar"
      );

      toast.success("Invoice generated successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const handleShareViaWhatsApp = () => {
    if (!order || !order.client?.phone) {
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

  // Delete order
  const handleDeleteOrder = async () => {
    try {
      setIsDeleting(true);
      await deleteAdminOrder(params.id);
      toast.success("Order deleted successfully");
      router.push("/admin/orders");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Link href="/admin/orders">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <div className="flex flex-col items-center justify-center p-8">
          <p className="text-muted-foreground mb-2">Order not found</p>
          <Link href="/admin/orders">
            <Button>View All Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4 pb-16">
      <Link href="/admin/orders">
        <Button variant="ghost" className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Order Details */}
        <div className="w-full md:w-2/3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order #{order.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium text-orange-500">
                    {order.total_amount.toFixed(2)} MAD
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.length > 0 ? (
                  order.order_items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x{" "}
                          {(
                            item.unit_price || item.amount / item.quantity
                          ).toFixed(2)}{" "}
                          MAD
                        </p>
                      </div>
                      <p className="font-medium">
                        {item.amount
                          ? item.amount.toFixed(2)
                          : (item.quantity * item.unit_price).toFixed(2)}{" "}
                        MAD
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No items in this order
                  </p>
                )}

                <div className="pt-4 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{order.total_amount.toFixed(2)} MAD</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Details and Actions */}
        <div className="w-full md:w-1/3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{order.client?.name || "Unknown"}</p>
                {order.client?.phone && (
                  <p className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    {order.client.phone}
                  </p>
                )}
                {order.client?.email && (
                  <p className="text-sm">{order.client.email}</p>
                )}
                {order.client?.address && (
                  <p className="text-sm">{order.client.address}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={handleGenerateInvoice}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
              {order.client?.phone && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShareViaWhatsApp}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Share via WhatsApp
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
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

      {/* Delete Order Button */}
      <div className="print:hidden flex justify-center mt-8 mb-4">
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full max-w-xs"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Order
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
