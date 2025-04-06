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
} from "lucide-react";
import { useEffect, useState } from "react";
import { getSupplierOrderById, updateSupplierOrder } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { format, parseISO } from "date-fns";
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
  const [showStatusDialog, setShowStatusDialog] = useState(false);
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
      await updateSupplierOrder(order.id, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      toast.success("Order status updated successfully");
      setShowStatusDialog(false);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsSaving(false);
    }
  };

  // Print invoice
  const handlePrint = () => {
    window.print();
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
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={() => setShowStatusDialog(true)}
            className={
              order.status === "received"
                ? "bg-green-600 hover:bg-green-700"
                : order.status === "pending"
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {order.status === "received" ? (
              <Check className="mr-2 h-4 w-4" />
            ) : order.status === "pending" ? (
              <AlertTriangle className="mr-2 h-4 w-4" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
                      : order.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
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

            {/* Handle both legacy single image and new multiple images */}
            {(order.invoice_image ||
              (order.invoice_images && order.invoice_images.length > 0)) && (
              <div className="mt-4 print:hidden">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Invoice Images</p>
                  <span className="text-xs text-muted-foreground">
                    {order.invoice_images ? order.invoice_images.length : 1}{" "}
                    image(s)
                  </span>
                </div>

                {order.invoice_image ? (
                  // Legacy single image display
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
                ) : (
                  // Multiple images display
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {order.invoice_images.map(
                      (image: string, index: number) => (
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
                      )
                    )}
                  </div>
                )}
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
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
