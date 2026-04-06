import { useState, useMemo } from "react";
import { Plus, Trash2, Package, Pencil, Sparkles, Search, ChevronLeft, ChevronRight, AlertTriangle, Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { usePOS, type MenuItem, type ModifierGroup } from "@/contexts/POSContext";
import { POS_MENU_CATEGORIES } from "@/lib/pos-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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

const PAGE_SIZE = 15;
const LOW_STOCK_THRESHOLD = 10;
const DEFAULT_STOCK = 50;

const ALL_FILTER_CATEGORIES = ['ALL', ...POS_MENU_CATEGORIES] as const;

type AxisSort = 'default' | 'asc' | 'desc';

const AXIS_SORT_ITEMS: { value: AxisSort; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'asc', label: 'Low → high' },
  { value: 'desc', label: 'High → low' },
];
const UNIT_OPTIONS = ['cup', 'piece', 'bowl', 'plate', 'box', 'serving'] as const;

type UnitType = typeof UNIT_OPTIONS[number];

interface AddForm {
  name: string;
  sku: string;
  price: string;
  costPrice: string;
  category: string;
  unit: UnitType | '';
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  tags: string;
}

interface EditForm {
  id: string;
  isCustom: boolean;
  name: string;
  sku: string;
  price: string;
  costPrice: string;
  category: string;
  unit: UnitType | '';
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  tags: string;
  stock: string;
}

const emptyAdd = (): AddForm => ({
  name: '', sku: '', price: '', costPrice: '', category: '', unit: '',
  description: '', imageUrl: '', isAvailable: true, tags: '',
});

