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
  Search,
  Pencil,
  Trash2,
  Plus,
  Phone,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Supplier } from "@/lib/types";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: "",
    phone: "",
    email: "",
    address: "",
    contact_person: "",
  });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSupplier({
      ...newSupplier,
      [name]: value,
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingSupplier) {
      setEditingSupplier({
        ...editingSupplier,
        [name]: value,
      });
    }
  };

  const handleAddSupplier = async () => {
    // Validate required fields
    if (!newSupplier.name) {
      toast.error("Supplier name is required");
      return;
    }

    try {
      setIsSaving(true);
      await addSupplier(newSupplier);
      toast.success("Supplier added successfully");

      // Reset form
      setNewSupplier({
        name: "",
        phone: "",
        email: "",
        address: "",
        contact_person: "",
      });

      // Close dialog
      setShowAddDialog(false);

      // Refresh suppliers list
      fetchSuppliers();
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast.error("Failed to add supplier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSupplier = async () => {
    if (!editingSupplier) return;

    // Validate required fields
    if (!editingSupplier.name) {
      toast.error("Supplier name is required");
      return;
    }

    try {
      setIsSaving(true);
      
      // Create a clean object with only the fields we want to update
      const supplierDataToUpdate = {
        name: editingSupplier.name,
        phone: editingSupplier.phone || "",
        email: editingSupplier.email || "",
        address: editingSupplier.address || "",
        contact_person: editingSupplier.contact_person || "",
      };

      await updateSupplier(editingSupplier.id, supplierDataToUpdate);
      toast.success("Supplier updated successfully");

      // Close dialog
      setShowEditDialog(false);
      
      // Refresh suppliers list
      fetchSuppliers();
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast.error("Failed to update supplier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    try {
      setIsSaving(true);
      await deleteSupplier(supplierToDelete.id);
      toast.success("Supplier deleted successfully");

      // Close dialog
      setShowDeleteDialog(false);

      // Refresh suppliers list
      fetchSuppliers();
    } catch (error: any) {
      console.error("Error deleting supplier:", error);
      
      // Check if it's our custom error about orders using the supplier
      if (error.message && error.message.includes("Cannot delete supplier because it's used by")) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete supplier");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.phone && supplier.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4 space-y-6 pb-16">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Supplier Management
          </h1>
          <p className="text-muted-foreground">
            Add, edit, and manage your suppliers
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>Manage your suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "No suppliers match your search"
                : "No suppliers found"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell>{supplier.contact_person || "-"}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>{supplier.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSupplier({
                                ...supplier,
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
                              setSupplierToDelete({
                                ...supplier,
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

      {/* Add Supplier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Enter the supplier details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Supplier Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={newSupplier.name}
                onChange={handleInputChange}
                placeholder="Enter supplier name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                name="contact_person"
                value={newSupplier.contact_person}
                onChange={handleInputChange}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={newSupplier.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newSupplier.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={newSupplier.address}
                onChange={handleInputChange}
                placeholder="Enter address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Supplier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update the supplier details below
            </DialogDescription>
          </DialogHeader>
          {editingSupplier && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Supplier Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editingSupplier.name}
                  onChange={handleEditInputChange}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact_person">Contact Person</Label>
                <Input
                  id="edit-contact_person"
                  name="contact_person"
                  value={editingSupplier.contact_person || ""}
                  onChange={handleEditInputChange}
                  placeholder="Enter contact person name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={editingSupplier.phone || ""}
                  onChange={handleEditInputChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editingSupplier.email || ""}
                  onChange={handleEditInputChange}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  name="address"
                  value={editingSupplier.address || ""}
                  onChange={handleEditInputChange}
                  placeholder="Enter address"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSupplier} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Supplier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this supplier? This action cannot be
              undone. Suppliers that have orders cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          {supplierToDelete && (
            <div className="py-4">
              <div className="flex items-center space-x-3 mb-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">{supplierToDelete.name}</p>
              </div>
              {supplierToDelete.contact_person && (
                <div className="flex items-center space-x-3 mb-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p>{supplierToDelete.contact_person}</p>
                </div>
              )}
              {supplierToDelete.phone && (
                <div className="flex items-center space-x-3 mb-2">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <p>{supplierToDelete.phone}</p>
                </div>
              )}
              {supplierToDelete.email && (
                <div className="flex items-center space-x-3 mb-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <p>{supplierToDelete.email}</p>
                </div>
              )}
              {supplierToDelete.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <p>{supplierToDelete.address}</p>
                </div>
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
              onClick={handleDeleteSupplier}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Supplier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
