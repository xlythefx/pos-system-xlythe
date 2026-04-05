import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Package, Pencil } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { usePOS } from "@/contexts/POSContext";
import { DRINK_SUB_CATEGORIES, MAIN_CATEGORIES, POS_MENU_CATEGORIES } from "@/lib/pos-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STORAGE_KEY = "divine-inventory-products";

export interface InventoryProduct {
  id: string;
  name: string;
  price: string;
  quantity: number;
  category: string;
  sku?: string;
}

const loadProducts = (): InventoryProduct[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveProducts = (products: InventoryProduct[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

const AdminInventory = () => {
  const { menuItems, updateMenuItem, deleteMenuItem } = usePOS();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [editProduct, setEditProduct] = useState<{
    id: string;
    name: string;
    price: string;
    description: string;
    category: string;
  } | null>(null);

  useEffect(() => {
    setProducts(loadProducts());
  }, []);

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;

    const newProduct: InventoryProduct = {
      id: crypto.randomUUID(),
      name: name.trim(),
      price: price.trim(),
      quantity: Math.max(0, quantity),
      category: category.trim(),
      sku: sku.trim() || undefined,
    };

    const updated = [...products, newProduct];
    setProducts(updated);
    saveProducts(updated);

    setName("");
    setPrice("");
    setQuantity(1);
    setCategory("");
    setSku("");
  };

  const removeProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveProducts(updated);
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p
    );
    setProducts(updated);
    saveProducts(updated);
  };

  const handleEditPosProduct = (item: { id: string; name: string; price: number; description: string; category: string }) => {
    setEditProduct({
      id: item.id,
      name: item.name,
      price: String(item.price),
      description: item.description,
      category: item.category,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct?.name.trim() || !editProduct?.price.trim()) return;
    updateMenuItem(editProduct.id, {
      name: editProduct.name.trim(),
      price: parseFloat(editProduct.price) || 0,
      description: editProduct.description.trim(),
      category: editProduct.category.trim(),
    });
    setEditProduct(null);
  };

  const handleDeletePosProduct = (id: string) => {
    if (confirm("Remove this item from the menu? This cannot be undone.")) {
      deleteMenuItem(id);
    }
  };

  const posProductsByCategory = useMemo(() => {
    const groups: Record<string, typeof menuItems> = {};
    for (const item of menuItems) {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    const mainCats = MAIN_CATEGORIES.filter((c) => c !== "ALL");
    const drinkSubs = [...DRINK_SUB_CATEGORIES];
    const result: { label: string; items: typeof menuItems }[] = [];
    for (const sub of drinkSubs) {
      if (groups[sub]) {
        result.push({ label: sub, items: groups[sub] });
      }
    }
    for (const main of mainCats) {
      if (main === "DRINKS") continue;
      if (groups[main]) {
        result.push({ label: main, items: groups[main] });
      }
    }
    return result;
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your menu items and stock levels. Data is saved on this device.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Product Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Product
              </CardTitle>
              <CardDescription>
                Create new menu items for your Point of Sale.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addProduct} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Biscoff Coffee"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      placeholder="₱180.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={0}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category || undefined} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {POS_MENU_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sku">SKU <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="sku"
                      placeholder="e.g. BSC-001"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Product List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Products ({products.length})
              </CardTitle>
              <CardDescription>
                Your custom inventory items. Changes apply to this device only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items yet. Add your first product using the form on the left.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>₱{p.price}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(p.id, -1)}
                              >
                                −
                              </Button>
                              <span className="min-w-[2ch]">{p.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(p.id, 1)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.category || "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeProduct(p.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Products Available (POS Menu) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              POS Menu Items
            </CardTitle>
            <CardDescription>
              Edit and manage items that appear on your Point of Sale, organized by category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {posProductsByCategory.map(({ label, items }) => (
                <div key={label}>
                  <h3 className="text-primary font-display text-sm tracking-wider mb-4 pb-2 border-b border-border">
                    {label}
                  </h3>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="w-[90px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.description}
                            </TableCell>
                            <TableCell className="text-right text-primary font-display">
                              ₱{item.price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditPosProduct(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeletePosProduct(item.id)}
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Changes will update this item across your Point of Sale.
            </DialogDescription>
          </DialogHeader>
          {editProduct && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editProduct.name}
                  onChange={(e) =>
                    setEditProduct((p) => p && { ...p, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  value={editProduct.price}
                  onChange={(e) =>
                    setEditProduct((p) => p && { ...p, price: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editProduct.description}
                  onChange={(e) =>
                    setEditProduct((p) =>
                      p ? { ...p, description: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editProduct.category || undefined}
                  onValueChange={(value) =>
                    setEditProduct((p) => (p ? { ...p, category: value } : null))
                  }
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {POS_MENU_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditProduct(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInventory;
