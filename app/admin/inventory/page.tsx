"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Minus,
  Search,
  Edit,
  Trash2,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getProducts,
  getCategories,
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/lib/supabase";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  sellingPrice?: number; // This is in the database schema
  category?: string; // Virtual field for display only, not in database
  category_id: string; // UUID format, not a number
  image?: string;
  // We'll use stock = 0 to indicate inactive status
  created_at?: string;
  // Fields that don't exist in the database:
  // - description
  // - cost
  // - updated_at
}

// Interface for product form state (during editing)
interface ProductFormState {
  id?: number;
  name: string;
  stock: number;
  price: string; // Use string for editing to preserve decimal input
  sellingPrice: string; // Use string for editing to preserve decimal input
  category?: string;
  category_id: string;
  image?: string;
  created_at?: string;
}

// We'll fetch products from the database instead of using static data

interface Category {
  id: string; // UUID format, not a number
  name: string;
  created_at?: string;
}

// Utility function to convert MAD to RIL (1 MAD = 20 RIL)
const convertToRial = (madAmount: number): number => {
  return madAmount * 20;
};

// Utility function to convert RIL to MAD (20 RIL = 1 MAD)
const convertToMad = (rialAmount: number): number => {
  return rialAmount / 20;
};

// Function to convert price based on selected currency
const convertPrice = (price: string, isMad: boolean): number => {
  if (!price || isNaN(parseFloat(price))) return 0;

  const numericPrice = parseFloat(price);
  return isMad ? convertToRial(numericPrice) : convertToMad(numericPrice);
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProduct, setNewProduct] = useState<ProductFormState>({
    name: "",
    category: "",
    category_id: "", // Empty string for UUID
    stock: 0,
    price: "", // Empty string for better UX
    sellingPrice: "", // Empty string for better UX
    // Fields removed as they don't exist in the database:
    // - description
    // - cost
  });

  // State to track if price input is in MAD or RIL (default: RIL)
  const [isPriceInMad, setIsPriceInMad] = useState(false);

  // State to track if price input is in MAD or RIL in the edit form (default: RIL)
  const [isEditPriceInMad, setIsEditPriceInMad] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [sellQuantity, setSellQuantity] = useState(1);
  const [editingProduct, setEditingProduct] = useState<ProductFormState | null>(
    null
  );
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "delete" | "inactive" | "active" | null
  >(null);

  // Fetch products and categories from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        // Set categories
        setCategories(categoriesData);

        if (productsData && productsData.length > 0) {
          // Transform data to match our Product interface if needed
          const formattedProducts = productsData.map((p) => {
            // Find the category name based on category_id
            const category = categoriesData.find((c) => c.id === p.category_id);

            return {
              id: p.id,
              name: p.name,
              stock: p.stock || 0,
              price: p.price || 0,
              sellingPrice: p.sellingPrice || p.price || 0,
              category: category?.name || "Uncategorized", // Use the category name from the categories table
              category_id: p.category_id,
              image: p.image,
              created_at: p.created_at,
              // Fields removed as they don't exist in the database:
              // - description
              // - cost
              // - updated_at
            };
          });
          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddProduct = async () => {
    try {
      // Validate required fields
      if (!newProduct.name) {
        toast.error("Product name is required");
        return;
      }

      if (!newProduct.category_id || newProduct.category_id === "") {
        toast.error("Please select a category");
        return;
      }

      // Only include fields that exist in the database schema
      // Convert string price values to numbers for saving, handling currency conversion if needed
      let priceInMad =
        newProduct.price === "" ? 0 : parseFloat(newProduct.price) || 0;
      let sellingPriceInMad =
        newProduct.sellingPrice === ""
          ? 0
          : parseFloat(newProduct.sellingPrice) || 0;

      // If price was entered in RIL, convert to MAD for database storage
      if (!isPriceInMad) {
        priceInMad = convertToMad(priceInMad);
        sellingPriceInMad = convertToMad(sellingPriceInMad);
      }

      // If selling price is empty, use the price
      if (newProduct.sellingPrice === "") {
        sellingPriceInMad = priceInMad;
      }

      const productToSave = {
        name: newProduct.name,
        price: priceInMad,
        sellingPrice: sellingPriceInMad,
        stock: newProduct.stock || 0,
        category_id: newProduct.category_id,
        // Don't include fields that don't exist in the database:
        // - description
        // - cost
      };

      // Save to Supabase
      const savedProduct = await createProduct(productToSave);

      if (savedProduct) {
        // Find the category for display
        const category = categories.find(
          (c) => c.id === savedProduct.category_id
        );

        // Add to local state with the category name
        const productWithCategory = {
          ...savedProduct,
          category: category?.name || "Uncategorized",
        };

        setProducts([...products, productWithCategory as Product]);

        // Reset form
        setNewProduct({
          name: "",
          category: "",
          category_id: "", // Empty string for UUID
          stock: 0,
          price: "", // Empty string for better UX
          sellingPrice: "", // Empty string for better UX
          // Fields removed as they don't exist in the database:
          // - description
          // - cost
        });

        // Reset currency selection to default (RIL)
        setIsPriceInMad(false);

        toast.success("Product added successfully");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle different field types appropriately
    let processedValue = value;

    if (name === "stock") {
      // For stock, convert to integer
      processedValue = value === "" ? 0 : parseInt(value, 10);
    } else if (name === "price" || name === "sellingPrice") {
      // For price fields, keep as string but sanitize
      // Remove any non-numeric characters except decimal point
      const sanitizedValue = value.replace(/[^0-9.]/g, "");
      // Ensure only one decimal point
      const parts = sanitizedValue.split(".");
      processedValue =
        parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
      // Allow empty value during editing
      // Empty will be converted to 0 only when saving
    } else if (name === "category_id") {
      // Keep category_id as string for UUID
      processedValue = value;
    }

    setNewProduct({
      ...newProduct,
      [name]: processedValue,
    });
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    if (!editingProduct) return;

    const { name, value } = e.target;

    // Handle different field types appropriately
    let processedValue = value;

    if (name === "stock") {
      // For stock, convert to integer
      processedValue = value === "" ? 0 : parseInt(value, 10);
    } else if (name === "price" || name === "sellingPrice") {
      // For price fields, keep as string but sanitize
      // Remove any non-numeric characters except decimal point
      const sanitizedValue = value.replace(/[^0-9.]/g, "");
      // Ensure only one decimal point
      const parts = sanitizedValue.split(".");
      processedValue =
        parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
      // Allow empty value during editing
      // Empty will be converted to 0 only when saving
    } else if (name === "category_id") {
      // Keep category_id as string for UUID
      processedValue = value;
    }

    setEditingProduct({
      ...editingProduct,
      [name]: processedValue,
    });
  };

  const openEditDialog = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      // Convert numeric price values to strings for editing
      setEditingProduct({
        ...product,
        price: product.price.toString(),
        sellingPrice: (product.sellingPrice || product.price).toString(),
      });
      setSelectedProductId(productId);

      // Reset currency selection to default (RIL) when opening edit dialog
      setIsEditPriceInMad(false);

      setEditDialogOpen(true);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !selectedProductId) return;

    try {
      // Validate required fields
      if (!editingProduct.name) {
        toast.error("Product name is required");
        return;
      }

      if (!editingProduct.category_id || editingProduct.category_id === "") {
        toast.error("Please select a category");
        return;
      }

      // Only include fields that exist in the database schema
      // Convert string price values to numbers for saving, handling currency conversion if needed
      let priceInMad =
        editingProduct.price === "" ? 0 : parseFloat(editingProduct.price) || 0;
      let sellingPriceInMad =
        editingProduct.sellingPrice === ""
          ? 0
          : parseFloat(editingProduct.sellingPrice) || 0;

      // If price was entered in RIL, convert to MAD for database storage
      if (!isEditPriceInMad) {
        priceInMad = convertToMad(priceInMad);
        sellingPriceInMad = convertToMad(sellingPriceInMad);
      }

      // If selling price is empty, use the price
      if (editingProduct.sellingPrice === "") {
        sellingPriceInMad = priceInMad;
      }

      const productToUpdate = {
        name: editingProduct.name,
        price: priceInMad,
        sellingPrice: sellingPriceInMad,
        stock: editingProduct.stock || 0,
        category_id: editingProduct.category_id,
        // Don't include fields that don't exist in the database:
        // - description
        // - cost
      };

      // Update in Supabase
      const updatedProduct = await updateProduct(
        selectedProductId,
        productToUpdate
      );

      if (updatedProduct) {
        // Find the category for display
        const category = categories.find(
          (c) => c.id === updatedProduct.category_id
        );

        // Update local state with the category name
        const productWithCategory = {
          ...updatedProduct,
          category: category?.name || "Uncategorized",
        };

        setProducts(
          products.map((p) =>
            p.id === selectedProductId ? (productWithCategory as Product) : p
          )
        );

        toast.success("Product updated successfully");
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  // Get category name for display and filtering
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Uncategorized";
  };

  const filteredProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoryName(product.category_id)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (product.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    )
    .filter(
      (product) =>
        selectedCategory === "All" ||
        getCategoryName(product.category_id) === selectedCategory
    );

  const openSellDialog = (productId: number) => {
    setSelectedProductId(productId);
    setSellQuantity(1);
    setSellDialogOpen(true);
  };

  const handleSellProduct = async () => {
    if (!selectedProductId) return;

    try {
      // Find the product
      const product = products.find((p) => p.id === selectedProductId);
      if (!product) {
        toast.error("Product not found");
        return;
      }

      // Check if there's stock available
      if (product.stock < sellQuantity) {
        toast.error(`Not enough stock. Only ${product.stock} available.`);
        return;
      }

      // Update stock in Supabase
      const updatedProduct = await updateProduct(selectedProductId, {
        stock: product.stock - sellQuantity,
      });

      // Update local state
      setProducts(
        products.map((p) =>
          p.id === selectedProductId
            ? { ...p, stock: p.stock - sellQuantity }
            : p
        )
      );

      toast.success(`Sold ${sellQuantity} ${product.name}`);
      setSellDialogOpen(false);
    } catch (error) {
      console.error("Error selling product:", error);
      toast.error("Failed to update product stock");
    }
  };

  const handleMarkInactive = async (productId: number) => {
    try {
      // Update the product to set stock to 0 (which indicates inactive status)
      await updateProduct(productId, {
        stock: 0,
      });

      // Update local state
      setProducts(
        products.map((product) =>
          product.id === productId ? { ...product, stock: 0 } : product
        )
      );

      toast.success("Product marked as inactive (stock set to 0)");
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error("Error marking product as inactive:", error);
      toast.error("Failed to mark product as inactive");
    }
  };

  const handleMarkActive = async (productId: number) => {
    try {
      // Get the current product
      const product = products.find((p) => p.id === productId);
      if (!product) {
        toast.error("Product not found");
        return;
      }

      // Ask for the new stock quantity
      const newStock = window.prompt("Enter the new stock quantity:", "1");
      if (newStock === null) {
        // User cancelled the prompt
        setConfirmDialogOpen(false);
        return;
      }

      const stockValue = parseInt(newStock, 10) || 1;

      // Update the product to set stock to the new value
      await updateProduct(productId, {
        stock: stockValue,
      });

      // Update local state
      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, stock: stockValue } : p
        )
      );

      toast.success(`Product marked as active with stock set to ${stockValue}`);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error("Error marking product as active:", error);
      toast.error("Failed to mark product as active");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      // Delete from Supabase
      await deleteProduct(productId);

      // Update local state
      setProducts(products.filter((product) => product.id !== productId));

      toast.success("Product deleted successfully");
      setConfirmDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting product:", error);

      // Check if it's our custom error about products being used in sales/orders
      if (
        error.message &&
        (error.message.includes("Cannot delete product because it's used in") ||
          error.message.includes("violates foreign key constraint"))
      ) {
        // Show a more user-friendly error message
        toast.error(
          <div>
            <p>Cannot delete this product because it's used in orders.</p>
            <p className="text-sm mt-1">
              Consider marking it as inactive instead.
            </p>
          </div>
        );

        // Automatically open the confirm dialog to mark as inactive
        setSelectedProductId(productId);
        setConfirmAction("inactive");
        setConfirmDialogOpen(true);
      } else {
        toast.error("Failed to delete product");
      }

      setConfirmDialogOpen(false);
    }
  };

  const handleConfirmAction = () => {
    if (!selectedProductId) return;

    if (confirmAction === "delete") {
      handleDeleteProduct(selectedProductId);
    } else if (confirmAction === "inactive") {
      handleMarkInactive(selectedProductId);
    } else if (confirmAction === "active") {
      handleMarkActive(selectedProductId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4 pb-16">
      <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>

      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-10 pr-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="All" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full justify-start">
            <TabsTrigger
              key="All"
              value="All"
              onClick={() => setSelectedCategory("All")}
              className="px-4 py-2"
            >
              All
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className="px-4 py-2"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={selectedCategory} className="mt-4">
          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No products found in this category
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg overflow-hidden bg-card"
                >
                  <div className="p-4 flex justify-between items-start">
                    <div>
                      <div className="font-medium text-lg">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getCategoryName(product.category_id)}
                      </div>
                      <div className="mt-2">
                        {/* Cost field removed as it doesn't exist in the database */}
                        <div className="text-sm">
                          <span>Price: {product.price} MAD</span>
                          <span className="text-gray-500 mx-1">|</span>
                          <span className="text-gray-500">
                            ريال {convertToRial(product.price)}
                          </span>
                        </div>
                        <div className="text-sm text-orange-500">
                          <span>
                            Selling Price:{" "}
                            {product.sellingPrice || product.price} MAD
                          </span>
                          <span className="text-orange-300 mx-1">|</span>
                          <span className="text-orange-300">
                            ريال{" "}
                            {convertToRial(
                              product.sellingPrice || product.price
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 text-sm flex items-center gap-2">
                        <span>Stock: {product.stock}</span>
                        {product.stock === 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-16"
                        onClick={() => openSellDialog(product.id)}
                      >
                        Sell
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(product.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/* Toggle active/inactive button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-500"
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setConfirmAction(
                            product.stock === 0 ? "active" : "inactive"
                          );
                          setConfirmDialogOpen(true);
                        }}
                        title={
                          product.stock === 0
                            ? "Mark as active (add stock)"
                            : "Mark as inactive (set stock to 0)"
                        }
                      >
                        {product.stock === 0 ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setConfirmAction("delete");
                          setConfirmDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-10">
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new product to your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Product name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category_id" className="text-right">
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category_id"
                name="category_id"
                value={newProduct.category_id || ""}
                onChange={handleInputChange}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Description field removed as it doesn't exist in the database */}
            {/* Cost field removed as it doesn't exist in the database */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="price-currency"
                      checked={isPriceInMad}
                      onChange={() => setIsPriceInMad(!isPriceInMad)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="price-currency"
                      className="text-sm font-medium"
                    >
                      {isPriceInMad ? "MAD" : "RIL"}
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Input
                    id="price"
                    name="price"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*(\.[0-9]+)?"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    placeholder={`Enter price in ${
                      isPriceInMad ? "MAD" : "RIL"
                    }`}
                    className="flex-1"
                  />
                  {newProduct.price && !isNaN(parseFloat(newProduct.price)) && (
                    <div className="text-sm text-gray-500 whitespace-nowrap">
                      ≈{" "}
                      {isPriceInMad
                        ? `ريال ${convertToRial(parseFloat(newProduct.price))}`
                        : `${convertToMad(parseFloat(newProduct.price)).toFixed(
                            2
                          )} MAD`}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sellingPrice" className="text-right">
                Selling Price
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    id="sellingPrice"
                    name="sellingPrice"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*(\.[0-9]+)?"
                    value={newProduct.sellingPrice}
                    onChange={handleInputChange}
                    placeholder={`Enter selling price in ${
                      isPriceInMad ? "MAD" : "RIL"
                    } (optional)`}
                    className="flex-1"
                  />
                  {newProduct.sellingPrice &&
                    !isNaN(parseFloat(newProduct.sellingPrice)) && (
                      <div className="text-sm text-orange-300 whitespace-nowrap">
                        ≈{" "}
                        {isPriceInMad
                          ? `ريال ${convertToRial(
                              parseFloat(newProduct.sellingPrice)
                            )}`
                          : `${convertToMad(
                              parseFloat(newProduct.sellingPrice)
                            ).toFixed(2)} MAD`}
                      </div>
                    )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={newProduct.stock}
                onChange={handleInputChange}
                className="col-span-3"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details.</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editingProduct.name}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                  placeholder="Product name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category_id" className="text-right">
                  Category <span className="text-red-500">*</span>
                </Label>
                <select
                  id="edit-category_id"
                  name="category_id"
                  value={editingProduct.category_id || ""}
                  onChange={handleEditInputChange}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Description field removed as it doesn't exist in the database */}
              {/* Cost field removed as it doesn't exist in the database */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Price
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-price-currency"
                        checked={isEditPriceInMad}
                        onChange={() => setIsEditPriceInMad(!isEditPriceInMad)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="edit-price-currency"
                        className="text-sm font-medium"
                      >
                        {isEditPriceInMad ? "MAD" : "RIL"}
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Input
                      id="edit-price"
                      name="price"
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*(\.[0-9]+)?"
                      value={editingProduct.price}
                      onChange={handleEditInputChange}
                      placeholder={`Enter price in ${
                        isEditPriceInMad ? "MAD" : "RIL"
                      }`}
                      className="flex-1"
                    />
                    {editingProduct.price &&
                      !isNaN(parseFloat(editingProduct.price)) && (
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          ≈{" "}
                          {isEditPriceInMad
                            ? `ريال ${convertToRial(
                                parseFloat(editingProduct.price)
                              )}`
                            : `${convertToMad(
                                parseFloat(editingProduct.price)
                              ).toFixed(2)} MAD`}
                        </div>
                      )}
                  </div>

                 
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-sellingPrice" className="text-right">
                  Selling Price
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      id="edit-sellingPrice"
                      name="sellingPrice"
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*(\.[0-9]+)?"
                      value={editingProduct.sellingPrice}
                      onChange={handleEditInputChange}
                      placeholder={`Enter selling price in ${
                        isEditPriceInMad ? "MAD" : "RIL"
                      } (optional)`}
                      className="flex-1"
                    />
                    {editingProduct.sellingPrice &&
                      !isNaN(parseFloat(editingProduct.sellingPrice)) && (
                        <div className="text-sm text-orange-300 whitespace-nowrap">
                          ≈{" "}
                          {isEditPriceInMad
                            ? `ريال ${convertToRial(
                                parseFloat(editingProduct.sellingPrice)
                              )}`
                            : `${convertToMad(
                                parseFloat(editingProduct.sellingPrice)
                              ).toFixed(2)} MAD`}
                        </div>
                      )}
                  </div>

                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-stock" className="text-right">
                  Stock
                </Label>
                <Input
                  id="edit-stock"
                  name="stock"
                  type="number"
                  value={editingProduct.stock}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                  min="0"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProduct}>Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom navigation removed - now handled by layout */}

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Product</DialogTitle>
            <DialogDescription>
              Enter the quantity you want to sell.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="quantity" className="w-20">
                Quantity
              </Label>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                  disabled={sellQuantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={sellQuantity}
                  onChange={(e) =>
                    setSellQuantity(parseInt(e.target.value) || 1)
                  }
                  className="w-20 mx-2 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSellQuantity(sellQuantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {selectedProductId && (
              <div className="mt-4 text-sm">
                <p>
                  Product:{" "}
                  {products.find((p) => p.id === selectedProductId)?.name}
                </p>
                <p>
                  Available Stock:{" "}
                  {products.find((p) => p.id === selectedProductId)?.stock}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSellProduct}>Confirm Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "delete"
                ? "Delete Product"
                : confirmAction === "inactive"
                ? "Set Stock to Zero"
                : "Add Stock to Product"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "delete"
                ? "Are you sure you want to delete this product? This action cannot be undone."
                : confirmAction === "inactive"
                ? "This product's stock will be set to 0, making it unavailable for new orders."
                : "You'll be prompted to enter a new stock quantity for this product."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction === "delete" ? "destructive" : "default"}
              onClick={handleConfirmAction}
            >
              {confirmAction === "delete"
                ? "Delete"
                : confirmAction === "inactive"
                ? "Set to Zero"
                : "Add Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
