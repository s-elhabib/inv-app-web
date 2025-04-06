"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Minus,
  Plus,
  ShoppingCart,
  X,
  FileText,
  Share2,
  Phone,
  Loader2,
  Home,
  ShoppingBag,
  Package,
  History,
  Settings,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { generateAndDownloadInvoice, shareViaWhatsApp } from "@/lib/invoice";
import { CartItem, Client, Order } from "@/lib/types";
import {
  getProducts,
  getClients,
  createOrder,
  createOrderItems,
} from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  category?: string;
  image?: string;
}

export default function NewOrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceLanguage, setInvoiceLanguage] = useState<"en" | "ar">("en");
  const [shareViaWhatsAppOption, setShareViaWhatsAppOption] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  // Fetch products and clients from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsData, clientsData] = await Promise.all([
          getProducts(),
          getClients(),
        ]);

        setProducts(productsData);
        setClients(clientsData);

        if (clientsData.length > 0) {
          setSelectedClient(clientsData[0]);
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

  // Close mobile cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMobileCart &&
        cartRef.current &&
        !cartRef.current.contains(event.target as Node)
      ) {
        setShowMobileCart(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileCart]);

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (cart.length === 0) return;

    setShowInvoiceDialog(true);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedClient) {
      toast.error("Please select a client");
      return;
    }

    try {
      setIsSaving(true);

      // Create order in Supabase
      const orderData = {
        user_id: "1", // Mock user ID
        client_id: selectedClient.id,
        status: "completed",
        total_amount: totalAmount,
      };

      // Save order to Supabase
      const savedOrder = await createOrder(orderData);

      if (!savedOrder || !savedOrder.id) {
        throw new Error("Failed to create order");
      }

      // Save order items
      const orderItems = cart.map((item) => ({
        order_id: savedOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      await createOrderItems(orderItems);

      // Create order object for invoice
      const order: Order = {
        id: savedOrder.id,
        userId: "1",
        client: selectedClient,
        products: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        status: "completed",
        totalAmount,
        createdAt: savedOrder.created_at || new Date().toISOString(),
      };

      // Generate and download invoice
      await generateAndDownloadInvoice(order, cart, invoiceLanguage);

      // Share via WhatsApp if option is selected
      if (shareViaWhatsAppOption && selectedClient.phone) {
        const message = `Hello ${selectedClient.name}, your invoice #${
          savedOrder.id
        } for ${totalAmount.toFixed(
          2
        )} MAD is ready. Thank you for your business!`;
        shareViaWhatsApp(selectedClient.phone, message);
      }

      // Show success message
      toast.success("Order saved and invoice generated successfully");

      // Reset cart
      setCart([]);
      setShowInvoiceDialog(false);
    } catch (error) {
      console.error("Error processing order:", error);
      toast.error("Failed to process order");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading products and clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 relative">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Select Products for Client
        </h1>

        {/* Mobile cart toggle button - only visible on mobile */}
        {cart.length > 0 && (
          <Button
            onClick={() => setShowMobileCart(!showMobileCart)}
            className="lg:hidden flex items-center gap-2"
            variant="outline"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {cart.length}
            </span>
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column - Products */}
        <div className="w-full lg:w-2/3">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle>
                  Client: {selectedClient?.name || "Select a client"}
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Select Client</DialogTitle>
                      <DialogDescription>
                        Choose a client for this order.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className={`p-3 border rounded-md cursor-pointer hover:bg-accent ${
                            selectedClient?.id === client.id ? "bg-accent" : ""
                          }`}
                          onClick={() => {
                            setSelectedClient(client);
                            // Close the dialog by clicking the close button
                            document
                              .querySelector("[data-radix-collection-item]")
                              ?.click();
                          }}
                        >
                          <div className="font-medium">{client.name}</div>
                          {client.phone && (
                            <div className="text-sm text-muted-foreground">
                              {client.phone}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products found matching your search.
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-orange-500">
                          {product.price} MAD
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addToCart(product)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Cart (desktop) */}
        <div className="hidden lg:block w-full lg:w-1/3">
          <div className="sticky top-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Cart</span>
                  {cart.length > 0 && (
                    <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      {cart.length} {cart.length === 1 ? "item" : "items"}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Your cart is empty. Add products to get started.
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-orange-500">
                              {item.price} MAD
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between font-medium">
                        <span>Total Amount:</span>
                        <span>{totalAmount.toFixed(2)} MAD</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Checkout
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Cart Slide-up Panel */}
      {cart.length > 0 && (
        <div
          className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg transition-transform duration-300 ease-in-out lg:hidden z-50 ${
            showMobileCart ? "translate-y-0" : "translate-y-full"
          }`}
          ref={cartRef}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileCart(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 mb-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-orange-500">{item.price} MAD</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between font-medium mb-4">
                <span>Total Amount:</span>
                <span>{totalAmount.toFixed(2)} MAD</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating cart button for mobile - visible when cart has items and mobile cart is closed */}
      {cart.length > 0 && !showMobileCart && (
        <Button
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg lg:hidden z-40 flex items-center justify-center"
          onClick={() => setShowMobileCart(true)}
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cart.length}
            </span>
          </div>
        </Button>
      )}

      {/* Invoice generation dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Choose your invoice options below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Invoice Language</Label>
              <RadioGroup
                value={invoiceLanguage}
                onValueChange={(value) =>
                  setInvoiceLanguage(value as "en" | "ar")
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="lang-en" />
                  <Label htmlFor="lang-en">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ar" id="lang-ar" />
                  <Label htmlFor="lang-ar">Arabic</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="share-whatsapp"
                checked={shareViaWhatsAppOption}
                onChange={(e) => setShareViaWhatsAppOption(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="share-whatsapp" className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                Share via WhatsApp ({selectedClient?.phone || "No phone number"}
                )
              </Label>
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowInvoiceDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            className="flex flex-col h-full w-full rounded-none bg-muted"
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
