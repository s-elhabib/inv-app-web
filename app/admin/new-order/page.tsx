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
} from "lucide-react";
import { useState } from "react";
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

interface Product {
  id: string;
  name: string;
  price: number;
}

const clients: Client[] = [
  { id: "1", name: "Abd Razak", phone: "0612345678" },
  { id: "2", name: "Fatima Zahra", phone: "0698765432" },
  { id: "3", name: "Mohammed Ali", phone: "0654321098" },
];

const products = [
  { id: "1", name: "Almond Briouats 300g", price: 70 },
  { id: "2", name: "Almond Milk 1L", price: 1400 },
  { id: "3", name: "Avocado (each)", price: 800 },
  { id: "4", name: "Bagels (6 pack)", price: 1300 },
  { id: "5", name: "Baghrir (Thousand Hole Pancakes) 4pcs", price: 25 },
  { id: "6", name: "Beef Steak 400g", price: 1200 },
];

// Using CartItem from lib/types.ts

export default function NewOrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client>(clients[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceLanguage, setInvoiceLanguage] = useState<"en" | "ar">("en");
  const [shareViaWhatsAppOption, setShareViaWhatsAppOption] = useState(false);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleGenerateInvoice = () => {
    // Create order object
    const order: Order = {
      id: `ORD-${Date.now()}`,
      userId: "1", // Mock user ID
      client: selectedClient,
      products: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      status: "completed",
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    // Generate and download invoice
    generateAndDownloadInvoice(order, cart, invoiceLanguage)
      .then(() => {
        // Share via WhatsApp if option is selected
        if (shareViaWhatsAppOption && selectedClient.phone) {
          const message = `Hello ${selectedClient.name}, your invoice #${
            order.id
          } for ${totalAmount.toFixed(
            2
          )} MAD is ready. Thank you for your business!`;
          shareViaWhatsApp(selectedClient.phone, message);
        }

        // Show success message
        toast.success("Invoice generated successfully");

        // Reset cart
        setCart([]);
        setShowInvoiceDialog(false);
      })
      .catch((error) => {
        console.error("Error generating invoice:", error);
        toast.error("Failed to generate invoice");
      });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Select Products for Client
        </h1>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Client: {selectedClient.name}</CardTitle>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-orange-500">{product.price} MAD</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addToCart(product)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
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
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between font-medium">
                <span>Total Amount:</span>
                <span>{totalAmount.toFixed(2)} MAD</span>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={handleCheckout}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Checkout ({cart.length} items)
            </Button>

            <Dialog
              open={showInvoiceDialog}
              onOpenChange={setShowInvoiceDialog}
            >
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
                      onChange={(e) =>
                        setShareViaWhatsAppOption(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label
                      htmlFor="share-whatsapp"
                      className="flex items-center"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Share via WhatsApp (
                      {selectedClient.phone || "No phone number"})
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
                  <Button onClick={handleGenerateInvoice}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
