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
  Loader2,
  Search,
  Pencil,
  Trash2,
  FolderPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
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

interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCategory, setNewCategory] = useState({
    name: "",
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCategory({
      ...newCategory,
      [name]: value,
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingCategory) {
      setEditingCategory({
        ...editingCategory,
        [name]: value,
      });
    }
  };

  const handleAddCategory = async () => {
    // Validate required fields
    if (!newCategory.name) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSaving(true);
      await addCategory(newCategory);
      toast.success("Category added successfully");

      // Reset form
      setNewCategory({
        name: "",
      });

      // Close dialog
      setShowAddDialog(false);

      // Refresh categories list
      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;

    // Validate required fields
    if (!editingCategory.name) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSaving(true);
      
      // Create a clean object with only the fields we want to update
      const categoryDataToUpdate = {
        name: editingCategory.name || "",
      };

      await updateCategory(editingCategory.id, categoryDataToUpdate);
      toast.success("Category updated successfully");

      // Close dialog
      setShowEditDialog(false);
      
      // Refresh categories list
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setIsSaving(true);
      await deleteCategory(categoryToDelete.id);
      toast.success("Category deleted successfully");

      // Close dialog
      setShowDeleteDialog(false);

      // Refresh categories list
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      
      // Check if it's our custom error about products using the category
      if (error.message && error.message.includes("Cannot delete category because it's used by")) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete category");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 space-y-6 pb-16">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Category Management
          </h1>
          <p className="text-muted-foreground">
            Add, edit, and manage your product categories
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Manage your product categories</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "No categories match your search"
                : "No categories found"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory({
                                ...category,
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
                              setCategoryToDelete({
                                ...category,
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

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Enter the category name below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={newCategory.name}
                onChange={handleInputChange}
                placeholder="Enter category name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name below
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editingCategory.name}
                  onChange={handleEditInputChange}
                  placeholder="Enter category name"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be
              undone. Categories that are in use by products cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          {categoryToDelete && (
            <div className="py-4">
              <p className="font-medium">{categoryToDelete.name}</p>
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
              onClick={handleDeleteCategory}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
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
