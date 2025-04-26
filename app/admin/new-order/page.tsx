"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Minus,
  Plus,
  ShoppingCart,
  X,
  FileText,
  Share2,
  Phone,
  Loader2,
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
  updateProduct,
  getProductById,
} from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  price: number;
  sellingPrice?: number;
  description?: string;
  stock?: number;
  category?: string;
  image?: string;
}

// Utility function to convert MAD to RIL (1 MAD = 20 RIL)
const convertToRial = (madAmount: number): number => {
  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round(madAmount * 20 * 100) / 100;
};

export default function NewOrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceLanguage, setInvoiceLanguage] = useState<"en" | "ar">("ar");
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
    // Check if product has stock available
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        // Check if adding one more would exceed available stock
        if (existingItem.quantity >= product.stock) {
          toast.error(
            `Cannot add more ${product.name}. Only ${product.stock} available in stock.`
          );
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Use sellingPrice if available, otherwise fall back to price
      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: product.sellingPrice || product.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((currentCart) => {
      // If decreasing quantity, no need to check stock
      if (delta < 0) {
        return currentCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        );
      }

      // If increasing quantity, check stock availability
      const item = currentCart.find((item) => item.id === productId);
      if (item) {
        // Find the product in the products array to get current stock
        const product = products.find((p) => p.id === productId);

        if (product && item.quantity >= product.stock) {
          toast.error(
            `Cannot add more ${product.name}. Only ${product.stock} available in stock.`
          );
          return currentCart;
        }
      }

      return currentCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + delta }
          : item
      );
    });
  };

  // Handle direct input of quantity
  const handleQuantityInput = (productId: string, value: string) => {
    // Allow empty input for editing purposes
    if (value === "") {
      // Temporarily allow empty value in the input field
      setCart((currentCart) => {
        return currentCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: value as any } // Use 'as any' to temporarily allow string
            : item
        );
      });
      return;
    }

    // Convert input to number
    const newQuantity = parseInt(value, 10);

    // Validate input
    if (isNaN(newQuantity)) {
      return; // Don't update for non-numeric input
    }

    // If quantity is less than 1, set it to 1
    if (newQuantity < 1) {
      setCart((currentCart) => {
        return currentCart.map((item) =>
          item.id === productId ? { ...item, quantity: 1 } : item
        );
      });
      return;
    }

    setCart((currentCart) => {
      const item = currentCart.find((item) => item.id === productId);
      if (!item) return currentCart;

      // Find the product to check stock
      const product = products.find((p) => p.id === productId);
      if (!product) return currentCart;

      // Check if quantity exceeds available stock
      if (newQuantity > product.stock) {
        toast.error(
          `Cannot add ${newQuantity} of ${product.name}. Only ${product.stock} available in stock.`
        );
        // Set to maximum available stock instead of rejecting the input
        return currentCart.map((item) =>
          item.id === productId ? { ...item, quantity: product.stock } : item
        );
      }

      // Update the quantity
      return currentCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  };

  const totalAmount = cart.reduce((sum, item) => {
    // Ensure quantity is a number for calculation
    const quantity =
      typeof item.quantity === "string"
        ? item.quantity === ""
          ? 0
          : parseInt(item.quantity, 10)
        : item.quantity;

    return sum + item.price * (isNaN(quantity) ? 0 : quantity);
  }, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    setShowInvoiceDialog(true);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedClient) {
      toast.error("Please select a client");
      return;
    }

    // Check if there's enough stock for all items in the cart
    let hasInsufficientStock = false;
    const stockIssues = [];

    for (const cartItem of cart) {
      const product = products.find((p) => p.id === cartItem.id);
      if (product && cartItem.quantity > product.stock) {
        hasInsufficientStock = true;
        stockIssues.push(
          `${product.name}: Ordered ${cartItem.quantity}, only ${product.stock} in stock`
        );
      }
    }

    if (hasInsufficientStock) {
      toast.error(
        <div>
          <p>Insufficient stock for some items:</p>
          <ul className="list-disc pl-4 mt-2">
            {stockIssues.map((issue, index) => (
              <li key={index} className="text-sm">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    try {
      setIsSaving(true);

      // Create order in Supabase
      // Convert total_amount to integer (database expects integer)
      const orderData = {
        client_id: selectedClient.id,
        status: "completed",
        total_amount: Math.round(totalAmount), // Round to nearest integer
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
        client_id: selectedClient.id, // Include client ID
        quantity: item.quantity,
        price: item.price,
      }));

      await createOrderItems(orderItems);

      // Update product stock and price for each item in the order
      console.log(
        "Starting to update product stock and price for order items..."
      );
      for (const item of cart) {
        try {
          console.log(
            `Processing item: ${item.id} (${item.name}), quantity: ${item.quantity}, price: ${item.price}`
          );

          // Find the product in our products array
          const productToUpdate = products.find((p) => p.id === item.id);
          console.log("Product from state:", productToUpdate);

          if (productToUpdate) {
            // Get the current product from the database to ensure we have the latest data
            const currentProduct = await getProductById(item.id);
            console.log("Current product from DB:", currentProduct);

            if (currentProduct) {
              // Prepare updates object
              const updates: any = {};

              // Calculate new stock (subtract the ordered quantity)
              const updatedStock = Math.max(
                0,
                currentProduct.stock - item.quantity
              );
              updates.stock = updatedStock;

              // Check if the price used in the order is different from the current selling price
              const currentSellingPrice =
                currentProduct.sellingPrice || currentProduct.price;
              if (item.price !== currentSellingPrice) {
                console.log(
                  `Price change detected for ${productToUpdate.name}: ${currentSellingPrice} → ${item.price}`
                );
                // Update the selling price to the new price used in the order
                updates.sellingPrice = item.price;
              }

              // Update product in the database
              const result = await updateProduct(item.id, updates);
              console.log(`Product update result:`, result);

              // Show toast notifications for updates
              if (updatedStock !== currentProduct.stock) {
                toast.success(
                  `Updated stock for ${productToUpdate.name}: ${currentProduct.stock} → ${updatedStock}`
                );
              }

              if (updates.sellingPrice !== undefined) {
                toast.success(
                  `Updated price for ${productToUpdate.name}: ${currentSellingPrice} → ${item.price} MAD`
                );
              }
            } else {
              console.error(`Could not find product ${item.id} in database`);
              toast.error(`Failed to update product ${productToUpdate.name}`);
            }
          } else {
            console.warn(`Product ${item.id} not found in local state`);
          }
        } catch (updateError) {
          console.error(`Error updating product ${item.id}:`, updateError);
          toast.error(`Error updating product ${item.name || item.id}`);
          // Continue with other products even if one fails
        }
      }
      console.log("Finished updating product stock and price for all items.");

      // Create order object for invoice
      const order: Order = {
        id: savedOrder.id,
        invoiceNumber: savedOrder.invoice_number,
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
        const invoiceNumber = savedOrder.invoice_number || savedOrder.id;
        const message = `Hello ${
          selectedClient.name
        }, your invoice #${invoiceNumber} for ${totalAmount.toFixed(
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
              <div className="space-y-4">
                <CardTitle>Select Client</CardTitle>
                <div className="relative">
                  {selectedClient ? (
                    <div className="p-3 border rounded-md bg-accent/20 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{selectedClient.name}</div>
                        {selectedClient.phone && (
                          <div className="text-sm text-muted-foreground">
                            {selectedClient.phone}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedClient(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Command className="rounded-lg border shadow-sm overflow-visible">
                      <CommandInput
                        placeholder="Search clients by name..."
                        className="border-none focus:ring-0"
                      />
                      <CommandList className="absolute top-full left-0 right-0 max-h-64 overflow-y-auto z-10 bg-background border rounded-b-lg shadow-md">
                        <CommandEmpty>No clients found.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              onSelect={() => {
                                setSelectedClient(client);
                                // Close dropdown by removing focus
                                (document.activeElement as HTMLElement)?.blur();
                              }}
                              className="flex flex-col items-start"
                            >
                              <div className="font-medium">{client.name}</div>
                              {client.phone && (
                                <div className="text-xs text-muted-foreground">
                                  {client.phone}
                                </div>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  )}
                </div>
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-orange-500">
                            {product.sellingPrice || product.price} MAD
                            <span className="text-gray-500 mx-1">|</span>
                            <span className="text-gray-500">
                              ريال{" "}
                              {convertToRial(
                                product.sellingPrice || product.price
                              )}
                            </span>
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              product.stock > 0
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {product.stock > 0
                              ? `${product.stock} in stock`
                              : "Out of stock"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        title={
                          product.stock <= 0 ? "Out of stock" : "Add to cart"
                        }
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
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-orange-500">
                                {item.price} MAD
                                <span className="text-gray-500 mx-1">|</span>
                                <span className="text-gray-500">
                                  ريال {convertToRial(item.price)}
                                </span>
                              </p>
                              {/* Find the product in the products array to get current stock */}
                              {(() => {
                                const product = products.find(
                                  (p) => p.id === item.id
                                );
                                const remainingStock = product
                                  ? product.stock - item.quantity
                                  : 0;
                                return (
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                                      remainingStock > 0
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                    }`}
                                  >
                                    {remainingStock > 0
                                      ? `${remainingStock} left`
                                      : "Last items"}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityInput(item.id, e.target.value)
                              }
                              onBlur={() => {
                                // Ensure we have a valid number when focus leaves the input
                                if (
                                  item.quantity === "" ||
                                  isNaN(Number(item.quantity))
                                ) {
                                  setCart((currentCart) =>
                                    currentCart.map((cartItem) =>
                                      cartItem.id === item.id
                                        ? { ...cartItem, quantity: 1 }
                                        : cartItem
                                    )
                                  );
                                }
                              }}
                              className="w-16 h-8 text-center p-1"
                            />
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
                        <span>
                          {totalAmount.toFixed(2)} MAD
                          <span className="text-gray-500 mx-1">|</span>
                          <span className="text-gray-500">
                            ريال {convertToRial(totalAmount)}
                          </span>
                        </span>
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
          className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg transition-transform duration-300 ease-in-out lg:hidden z-[100] ${
            showMobileCart ? "translate-y-0" : "translate-y-full"
          }`}
          ref={cartRef}
        >
          <div className="p-4 pb-20">
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-orange-500">
                        {item.price} MAD
                        <span className="text-gray-500 mx-1">|</span>
                        <span className="text-gray-500">
                          ريال {convertToRial(item.price)}
                        </span>
                      </p>
                      {/* Find the product in the products array to get current stock */}
                      {(() => {
                        const product = products.find((p) => p.id === item.id);
                        const remainingStock = product
                          ? product.stock - item.quantity
                          : 0;
                        return (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
                              remainingStock > 0
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}
                          >
                            {remainingStock > 0
                              ? `${remainingStock} left`
                              : "Last items"}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityInput(item.id, e.target.value)
                      }
                      onBlur={() => {
                        // Ensure we have a valid number when focus leaves the input
                        if (
                          item.quantity === "" ||
                          isNaN(Number(item.quantity))
                        ) {
                          setCart((currentCart) =>
                            currentCart.map((cartItem) =>
                              cartItem.id === item.id
                                ? { ...cartItem, quantity: 1 }
                                : cartItem
                            )
                          );
                        }
                      }}
                      className="w-16 h-8 text-center p-1"
                    />
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
                <span>
                  {totalAmount.toFixed(2)} MAD
                  <span className="text-gray-500 mx-1">|</span>
                  <span className="text-gray-500">
                    ريال {convertToRial(totalAmount)}
                  </span>
                </span>
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
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg lg:hidden z-[90] flex items-center justify-center"
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
      <Dialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        className="z-[110]"
      >
        <DialogContent className="z-[110] mb-16 sm:mb-0">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Choose your invoice options below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border p-3 rounded-md bg-muted/50 mb-4">
              <div className="text-sm font-medium mb-1">Order Summary:</div>
              <div className="flex justify-between items-center">
                <span>Total Amount:</span>
                <span>
                  {totalAmount.toFixed(2)} MAD
                  <span className="text-gray-500 mx-1">|</span>
                  <span className="text-gray-500">
                    ريال {convertToRial(totalAmount)}
                  </span>
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </div>
            </div>

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
                  <RadioGroupItem value="ar" id="lang-ar" />
                  <Label htmlFor="lang-ar">Arabic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="lang-en" />
                  <Label htmlFor="lang-en">English</Label>
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

      {/* Bottom navigation removed - now handled by layout */}
    </div>
  );
}
