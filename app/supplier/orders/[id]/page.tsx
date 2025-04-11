"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  Check,
  X,
  AlertTriangle,
  Download,
  Printer,
  Eye,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getSupplierOrderById,
  updateSupplierOrder,
  updateProduct,
  getProductById,
  deleteSupplierOrder,
} from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { generateInvoiceHTML } from "@/lib/invoice";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const orderData = await getSupplierOrderById(params.id);
      if (!orderData) {
        toast.error("Order not found");
        router.push("/supplier/orders");
        return;
      }
      setOrder(orderData);
      setNewStatus(orderData.status);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order");
      router.push("/supplier/orders");
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

  // Handle status update
  const handleUpdateStatus = async () => {
    try {
      setIsSaving(true);

      // Update the order status
      await updateSupplierOrder(order.id, { status: newStatus });

      // If the status is changing to "received" and was previously not "received",
      // update the inventory quantities
      if (newStatus === "received" && order.status !== "received") {
        // Process each order item to update inventory
        for (const item of order.order_items) {
          try {
            // Get current product data
            const productData = await getProductById(item.product_id);

            if (productData) {
              // Calculate new stock by adding the ordered quantity
              const newStock = productData.stock + item.quantity;

              // Update product stock
              await updateProduct(item.product_id, {
                stock: newStock,
              });

              console.log(
                `Updated stock for product ${productData.name} from ${productData.stock} to ${newStock}`
              );
            }
          } catch (updateError) {
            console.error(
              `Error updating stock for product ${item.product_id}:`,
              updateError
            );
            // Continue with other products even if one fails
          }
        }

        toast.success("Order marked as received and inventory updated");
      } else {
        toast.success("Order status updated successfully");
      }

      // Update the local state
      setOrder({ ...order, status: newStatus });
      setShowStatusDialog(false);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete order
  const handleDeleteOrder = async () => {
    try {
      setIsDeleting(true);
      await deleteSupplierOrder(params.id);
      toast.success("Order deleted successfully");
      router.push("/supplier/orders");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The order you are looking for does not exist or has been deleted.
        </p>
        <Link href="/supplier/orders">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-16 print:p-0 print:space-y-4">
      <div className="flex justify-between items-center print:hidden">
        <Link href="/supplier/orders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <div className="flex gap-2">
          {order.status === "received" && (
            <Button
              variant="outline"
              className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
              onClick={async () => {
                try {
                  // Convert order items to CartItem format
                  const cartItems = order.order_items.map((item) => ({
                    id: item.product_id,
                    name: item.product?.name || "Unknown Product",
                    price: item.price,
                    quantity: item.quantity,
                  }));

                  // Generate invoice HTML
                  const html = generateInvoiceHTML(
                    {
                      id: order.id,
                      invoiceNumber:
                        order.invoice_number || order.id.substring(0, 8),
                      client: null,
                      products: order.order_items.map((item) => ({
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

                  // Create a blob from the HTML
                  const blob = new Blob([html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);

                  // Open the invoice in a new tab for the user to download/print
                  window.open(url, "_blank");

                  toast.success("Invoice generated successfully");
                } catch (error) {
                  console.error("Error generating invoice:", error);
                  toast.error("Failed to generate invoice");
                }
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          )}
          {order.status === "pending" && (
            <Link href={`/supplier/orders/${params.id}/edit`}>
              <Button variant="outline">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                  <path d="m15 5 4 4"></path>
                </svg>
                Edit Order
              </Button>
            </Link>
          )}
          <Button
            onClick={() => setShowStatusDialog(true)}
            className={
              order.status === "received"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            }
          >
            {order.status === "received" ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">
          Order #{order.id.substring(0, 8)}
        </h1>
        <p className="text-muted-foreground">
          Created on{" "}
          {format(parseISO(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
        {/* Order Details */}
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="print:pb-2">
            <CardTitle className="print:text-lg">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 print:space-y-2">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Order Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(order.created_at), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Invoice Number</p>
                <p className="text-sm text-muted-foreground">
                  {order.invoice_number || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    order.status === "received"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>

            {order.notes && (
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Handle invoice image(s) */}
            {order.invoice_image && (
              <div className="mt-4 print:hidden">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Invoice Images</p>
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      // Try to parse the invoice_image as JSON to see if it's an array of images
                      try {
                        const images = JSON.parse(order.invoice_image);
                        return Array.isArray(images)
                          ? `${images.length} image(s)`
                          : "1 image";
                      } catch (e) {
                        // If it's not valid JSON, it's a single image URL
                        return "1 image";
                      }
                    })()}
                  </span>
                </div>

                {(() => {
                  // Try to parse the invoice_image as JSON to see if it's an array of images
                  try {
                    const images = JSON.parse(order.invoice_image);
                    if (Array.isArray(images) && images.length > 0) {
                      // It's a JSON array of images
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {images.map((image: string, index: number) => (
                            <div
                              key={index}
                              className="relative border rounded-md overflow-hidden group cursor-pointer"
                              onClick={() => {
                                setSelectedImage(image);
                                setShowImageDialog(true);
                              }}
                            >
                              <img
                                src={image}
                                alt={`Invoice ${index + 1}`}
                                className="w-full h-24 object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-xs"
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  View
                                </Button>
                              </div>
                              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  } catch (e) {
                    // Not JSON, treat as a single image URL
                  }

                  // Default: single image display
                  return (
                    <div
                      className="relative border rounded-md overflow-hidden"
                      style={{ maxHeight: "200px" }}
                    >
                      <img
                        src={order.invoice_image}
                        alt="Invoice"
                        className="w-full h-auto object-cover cursor-pointer"
                        onClick={() => {
                          setSelectedImage(order.invoice_image);
                          setShowImageDialog(true);
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedImage(order.invoice_image);
                            setShowImageDialog(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Full Image
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Details */}
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="print:pb-2">
            <CardTitle className="print:text-lg">
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 print:space-y-2">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Supplier Name</p>
                <p className="text-sm text-muted-foreground">
                  {order.supplier?.name || "Unknown Supplier"}
                </p>
              </div>
            </div>

            {order.supplier?.contact_person && (
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Contact Person</p>
                  <p className="text-sm text-muted-foreground">
                    {order.supplier.contact_person}
                  </p>
                </div>
              </div>
            )}

            {order.supplier?.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {order.supplier.phone}
                  </p>
                </div>
              </div>
            )}

            {order.supplier?.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {order.supplier.email}
                  </p>
                </div>
              </div>
            )}

            {order.supplier?.address && (
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {order.supplier.address}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:pb-2">
          <CardTitle className="print:text-lg">Order Items</CardTitle>
          <CardDescription className="print:hidden">
            {order.order_items?.length || 0} items in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto print:border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.order_items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.product?.name || "Unknown Product"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.product?.category || "Uncategorized"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 items-end mt-4 print:mt-2">
            <div className="flex justify-between w-full md:w-1/3 py-2 border-t print:w-1/3">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of this order
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Invoice Image Dialog */}
      {showImageDialog && selectedImage && (
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Invoice Image</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <img
                src={selectedImage}
                alt="Invoice"
                className="w-full h-auto rounded-md"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowImageDialog(false);
                  setSelectedImage(null);
                }}
              >
                Close
              </Button>
              <a
                href={selectedImage}
                download={`invoice-${order.id.substring(0, 8)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
