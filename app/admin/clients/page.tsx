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
  Home,
  ShoppingBag,
  Package,
  History,
  Settings,
  UserPlus,
  Loader2,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getClients,
  addClient,
  updateClient,
  deleteClient,
} from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Client {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const clientsData = await getClients();

      // Log the first client to see the data structure
      if (clientsData.length > 0) {
        console.log("Sample client data:", clientsData[0]);
        console.log("Client ID type:", typeof clientsData[0].id);
      }

      // Sort by created_at in descending order (newest first)
      const sortedClients = [...clientsData].sort((a, b) => {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      });
      setClients(sortedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClient({
      ...newClient,
      [name]: value,
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingClient) {
      setEditingClient({
        ...editingClient,
        [name]: value,
      });
    }
  };

  const handleAddClient = async () => {
    // Validate required fields
    if (!newClient.name) {
      toast.error("Client name is required");
      return;
    }

    try {
      setIsSaving(true);
      await addClient(newClient);
      toast.success("Client added successfully");

      // Reset form
      setNewClient({
        name: "",
        email: "",
        phone: "",
        address: "",
      });

      // Close dialog
      setShowAddDialog(false);

      // Refresh clients list
      fetchClients();
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error("Failed to add client");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClient = async () => {
    if (!editingClient) return;

    // Validate required fields
    if (!editingClient.name) {
      toast.error("Client name is required");
      return;
    }

    try {
      setIsSaving(true);
      console.log(
        "Updating client with ID:",
        editingClient.id,
        "Type:",
        typeof editingClient.id
      );
      console.log("Client data:", {
        name: editingClient.name,
        email: editingClient.email,
        phone: editingClient.phone,
        address: editingClient.address,
      });

      // Create a clean object with only the fields we want to update
      // This avoids sending any metadata or unexpected fields
      const clientDataToUpdate = {
        name: editingClient.name || "",
        email: editingClient.email || "",
        phone: editingClient.phone || "",
        address: editingClient.address || "",
      };

      console.log("Clean client data for update:", clientDataToUpdate);
      const result = await updateClient(editingClient.id, clientDataToUpdate);

      console.log("Update result:", result);

      if (result === null) {
        toast.error("Client not found. It may have been deleted.");
        // Refresh the list to get the current state
        fetchClients();
      } else {
        // Check if this is a client-side only update
        if (
          result.updated_at &&
          new Date(result.updated_at).getTime() > Date.now() - 5000
        ) {
          // This is likely our client-side update (within the last 5 seconds)
          toast("Client updated locally only. Database update failed.", {
            description: "Changes may not persist after page refresh.",
            icon: "⚠️",
          });

          // Update the client in our local state
          setClients((prevClients) => {
            return prevClients.map((c) => {
              if (c.id === result.id) {
                return result;
              }
              return c;
            });
          });
        } else {
          toast.success("Client updated successfully");
        }

        // Close dialog
        setShowEditDialog(false);
        // Refresh clients list
        fetchClients();
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      setIsSaving(true);
      console.log(
        "Deleting client with ID:",
        clientToDelete.id,
        "Type:",
        typeof clientToDelete.id
      );
      await deleteClient(clientToDelete.id);
      toast.success("Client deleted successfully");

      // Close dialog
      setShowDeleteDialog(false);

      // Refresh clients list
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email &&
        client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.phone &&
        client.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4 space-y-6 pb-16">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Client Management
          </h1>
          <p className="text-muted-foreground">
            Add, edit, and manage your clients
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>Manage your client database</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "No clients match your search"
                : "No clients found"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell>{client.phone || "-"}</TableCell>
                      <TableCell>{client.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // Create a copy of the client to avoid reference issues
                              console.log("Setting client for edit:", client);
                              // Make sure we're not modifying the ID in any way
                              setEditingClient({
                                ...client,
                              });
                              setShowEditDialog(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              // Create a copy of the client to avoid reference issues
                              console.log("Setting client for delete:", client);
                              // Make sure we're not modifying the ID in any way
                              setClientToDelete({
                                ...client,
                              });
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Fill in the client details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Client Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={newClient.name}
                onChange={handleInputChange}
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newClient.email}
                onChange={handleInputChange}
                placeholder="Enter client email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={newClient.phone}
                onChange={handleInputChange}
                placeholder="Enter client phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={newClient.address}
                onChange={handleInputChange}
                placeholder="Enter client address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClient} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Client"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client details below
            </DialogDescription>
          </DialogHeader>
          {editingClient && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editingClient.name}
                  onChange={handleEditInputChange}
                  placeholder="Enter client name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editingClient.email || ""}
                  onChange={handleEditInputChange}
                  placeholder="Enter client email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={editingClient.phone || ""}
                  onChange={handleEditInputChange}
                  placeholder="Enter client phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  name="address"
                  value={editingClient.address || ""}
                  onChange={handleEditInputChange}
                  placeholder="Enter client address"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClient} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Client"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Client Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this client? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {clientToDelete && (
            <div className="py-4">
              <p className="font-medium">{clientToDelete.name}</p>
              {clientToDelete.phone && (
                <p className="text-sm text-muted-foreground">
                  Phone: {clientToDelete.phone}
                </p>
              )}
              {clientToDelete.email && (
                <p className="text-sm text-muted-foreground">
                  Email: {clientToDelete.email}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Client"
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
            className="flex flex-col h-full w-full rounded-none text-muted-foreground"
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
    </div>
  );
}
