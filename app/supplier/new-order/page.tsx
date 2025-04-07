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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Trash2,
  Camera,
  Upload,
  X,
  ShoppingCart,
  Search,
  Package,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  getSuppliers,
  getProducts,
  getCategories,
  createSupplierOrder,
  createSupplierOrderItems,
  createProduct,
  updateProduct,
} from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Supplier, Product } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function NewSupplierOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceImages, setInvoiceImages] = useState<string[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  // We've integrated the product selection directly into the page
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    category_id: "",
    stock: 0,
    price: 0,
    sellingPrice: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [suppliersData, productsData, categoriesData] = await Promise.all(
          [getSuppliers(), getProducts(), getCategories()]
        );

        setSuppliers(suppliersData);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle file input change for multiple images
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to Array
      const filesArray = Array.from(files);

      // Process each file
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setInvoiceImages((prev) => [
              ...prev,
              event.target?.result as string,
            ]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove a specific image
  const removeImage = (index: number) => {
    setInvoiceImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle taking a photo (for mobile)
  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle adding a product to the order with custom quantity and price
  const handleAddProductToOrder = (
    product: Product,
    quantity: number = 1,
    price: number = product.price || 0
  ) => {
    // Check if product is already in the order
    const existingItem = orderItems.find(
      (item) => item.product_id === product.id
    );

    if (existingItem) {
      // Update quantity and price if product already exists
      setOrderItems(
        orderItems.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: quantity,
                price: price,
                total: quantity * price,
              }
            : item
        )
      );
      toast.success(`Updated ${product.name} in order`);
    } else {
      // Add new product to order
      setOrderItems([
        ...orderItems,
        {
          product_id: product.id,
          product: product,
          quantity: quantity,
          price: price,
          total: quantity * price,
        },
      ]);
      toast.success(`Added ${quantity} ${product.name} to order`);
    }
  };

  // Handle removing a product from the order
  const handleRemoveProduct = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Handle quantity change
  const handleQuantityChange = (index: number, value: number) => {
    const newItems = [...orderItems];
    newItems[index].quantity = value;
    newItems[index].total = value * newItems[index].price;
    setOrderItems(newItems);
  };

  // Handle price change
  const handlePriceChange = (index: number, value: number) => {
    const newItems = [...orderItems];
    newItems[index].price = value;
    newItems[index].total = newItems[index].quantity * value;
    setOrderItems(newItems);
  };

  // Handle new product input change
  const handleNewProductChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]:
        name === "stock" || name === "price" || name === "sellingPrice"
          ? parseFloat(value)
          : value,
    });
  };

  // Handle adding a new product
  const handleAddNewProduct = async () => {
    if (!newProduct.name) {
      toast.error("Product name is required");
      return;
    }

    if (!newProduct.category_id) {
      toast.error("Category is required");
      return;
    }

    try {
      setIsSaving(true);

      // Prepare product data for saving
      const productToSave = {
        name: newProduct.name,
        price: newProduct.price || 0,
        sellingPrice: newProduct.sellingPrice || newProduct.price || 0,
        stock: newProduct.stock || 0,
        category_id: newProduct.category_id,
      };

      // Save the new product
      const savedProduct = await createProduct(productToSave);

      // Add the new product to the products list
      const productWithCategory = {
        ...savedProduct,
        category:
          categories.find((c) => c.id === savedProduct.category_id)?.name ||
          "Uncategorized",
      };

      setProducts([...products, productWithCategory]);

      // Add the new product to the order with default quantity and price
      handleAddProductToOrder(
        productWithCategory,
        newProduct.stock || 1,
        newProduct.price || 0
      );

      // Reset the form
      setNewProduct({
        name: "",
        category_id: "",
        stock: 0,
        price: 0,
        sellingPrice: 0,
      });

      // Close the dialog
      setShowNewProductDialog(false);

      toast.success("Product added successfully");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total amount
  const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

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
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category &&
        product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle saving the order
  const handleSaveOrder = async () => {
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

      // Array to collect price updates
      const priceUpdates: Array<{
        name: string;
        oldPrice: number;
        newPrice: number;
      }> = [];

      // Create the order
      const orderData = {
        supplier_id: selectedSupplier.id,
        invoice_number: invoiceNumber,
        // Store multiple images as a JSON string in the single invoice_image field
        invoice_image:
          invoiceImages.length > 0 ? JSON.stringify(invoiceImages) : null,
        total_amount: totalAmount,
        status: "pending",
        notes: notes,
      };

      const savedOrder = await createSupplierOrder(orderData);

      // Create order items
      const orderItemsData = orderItems.map((item) => ({
        supplier_order_id: savedOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      await createSupplierOrderItems(orderItemsData);

      // Update product stock and price if changed
      for (const item of orderItems) {
        try {
          // Get current product data
          const productToUpdate = products.find(
            (p) => p.id === item.product_id
          );

          if (productToUpdate) {
            // Calculate new stock
            const newStock = productToUpdate.stock + item.quantity;

            // Check if price has changed
            const priceChanged = item.price !== productToUpdate.price;

            // Prepare update data
            const updateData: any = {
              stock: newStock,
            };

            // If price has changed, update it
            if (priceChanged) {
              updateData.price = item.price;
              console.log(
                `Updating price for product ${productToUpdate.name} from ${productToUpdate.price} to ${item.price}`
              );

              // We'll collect price updates and show them in a single toast later
              priceUpdates.push({
                name: productToUpdate.name,
                oldPrice: productToUpdate.price,
                newPrice: item.price,
              });
            }

            // Update product in database
            await updateProduct(item.product_id, updateData);

            console.log(
              `Updated stock for product ${productToUpdate.name} from ${productToUpdate.stock} to ${newStock}`
            );
          }
        } catch (updateError) {
          console.error(
            `Error updating product ${item.product_id}:`,
            updateError
          );
          // Continue with other products even if one fails
        }
      }

      // Show a single toast with all price updates if any
      if (priceUpdates.length > 0) {
        const priceUpdateMessage = (
          <div>
            <p className="font-medium">Product prices updated:</p>
            <ul className="mt-2 text-sm space-y-1">
              {priceUpdates.map((update, index) => (
                <li key={index}>
                  {update.name}: {formatCurrency(update.oldPrice)} →{" "}
                  {formatCurrency(update.newPrice)}
                </li>
              ))}
            </ul>
          </div>
        );
        toast.info(priceUpdateMessage, {
          duration: 6000, // Show longer for multiple updates
        });
      }

      toast.success("Order created successfully");

      // Redirect to orders page
      router.push("/supplier/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-16 max-w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            New Supplier Order
          </h1>
          <p className="text-muted-foreground">
            Create a new order from a supplier
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-full">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Enter the order information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label htmlFor="supplier">
                Supplier <span className="text-red-500">*</span>
              </Label>

              {selectedSupplier ? (
                <div className="p-3 border rounded-md bg-accent/20 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{selectedSupplier.name}</div>
                    {selectedSupplier.contact_person && (
                      <div className="text-sm text-muted-foreground">
                        Contact: {selectedSupplier.contact_person}
                      </div>
                    )}
                    {selectedSupplier.phone && (
                      <div className="text-sm text-muted-foreground">
                        Phone: {selectedSupplier.phone}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSupplier(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Select
                  onValueChange={(value) => {
                    const supplier = suppliers.find((s) => s.id === value);
                    if (supplier) {
                      setSelectedSupplier(supplier);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number</Label>
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
              />
            </div>

            {/* Invoice Images */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Invoice Images</Label>
                <span className="text-xs text-muted-foreground">
                  {invoiceImages.length} image(s)
                </span>
              </div>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 bg-muted/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                  capture="environment"
                  multiple
                />

                {invoiceImages.length > 0 ? (
                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {invoiceImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Invoice ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md border"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Image {index + 1}
                          </div>
                        </div>
                      ))}

                      {/* Add more button */}
                      <div
                        className="border-2 border-dashed rounded-md flex items-center justify-center h-32 cursor-pointer hover:bg-accent/10 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center">
                          <Plus className="h-8 w-8 text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">
                            Add More
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop images or click to upload
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images
                      </Button>
                      <Button onClick={handleTakePhoto} variant="outline">
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items and Product Selection */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>Products in this order</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewProductDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Product Search */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Add Products</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name or category..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div
                  className="h-[250px] overflow-y-auto border rounded-md"
                  style={{
                    maxWidth: "100%",
                    overflowX: "hidden",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <Package className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-center">
                        {searchQuery
                          ? "No products match your search"
                          : "No products found"}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setShowNewProductDialog(true);
                          setNewProduct({
                            ...newProduct,
                            name: searchQuery,
                          });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Product
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 p-2">
                      {filteredProducts.map((product) => {
                        // Check if product is already in order
                        const existingItem = orderItems.find(
                          (item) => item.product_id === product.id
                        );

                        return (
                          <div
                            key={product.id}
                            className="p-3 rounded-md hover:bg-accent border-b last:border-0 overflow-hidden"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">
                                  {product.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {product.category || "Uncategorized"}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatCurrency(product.price || 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Current Stock: {product.stock || 0}
                                </div>
                              </div>
                            </div>

                            {existingItem ? (
                              <div className="flex items-center justify-between mt-2 bg-accent/50 p-2 rounded-md">
                                <span className="text-sm">
                                  Already in order (Qty: {existingItem.quantity}
                                  )
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
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
                              <div className="flex flex-wrap gap-2 mt-2 overflow-hidden">
                                <div className="w-full md:w-1/2 md:flex-1">
                                  <Label
                                    htmlFor={`qty-${product.id}`}
                                    className="text-xs"
                                  >
                                    Add to Inventory
                                  </Label>
                                  <Input
                                    id={`qty-${product.id}`}
                                    type="number"
                                    min="1"
                                    defaultValue="1"
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div className="w-full md:w-1/2 md:flex-1">
                                  <Label
                                    htmlFor={`price-${product.id}`}
                                    className="text-xs"
                                  >
                                    Purchase Price
                                  </Label>
                                  <Input
                                    id={`price-${product.id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    defaultValue={product.price || 0}
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div className="w-full flex justify-end mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const qtyInput = document.getElementById(
                                        `qty-${product.id}`
                                      ) as HTMLInputElement;
                                      const priceInput =
                                        document.getElementById(
                                          `price-${product.id}`
                                        ) as HTMLInputElement;

                                      const quantity =
                                        parseInt(qtyInput.value) || 1;
                                      const price =
                                        parseFloat(priceInput.value) ||
                                        product.price ||
                                        0;

                                      // Add to order with custom quantity and price
                                      handleAddProductToOrder(
                                        product,
                                        quantity,
                                        price
                                      );
                                    }}
                                  >
                                    Add to Order
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Order Summary</h3>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    No products added to this order yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border overflow-x-auto max-w-full">
                      <Table className="w-full min-w-max">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%] min-w-[120px]">
                              Product
                            </TableHead>
                            <TableHead className="w-[15%] min-w-[80px]">
                              Quantity
                            </TableHead>
                            <TableHead className="w-[20%] min-w-[80px]">
                              Price
                            </TableHead>
                            <TableHead className="w-[20%] min-w-[80px]">
                              Total
                            </TableHead>
                            <TableHead className="w-[15%] min-w-[40px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {item.product.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.product.category || "Uncategorized"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      index,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-full max-w-[80px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) =>
                                    handlePriceChange(
                                      index,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full max-w-[100px]"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(item.total)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => handleRemoveProduct(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex justify-between w-full md:w-1/2 py-2 border-t">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push("/supplier")}>
          Cancel
        </Button>
        <Button onClick={handleSaveOrder} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Create Order
            </>
          )}
        </Button>
      </div>

      {/* The Add Product Dialog has been integrated directly into the page */}

      {/* New Product Dialog */}
      <Dialog
        open={showNewProductDialog}
        onOpenChange={setShowNewProductDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter the product details below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="product-name"
                name="name"
                value={newProduct.name}
                onChange={handleNewProductChange}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                name="category_id"
                value={newProduct.category_id?.toString()}
                onValueChange={(value) => {
                  setNewProduct({
                    ...newProduct,
                    category_id: value,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">
                  Purchase Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={handleNewProductChange}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-selling-price">Selling Price</Label>
                <Input
                  id="product-selling-price"
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.sellingPrice}
                  onChange={handleNewProductChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-stock">Initial Stock</Label>
              <Input
                id="product-stock"
                name="stock"
                type="number"
                min="0"
                value={newProduct.stock}
                onChange={handleNewProductChange}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewProductDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNewProduct} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