const AdminInventory = () => {
  const {
    menuItems, customItemIds,
    updateMenuItem, deleteMenuItem, addCustomMenuItem,
    stockLevels, updateStock,
    setAvailabilityOverride, setCostOverride,
    setModifierGroups,
  } = usePOS();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockSort, setStockSort] = useState<AxisSort>("default");
  const [priceSort, setPriceSort] = useState<AxisSort>("default");
  const [costSort, setCostSort] = useState<AxisSort>("default");
  const [page, setPage] = useState(1);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(emptyAdd);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  // Modifier editor
  const [modEditorItem, setModEditorItem] = useState<MenuItem | null>(null);
  const [modEditorGroups, setModEditorGroups] = useState<ModifierGroup[]>([]);

  const openModEditor = (item: MenuItem) => {
    setModEditorItem(item);
    setModEditorGroups(item.modifierGroups ? JSON.parse(JSON.stringify(item.modifierGroups)) : []);
  };

  const newGroupId = () => `grp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const newOptionId = () => `opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  const addModGroup = () => {
    setModEditorGroups((prev) => [
      ...prev,
      { id: newGroupId(), name: 'New Group', required: false, multiSelect: false, options: [] },
    ]);
  };

  const removeModGroup = (gid: string) =>
    setModEditorGroups((prev) => prev.filter((g) => g.id !== gid));

  const updateModGroup = (gid: string, patch: Partial<Omit<ModifierGroup, 'id' | 'options'>>) =>
    setModEditorGroups((prev) => prev.map((g) => g.id === gid ? { ...g, ...patch } : g));

  const addModOption = (gid: string) =>
    setModEditorGroups((prev) =>
      prev.map((g) =>
        g.id === gid
          ? { ...g, options: [...g.options, { id: newOptionId(), name: 'Option', price: 0 }] }
          : g
      )
    );

  const removeModOption = (gid: string, oid: string) =>
    setModEditorGroups((prev) =>
      prev.map((g) => g.id === gid ? { ...g, options: g.options.filter((o) => o.id !== oid) } : g)
    );

  const updateModOption = (gid: string, oid: string, patch: { name?: string; price?: number }) =>
    setModEditorGroups((prev) =>
      prev.map((g) =>
        g.id === gid
          ? { ...g, options: g.options.map((o) => o.id === oid ? { ...o, ...patch } : o) }
          : g
      )
    );

  const saveModEditor = () => {
    if (!modEditorItem) return;
    setModifierGroups(modEditorItem.id, modEditorGroups);
    setModEditorItem(null);
  };

  const getStock = (id: string) => stockLevels[id] ?? DEFAULT_STOCK;

  // Auto-suggest SKU when name changes in add form
  const handleAddNameChange = (name: string) => {
    setAddForm((prev) => ({
      ...prev,
      name,
      sku: prev.sku || `CST-${Date.now().toString().slice(-6)}`,
    }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.price.trim()) return;
    addCustomMenuItem({
      name: addForm.name.trim(),
      sku: addForm.sku.trim() || `CST-${Date.now()}`,
      price: parseFloat(addForm.price) || 0,
      costPrice: addForm.costPrice ? parseFloat(addForm.costPrice) : undefined,
      category: addForm.category.trim(),
      unit: (addForm.unit as UnitType) || undefined,
      description: addForm.description.trim(),
      imageUrl: addForm.imageUrl.trim() || undefined,
      isAvailable: addForm.isAvailable,
      tags: addForm.tags ? addForm.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    });
    setAddForm(emptyAdd());
    setAddOpen(false);
  };

  const handleEditOpen = (item: MenuItem) => {
    setEditForm({
      id: item.id,
      isCustom: customItemIds.has(item.id),
      name: item.name,
      sku: item.sku ?? '',
      price: String(item.price),
      costPrice: item.costPrice != null ? String(item.costPrice) : '',
      category: item.category,
      unit: (item.unit as UnitType) ?? '',
      description: item.description,
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable ?? true,
      tags: item.tags?.join(', ') ?? '',
      stock: String(getStock(item.id)),
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    if (editForm.isCustom) {
      updateMenuItem(editForm.id, {
        name: editForm.name.trim(),
        sku: editForm.sku.trim(),
        price: parseFloat(editForm.price) || 0,
        costPrice: editForm.costPrice ? parseFloat(editForm.costPrice) : undefined,
        category: editForm.category.trim(),
        unit: (editForm.unit as UnitType) || undefined,
        description: editForm.description.trim(),
        imageUrl: editForm.imageUrl.trim() || undefined,
        isAvailable: editForm.isAvailable,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      });
    } else {
      // Base items: only persist availability and cost override
      setAvailabilityOverride(editForm.id, editForm.isAvailable);
      if (editForm.costPrice) setCostOverride(editForm.id, parseFloat(editForm.costPrice));
    }
    updateStock(editForm.id, parseInt(editForm.stock) || 0);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    if (!customItemIds.has(id)) {
      alert("Base menu items cannot be deleted. Use the availability toggle to hide them from POS.");
      return;
    }
    if (confirm("Remove this custom item from the menu?")) deleteMenuItem(id);
  };

  const handleToggleAvailability = (item: MenuItem) => {
    if (customItemIds.has(item.id)) {
      updateMenuItem(item.id, { isAvailable: !item.isAvailable });
    } else {
      setAvailabilityOverride(item.id, !item.isAvailable);
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    const list = menuItems.filter((item) => {
      const matchCat = categoryFilter === "ALL" || item.category === categoryFilter;
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    const stockOf = (id: string) => stockLevels[id] ?? DEFAULT_STOCK;

    const sorted = [...list];
    const primary =
      stockSort !== 'default' ? { kind: 'stock' as const, dir: stockSort } :
      priceSort !== 'default' ? { kind: 'price' as const, dir: priceSort } :
      costSort !== 'default' ? { kind: 'cost' as const, dir: costSort } :
      null;

    if (!primary) return sorted;

    const dir = primary.dir === 'asc' ? 1 : -1;
    if (primary.kind === 'stock') {
      sorted.sort((a, b) => dir * (stockOf(a.id) - stockOf(b.id)));
    } else if (primary.kind === 'price') {
      sorted.sort((a, b) => dir * (a.price - b.price));
    } else {
      sorted.sort((a, b) => {
        const ca = a.costPrice;
        const cb = b.costPrice;
        if (ca == null && cb == null) return 0;
        if (ca == null) return 1;
        if (cb == null) return -1;
        return dir * (ca - cb);
      });
    }
    return sorted;
  }, [menuItems, search, categoryFilter, stockSort, priceSort, costSort, stockLevels]);

  const lowStockItems = useMemo(
    () => menuItems.filter((item) => getStock(item.id) < LOW_STOCK_THRESHOLD),
    [menuItems, stockLevels]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCategoryChange = (cat: string) => { setCategoryFilter(cat); setPage(1); };
  const handleSearchChange = (val: string) => { setSearch(val); setPage(1); };

  const handleStockSortChange = (v: AxisSort) => {
    setStockSort(v);
    if (v !== 'default') {
      setPriceSort('default');
      setCostSort('default');
    }
    setPage(1);
  };
  const handlePriceSortChange = (v: AxisSort) => {
    setPriceSort(v);
    if (v !== 'default') {
      setStockSort('default');
      setCostSort('default');
    }
    setPage(1);
  };
  const handleCostSortChange = (v: AxisSort) => {
    setCostSort(v);
    if (v !== 'default') {
      setStockSort('default');
      setPriceSort('default');
    }
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Manage POS menu items and stock levels.
            </p>
          </div>
          <Button onClick={() => { setAddForm(emptyAdd()); setAddOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-destructive text-base">
                <AlertTriangle className="h-4 w-4" />
                Low Stock — {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below {LOW_STOCK_THRESHOLD} units
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <Badge key={item.id} variant="destructive" className="gap-1">
                    {item.name} — {getStock(item.id)} left
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* POS Menu Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              POS Menu Items
              <span className="ml-auto text-sm font-normal text-muted-foreground">{filteredItems.length} items</span>
            </CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Custom</span> items are device-local. Toggle availability to hide items from POS without deleting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search + filters (one row on large screens) */}
            <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end xl:gap-x-3 xl:gap-y-3">
              <div className="min-w-0 flex-1 space-y-1.5 xl:min-w-[200px] xl:max-w-md">
                <Label htmlFor="inv-search" className="text-xs font-display text-muted-foreground tracking-wider">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="inv-search"
                    placeholder="Search name, SKU..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:contents">
                <div className="space-y-1.5 min-w-0 sm:min-w-[140px]">
                  <Label className="text-xs font-display text-muted-foreground tracking-wider">Category</Label>
                  <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-full font-display text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_FILTER_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-0 sm:min-w-[140px]">
                  <Label className="text-xs font-display text-muted-foreground tracking-wider">Stock</Label>
                  <Select value={stockSort} onValueChange={(v) => handleStockSortChange(v as AxisSort)}>
                    <SelectTrigger className="w-full font-display text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AXIS_SORT_ITEMS.map((opt) => (
                        <SelectItem key={`stock-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-0 sm:min-w-[140px]">
                  <Label className="text-xs font-display text-muted-foreground tracking-wider">Price</Label>
                  <Select value={priceSort} onValueChange={(v) => handlePriceSortChange(v as AxisSort)}>
                    <SelectTrigger className="w-full font-display text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AXIS_SORT_ITEMS.map((opt) => (
                        <SelectItem key={`price-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-0 sm:min-w-[140px]">
                  <Label className="text-xs font-display text-muted-foreground tracking-wider">Cost</Label>
                  <Select value={costSort} onValueChange={(v) => handleCostSortChange(v as AxisSort)}>
                    <SelectTrigger className="w-full font-display text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AXIS_SORT_ITEMS.map((opt) => (
                        <SelectItem key={`cost-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Avail.</TableHead>
                    <TableHead className="w-[110px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No items found.</TableCell>
                    </TableRow>
                  ) : (
                    pagedItems.map((item) => {
                      const stock = getStock(item.id);
                      const isLow = stock < LOW_STOCK_THRESHOLD;
                      const margin = item.costPrice ? Math.round(((item.price - item.costPrice) / item.price) * 100) : null;
                      return (
                        <TableRow key={item.id} className={!item.isAvailable ? "opacity-50" : isLow ? "bg-destructive/5" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {item.name}
                              {customItemIds.has(item.id) && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1 shrink-0">
                                  <Sparkles className="h-2.5 w-2.5" />Custom
                                </Badge>
                              )}
                            </div>
                            {item.unit && <span className="text-[11px] text-muted-foreground">per {item.unit}</span>}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{item.category}</TableCell>
                          <TableCell className="text-right text-primary font-display font-bold">₱{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {item.costPrice != null ? (
                              <span>₱{item.costPrice.toFixed(0)}
                                {margin != null && <span className="ml-1 text-green-600 dark:text-green-400 text-[10px]">{margin}%</span>}
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            <span className={isLow ? "text-destructive font-bold" : ""}>
                              {stock}{isLow && <AlertTriangle className="inline ml-1 h-3 w-3 text-destructive" />}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleToggleAvailability(item)}
                              className="inline-flex items-center justify-center hover:opacity-80 transition-opacity"
                              title={item.isAvailable ? "Click to hide from POS" : "Click to show in POS"}
                            >
                              {item.isAvailable
                                ? <Eye className="h-4 w-4 text-green-500" />
                                : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Manage modifiers"
                              onClick={() => openModEditor(item)}
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditOpen(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`e-${i}`} className="px-1">…</span>
                    ) : (
                      <Button key={p} variant={page === p ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setPage(p as number)}>
                        {p}
                      </Button>
                    )
                  )}
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Add Custom Item Modal ─────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add Custom POS Item
            </DialogTitle>
            <DialogDescription>
              This item will be saved on this device only and marked as Custom.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="a-name">Name *</Label>
                <Input id="a-name" placeholder="e.g. Ube Latte" value={addForm.name} onChange={(e) => handleAddNameChange(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-sku">SKU</Label>
                <Input id="a-sku" placeholder="e.g. CST-001" value={addForm.sku} onChange={(e) => setAddForm(p => ({ ...p, sku: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-category">Category</Label>
                <Select value={addForm.category || undefined} onValueChange={(v) => setAddForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger id="a-category"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {POS_MENU_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-price">Price (₱) *</Label>
                <Input id="a-price" type="number" min="0" step="0.01" placeholder="180" value={addForm.price} onChange={(e) => setAddForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-cost">Cost Price (₱)</Label>
                <Input id="a-cost" type="number" min="0" step="0.01" placeholder="65" value={addForm.costPrice} onChange={(e) => setAddForm(p => ({ ...p, costPrice: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-unit">Unit</Label>
                <Select value={addForm.unit || undefined} onValueChange={(v) => setAddForm(p => ({ ...p, unit: v as UnitType }))}>
                  <SelectTrigger id="a-unit"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-tags">Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
                <Input id="a-tags" placeholder="hot, cold, vegan" value={addForm.tags} onChange={(e) => setAddForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="a-desc">Description</Label>
                <Textarea id="a-desc" placeholder="Short product description" rows={2} value={addForm.description} onChange={(e) => setAddForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="a-img">Image URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="a-img" placeholder="https://..." value={addForm.imageUrl} onChange={(e) => setAddForm(p => ({ ...p, imageUrl: e.target.value }))} />
              </div>
              <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Available in POS</p>
                  <p className="text-xs text-muted-foreground">Toggle off to hide from the POS menu grid</p>
                </div>
                <Switch checked={addForm.isAvailable} onCheckedChange={(v) => setAddForm(p => ({ ...p, isAvailable: v }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add to POS</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Item Modal ───────────────────────────────────────── */}
      <Dialog open={!!editForm} onOpenChange={(open) => !open && setEditForm(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              {editForm?.isCustom
                ? "Full edit for this custom item."
                : "Base item — only availability, cost price, and stock can be changed here."}
            </DialogDescription>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
              {editForm.isCustom ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 grid gap-2">
                    <Label>Name *</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm(p => p && { ...p, name: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>SKU</Label>
                    <Input value={editForm.sku} onChange={(e) => setEditForm(p => p && { ...p, sku: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={editForm.category || undefined} onValueChange={(v) => setEditForm(p => p ? { ...p, category: v } : null)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{POS_MENU_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Price (₱) *</Label>
                    <Input type="number" min="0" step="0.01" value={editForm.price} onChange={(e) => setEditForm(p => p && { ...p, price: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Cost Price (₱)</Label>
                    <Input type="number" min="0" step="0.01" value={editForm.costPrice} onChange={(e) => setEditForm(p => p && { ...p, costPrice: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Unit</Label>
                    <Select value={editForm.unit || undefined} onValueChange={(v) => setEditForm(p => p ? { ...p, unit: v as UnitType } : null)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{UNIT_OPTIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
                    <Input value={editForm.tags} onChange={(e) => setEditForm(p => p && { ...p, tags: e.target.value })} />
                  </div>
                  <div className="col-span-2 grid gap-2">
                    <Label>Description</Label>
                    <Textarea rows={2} value={editForm.description} onChange={(e) => setEditForm(p => p ? { ...p, description: e.target.value } : null)} />
                  </div>
                  <div className="col-span-2 grid gap-2">
                    <Label>Image URL</Label>
                    <Input value={editForm.imageUrl} onChange={(e) => setEditForm(p => p && { ...p, imageUrl: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 p-3 bg-muted/40 rounded-lg">
                    <p className="font-medium text-sm">{editForm.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{editForm.sku}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Cost Price (₱)</Label>
                    <Input type="number" min="0" step="0.01" placeholder="65" value={editForm.costPrice} onChange={(e) => setEditForm(p => p && { ...p, costPrice: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Stock on Hand</Label>
                    <Input type="number" min="0" value={editForm.stock} onChange={(e) => setEditForm(p => p && { ...p, stock: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Stock (always editable) — only show separately for custom items */}
              {editForm.isCustom && (
                <div className="grid gap-2">
                  <Label>Stock on Hand</Label>
                  <Input type="number" min="0" value={editForm.stock} onChange={(e) => setEditForm(p => p && { ...p, stock: e.target.value })} />
                </div>
              )}

              {/* Availability toggle (always) */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Available in POS</p>
                  <p className="text-xs text-muted-foreground">Toggle off to hide from the POS menu grid</p>
                </div>
                <Switch checked={editForm.isAvailable} onCheckedChange={(v) => setEditForm(p => p && { ...p, isAvailable: v })} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditForm(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* ─── Modifier Editor Dialog ────────────────────────────────── */}
      <Dialog open={!!modEditorItem} onOpenChange={(open) => !open && setModEditorItem(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Modifiers — {modEditorItem?.name}
            </DialogTitle>
            <DialogDescription>
              Add option groups (Size, Temperature, Add-ons…). When a customer taps this item,
              they'll be prompted to choose before it's added to the cart.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 [scrollbar-width:thin]">
            {modEditorGroups.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No modifier groups yet. Click "Add Group" to get started.
              </p>
            )}
            {modEditorGroups.map((group, gi) => (
              <div key={group.id} className="border-2 border-border rounded-lg p-4 space-y-3">
                {/* Group header */}
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 font-display font-semibold text-sm h-9"
                    value={group.name}
                    placeholder="Group name (e.g. Size)"
                    onChange={(e) => updateModGroup(group.id, { name: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive shrink-0"
                    onClick={() => removeModGroup(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Group flags */}
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Switch
                      checked={group.required}
                      onCheckedChange={(v) => updateModGroup(group.id, { required: v })}
                      className="scale-90"
                    />
                    <span className="text-muted-foreground">Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Switch
                      checked={group.multiSelect}
                      onCheckedChange={(v) => updateModGroup(group.id, { multiSelect: v })}
                      className="scale-90"
                    />
                    <span className="text-muted-foreground">Multi-select</span>
                  </label>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {group.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <Input
                        className="flex-1 h-8 text-sm"
                        placeholder="Option name (e.g. Large)"
                        value={opt.name}
                        onChange={(e) => updateModOption(group.id, opt.id, { name: e.target.value })}
                      />
                      <div className="relative w-28 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">+₱</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="pl-7 h-8 text-sm"
                          value={opt.price}
                          onChange={(e) =>
                            updateModOption(group.id, opt.id, { price: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeModOption(group.id, opt.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs font-display tracking-wider"
                    onClick={() => addModOption(group.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Option
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="w-full mb-3 font-display tracking-wider"
              onClick={addModGroup}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Group
            </Button>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setModEditorItem(null)}>Cancel</Button>
              <Button type="button" onClick={saveModEditor}>Save Modifiers</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInventory;
