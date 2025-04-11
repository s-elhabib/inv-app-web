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
import { Label } from "@/components/ui/label";

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
  Plus,
  Trash,
  Save,
  X,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getSupplierOrderById,
  getSuppliers,
  getProducts,
  updateSupplierOrder,
  deleteSupplierOrderItems,
  createSupplierOrderItems,
} from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Supplier, Product } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderItem {
  id?: string;
  supplier_order_id?: string;
  product_id: string;
  product?: Product;
  quantity: number;
  price: number;
  total: number;
}

export default function EditSupplierOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchOrder();
    fetchSuppliers();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Calculate total amount whenever order items change
    const total = orderItems.reduce((sum, item) => sum + item.total, 0);
    setTotalAmount(total);
  }, [orderItems]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const orderData = await getSupplierOrderById(params.id);

      if (!orderData) {
        toast.error("Order not found");
        router.push("/supplier/orders");
        return;
      }

      // Check if order is already received - if so, redirect back
      if (orderData.status === "received") {
        toast.error("Cannot edit an order that has already been received");
        router.push(`/supplier/orders/${params.id}`);
        return;
      }

      setOrder(orderData);
      setSelectedSupplier(orderData.supplier);

      // Format order items
      if (orderData.order_items && orderData.order_items.length > 0) {
        setOrderItems(orderData.order_items);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order");
      router.push("/supplier/orders");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    }
  };

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  const handleUpdateOrder = async () => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    try {
      setIsSaving(true);

      // Update the order
      const orderData = {
        supplier_id: selectedSupplier.id,
        total_amount: Math.round(totalAmount), // Round to nearest integer as database expects integer
      };

      await updateSupplierOrder(params.id, orderData);

      // Delete existing order items
      await deleteSupplierOrderItems(params.id);

      // Create new order items
      const orderItemsData = orderItems.map((item) => ({
        supplier_order_id: params.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      await createSupplierOrderItems(orderItemsData);

      toast.success("Order updated successfully");
      router.push(`/supplier/orders/${params.id}`);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setIsSaving(false);
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

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-16">
      <div className="flex justify-between items-center">
        <Link href={`/supplier/orders/${params.id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Order
          </Button>
        </Link>
        <Button onClick={handleUpdateOrder} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Order</h1>
        <p className="text-muted-foreground">
          Update the order details and items
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Order Items Section - Shown first on mobile */}
        <div className="order-2 md:order-2 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Order Items</h3>
            <div className="text-sm">
              {orderItems.length} {orderItems.length === 1 ? "item" : "items"}
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">Price (MAD)</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No items added to this order yet
                    </TableCell>
                  </TableRow>
                ) : (
                  orderItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">
                          {item.product?.name || "Unknown Product"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.product?.category || "Uncategorized"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            const updatedItems = [...orderItems];
                            updatedItems[index] = {
                              ...item,
                              quantity: newQuantity,
                              total: newQuantity * item.price,
                            };
                            setOrderItems(updatedItems);
                          }}
                          className="w-20 h-8 text-center mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            const updatedItems = [...orderItems];
                            updatedItems[index] = {
                              ...item,
                              price: newPrice,
                              total: item.quantity * newPrice,
                            };
                            setOrderItems(updatedItems);
                          }}
                          className="w-24 h-8 text-center mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end items-center">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold text-lg">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Product Search Section - Shown second on mobile */}
        <div className="order-1 md:order-1 md:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Products</h3>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Supplier:</span>{" "}
              {selectedSupplier?.name}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="border rounded-md h-[calc(100vh-300px)] overflow-y-auto">
            <div className="flex flex-col gap-2 p-2 md:p-3 w-full overflow-hidden">
              {filteredProducts.map((product) => {
                // Check if product is already in order
                const existingItem = orderItems.find(
                  (item) => item.product_id === product.id
                );

                return (
                  <div
                    key={product.id}
                    className="p-2 md:p-3 rounded-md hover:bg-accent border-b last:border-0 overflow-hidden w-full"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="truncate pr-2">
                        <div className="font-medium text-sm">
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {product.category || "Uncategorized"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-sm">
                          {formatCurrency(product.price || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Stock: {product.stock || 0}
                        </div>
                      </div>
                    </div>

                    {existingItem ? (
                      <div className="flex items-center justify-between mt-2 bg-accent/50 p-2 rounded-md text-xs sm:text-sm overflow-hidden">
                        <span className="truncate mr-2">
                          Already in order (Qty: {existingItem.quantity})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 shrink-0"
                          onClick={() => {
                            // Remove from order
                            setOrderItems(
                              orderItems.filter(
                                (item) => item.product_id !== product.id
                              )
                            );
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="w-16 h-7 text-xs"
                          onChange={(e) =>
                            setQuantity(parseInt(e.target.value) || 1)
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => {
                            // Add to order with default quantity
                            const newItem = {
                              product_id: product.id,
                              product: product,
                              quantity: quantity || 1,
                              price: product.price,
                              total: (quantity || 1) * product.price,
                            };
                            setOrderItems([...orderItems, newItem]);
                          }}
                        >
                          Add to Order
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No products found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
