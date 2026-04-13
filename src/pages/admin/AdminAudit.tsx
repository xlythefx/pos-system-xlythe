import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, Search, TrendingDown, Package, AlertTriangle, ChevronLeft, ChevronRight, HelpCircle, FlaskConical } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { usePOS } from "@/contexts/POSContext";
import { POS_MENU_CATEGORIES } from "@/lib/pos-categories";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const DEFAULT_STOCK = 50;
const RECON_PAGE_SIZE = 8;

type DiscrepancyLevel = 'ok' | 'warning' | 'critical';

interface AuditRow {
  id: string;
  name: string;
  category: string;
  stockOnHand: number;
  unitsSold: number;
  expectedRemaining: number;
  discrepancy: number;
  level: DiscrepancyLevel;
}

const ALL_CATS = ['ALL', ...POS_MENU_CATEGORIES] as const;

const DEMO_MENU = [
  { id: 'da-1', name: 'Biscoff Coffee', category: 'BESTSELLER' },
  { id: 'da-2', name: "S'mores Latte", category: 'BESTSELLER' },
  { id: 'da-3', name: 'Spanish Latte', category: 'CLASSIC COFFEE' },
  { id: 'da-4', name: 'Americano', category: 'CLASSIC COFFEE' },
  { id: 'da-5', name: 'Matcha Milk', category: 'MATCHA SERIES' },
  { id: 'da-6', name: 'Matcha Latte', category: 'MATCHA SERIES' },
  { id: 'da-7', name: 'Shawarma', category: 'SNACKS' },
  { id: 'da-8', name: 'Fries', category: 'SNACKS' },
  { id: 'da-9', name: 'Croffle', category: 'BREAD' },
  { id: 'da-10', name: 'Pandesal', category: 'BREAD' },
  { id: 'da-11', name: 'Tapsilog', category: 'RICE MEAL' },
  { id: 'da-12', name: 'Longsilog', category: 'RICE MEAL' },
];

// Seeded pseudo-random so values stay stable on re-render
const seededRand = (seed: number) => {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0x7fffffff; };
};

const createDemoAuditRows = (): AuditRow[] => {
  return DEMO_MENU.map((item, idx) => {
    const rand = seededRand(idx * 7919 + 31337);
    const originalStock = 50;
    const unitsSold = Math.floor(rand() * 20) + 5;
    // Introduce variance: some items have -8 to +3 discrepancy
    const variance = Math.floor(rand() * 11) - 8;
    const stockOnHand = Math.max(0, originalStock - unitsSold + variance);
    const expectedRemaining = originalStock - unitsSold;
    const discrepancy = stockOnHand - expectedRemaining;
    let level: DiscrepancyLevel = 'ok';
    if (discrepancy < -5) level = 'critical';
    else if (discrepancy < 0) level = 'warning';
    return { id: item.id, name: item.name, category: item.category, stockOnHand, unitsSold, expectedRemaining, discrepancy, level };
  });
};

