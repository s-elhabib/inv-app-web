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
  ShoppingBag,
  Home,
  Package,
  History,
  Settings,
  Filter,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/lib/supabase";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  stock: number;
  cost: number;
  price: number;
  category: string;
  image?: string;
}

const inventory = [
  {
    id: 1,
    name: "Moto",
    stock: 10,
    cost: 100,
    price: 110,
    category: "Toy",
  },
  {
    id: 2,
    name: "Tyej",
    stock: 50,
    cost: 100,
    price: 120,
    category: "Bakery",
  },
  {
    id: 3,
    name: "Ityy",
    stock: 13,
    cost: 5,
    price: 16,
    category: "Toy",
    image: "/images/ityy.jpg",
  },
  {
    id: 4,
    name: "Tofita",
    stock: 100,
    cost: 22,
    price: 23,
    category: "Spices",
  },
];

const categories = [
  "All",
  "Bakery",
  "Beverages",
  "Dairy",
  "Grains",
  "Meat",
  "Produce",
  "Spices",
  "Sweets",
  "Toy",
];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(inventory);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    category: "",
    stock: 0,
    cost: 0,
    price: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [sellQuantity, setSellQuantity] = useState(1);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const productsData = await getProducts();
        if (productsData && productsData.length > 0) {
          // Transform data to match our Product interface if needed
          const formattedProducts = productsData.map((p) => ({
            id: p.id,
            name: p.name,
            stock: p.stock || 0,
            cost: p.cost || 0,
            price: p.price || 0,
            category: p.category || "Uncategorized",
            image: p.image,
          }));
          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddProduct = async () => {
    try {
      // Validate required fields
      if (!newProduct.name || !newProduct.category) {
        toast.error("Name and category are required");
        return;
      }

      // Save to Supabase
      const savedProduct = await createProduct(newProduct);

      if (savedProduct) {
        // Add to local state
        setProducts([...products, savedProduct as Product]);

        // Reset form
        setNewProduct({
          name: "",
          category: "",
          stock: 0,
          cost: 0,
          price: 0,
        });

        toast.success("Product added successfully");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]:
        name === "stock" || name === "price" || name === "cost"
          ? parseFloat(value)
          : value,
    });
  };

  const filteredProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(
      (product) =>
        selectedCategory === "All" || product.category === selectedCategory
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

  const handleDeleteProduct = async (productId: number) => {
    try {
      // Delete from Supabase
      await deleteProduct(productId);

      // Update local state
      setProducts(products.filter((product) => product.id !== productId));

      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
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
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                onClick={() => setSelectedCategory(category)}
                className="px-4 py-2"
              >
                {category}
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
                        {product.category}
                      </div>
                      <div className="mt-2">
                        <div className="text-sm">Cost: {product.cost} MAD</div>
                        <div className="text-sm text-orange-500">
                          Sell: {product.price} MAD
                        </div>
                      </div>
                      <div className="mt-1 text-sm">Stock: {product.stock}</div>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteProduct(product.id)}
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
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
                className="col-span-3"
              />
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
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">
                Cost
              </Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                value={newProduct.cost}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Selling Price
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex justify-around items-center z-20">
        <Link href="/admin" className="w-full">
          <Button
            variant="ghost"
            className="flex flex-col h-full w-full rounded-none text-muted-foreground"
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
            className="flex flex-col h-full w-full rounded-none text-primary"
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
    </div>
  );
}