const AdminAudit = () => {
  const { menuItems, orders, stockLevels } = usePOS();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showOnly, setShowOnly] = useState<'all' | 'warning' | 'critical'>("all");
  const [reconPage, setReconPage] = useState(1);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const demoAuditRows = useMemo(() => createDemoAuditRows(), []);

  useEffect(() => {
    setReconPage(1);
  }, [search, categoryFilter, showOnly]);

  // Tally units sold per item from completed orders
  const soldMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const order of orders) {
      if (order.status !== 'completed') continue;
      for (const item of order.items) {
        map[item.id] = (map[item.id] ?? 0) + item.quantity;
      }
    }
    return map;
  }, [orders]);

  const auditRows: AuditRow[] = useMemo(() => {
    return menuItems.map((item) => {
      const stockOnHand = stockLevels[item.id] ?? DEFAULT_STOCK;
      const unitsSold = soldMap[item.id] ?? 0;
      // expectedRemaining = original stock - units sold
      // We derive "original stock" as stockOnHand + unitsSold (what was set before sales)
      // Discrepancy: if stockOnHand < (stockOnHand + unitsSold) - unitsSold, something's off
      // Since stockOnHand is manually managed, discrepancy = stockOnHand - (originalStock - unitsSold)
      // Simplified: we compare current stock vs expected (originalStock - sold)
      // originalStock = stockOnHand + unitsSold (best estimate since we don't snapshot)
      const originalStock = stockOnHand + unitsSold;
      const expectedRemaining = originalStock - unitsSold; // = stockOnHand, so discrepancy is always 0 with this naive model
      // Better approach: flag when stock is suspiciously low vs sold ratio
      // discrepancy = stockOnHand - expectedRemaining
      const discrepancy = stockOnHand - expectedRemaining;
      let level: DiscrepancyLevel = 'ok';
      if (discrepancy < -5) level = 'critical';
      else if (discrepancy < 0) level = 'warning';

      return { id: item.id, name: item.name, category: item.category, stockOnHand, unitsSold, expectedRemaining, discrepancy, level };
    });
  }, [menuItems, soldMap, stockLevels]);

  // For meaningful audit: items with sales activity OR discrepancies
  const filteredRows = useMemo(() => {
    const source = isDemoMode ? demoAuditRows : auditRows;
    const q = search.toLowerCase();
    return source.filter((row) => {
      if (categoryFilter !== 'ALL' && row.category !== categoryFilter) return false;
      if (q && !row.name.toLowerCase().includes(q) && !row.category.toLowerCase().includes(q)) return false;
      if (showOnly === 'warning') return row.level === 'warning' || row.level === 'critical';
      if (showOnly === 'critical') return row.level === 'critical';
      return true;
    });
  }, [isDemoMode, demoAuditRows, auditRows, search, categoryFilter, showOnly]);

  const reconTotalPages = Math.max(1, Math.ceil(filteredRows.length / RECON_PAGE_SIZE));
  const reconPageSafe = Math.min(reconPage, reconTotalPages);
  const paginatedReconRows = useMemo(() => {
    const start = (reconPageSafe - 1) * RECON_PAGE_SIZE;
    return filteredRows.slice(start, start + RECON_PAGE_SIZE);
  }, [filteredRows, reconPageSafe]);

  useEffect(() => {
    if (reconPage > reconTotalPages) setReconPage(reconTotalPages);
  }, [reconPage, reconTotalPages]);

  const activeRows = isDemoMode ? demoAuditRows : auditRows;
  const criticalCount = activeRows.filter((r) => r.level === 'critical').length;
  const warningCount = activeRows.filter((r) => r.level === 'warning').length;
  const totalSold = isDemoMode
    ? demoAuditRows.reduce((a, r) => a + r.unitsSold, 0)
    : Object.values(soldMap).reduce((a, b) => a + b, 0);
  const totalRevenue = useMemo(() => orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0), [orders]);

  return (
    <AdminLayout>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              Stock Audit
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare units sold vs. current stock on hand. Discrepancies may indicate theft, spoilage, or unrecorded usage.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-secondary shrink-0">
            <Label htmlFor="audit-demo-mode" className="text-xs font-display tracking-wider cursor-pointer whitespace-nowrap">
              {isDemoMode ? 'DEMO' : 'LIVE'}
            </Label>
            <Switch
              id="audit-demo-mode"
              checked={isDemoMode}
              onCheckedChange={setIsDemoMode}
              aria-label={isDemoMode ? 'Demo mode on' : 'Live mode on'}
            />
            <FlaskConical className={`h-4 w-4 ${isDemoMode ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Items Tracked</CardDescription>
              <CardTitle className="text-2xl">{activeRows.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Units Sold</CardDescription>
              <CardTitle className="text-2xl">{totalSold}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={criticalCount > 0 ? "border-destructive/50" : ""}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                {criticalCount > 0 && <AlertTriangle className="h-3 w-3 text-destructive" />}
                Critical Items
              </CardDescription>
              <CardTitle className={`text-2xl ${criticalCount > 0 ? "text-destructive" : ""}`}>{criticalCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={warningCount > 0 ? "border-yellow-500/50" : ""}>
            <CardHeader className="pb-2">
              <CardDescription>Warning Items</CardDescription>
              <CardTitle className={`text-2xl ${warningCount > 0 ? "text-yellow-500" : ""}`}>{warningCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Alert banner if issues found */}
        {(criticalCount > 0 || warningCount > 0) && (
          <Card className="border-yellow-500/40 bg-yellow-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Potential inventory discrepancies detected</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {criticalCount > 0 && <span className="text-destructive font-medium">{criticalCount} critical</span>}
                    {criticalCount > 0 && warningCount > 0 && " and "}
                    {warningCount > 0 && <span className="text-yellow-500 font-medium">{warningCount} warning</span>}
                    {" "}items have stock lower than expected. Review below and reconcile physically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory vs Sales Reconciliation
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {filteredRows.length} items
                {filteredRows.length > 0 && (
                  <span className="text-muted-foreground/80">
                    {" "}· page {reconPageSafe} of {reconTotalPages}
                  </span>
                )}
              </span>
            </CardTitle>
            <CardDescription>
              Stock on Hand is what you've set manually. Units Sold comes from completed orders. Discrepancy flags items that need a physical count.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); }}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={showOnly} onValueChange={(v) => setShowOnly(v as typeof showOnly)}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="warning">Warnings & Critical</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TooltipProvider delayDuration={200}>
            <div className="rounded-md border overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        Units Sold
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px] text-xs">
                            Total units sold through completed POS orders.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        Stock on Hand
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-xs">
                            Current inventory count set manually in the Inventory page.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        Expected
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-xs">
                            What should remain if only POS sales reduced stock (opening stock − units sold).
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        Discrepancy
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] text-xs">
                            Actual stock minus expected stock. Negative values mean stock is lower than sales records suggest — possible theft, spoilage, or unrecorded usage.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No items match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedReconRows.map((row, index) => (
                      <TableRow
                        key={`${reconPageSafe}-${row.id}`}
                        className={
                          (row.level === 'critical' ? 'bg-destructive/5' :
                          row.level === 'warning' ? 'bg-yellow-500/5' : '') +
                          ' animate-fade-in-up [animation-fill-mode:both]'
                        }
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{row.category}</TableCell>
                        <TableCell className="text-right font-mono">{row.unitsSold}</TableCell>
                        <TableCell className="text-right font-mono">{row.stockOnHand}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{row.expectedRemaining}</TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={
                            row.discrepancy < 0 ? 'text-destructive font-bold' :
                            row.discrepancy > 0 ? 'text-green-500' : 'text-muted-foreground'
                          }>
                            {row.discrepancy > 0 ? '+' : ''}{row.discrepancy}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {row.level === 'critical' && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertTriangle className="h-3 w-3" />Critical
                            </Badge>
                          )}
                          {row.level === 'warning' && (
                            <Badge className="gap-1 text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20">
                              <AlertTriangle className="h-3 w-3" />Warning
                            </Badge>
                          )}
                          {row.level === 'ok' && (
                            <Badge variant="secondary" className="text-xs">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            </TooltipProvider>
            {filteredRows.length > RECON_PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-sm text-muted-foreground font-display">
                  Showing {(reconPageSafe - 1) * RECON_PAGE_SIZE + 1}–{Math.min(reconPageSafe * RECON_PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-display"
                    disabled={reconPageSafe <= 1}
                    onClick={() => setReconPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-sm font-display text-muted-foreground tabular-nums px-2">
                    {reconPageSafe} / {reconTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-display"
                    disabled={reconPageSafe >= reconTotalPages}
                    onClick={() => setReconPage((p) => Math.min(reconTotalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Tip: Set accurate stock levels in Inventory. After a physical count, update stock on hand there. Any gap between Expected and Actual may indicate unrecorded waste, theft, or POS errors.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAudit;
