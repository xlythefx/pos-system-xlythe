import { useState, useMemo } from 'react';
import {
  TrendingUp, Coffee, Zap, Droplets, Wifi, Users, Wrench, FileText,
  Package, ShoppingBag, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp,
  Calculator, Target, BarChart2
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { usePOS } from '@/contexts/POSContext';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { activeCafe } from '@/lib/cafe-config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverheadItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: number;
  placeholder: string;
  hint?: string;
}

interface CategoryMix {
  category: string;
  pct: number; // 0-100
  avgPrice: number;
  avgCost: number;
}

// ─── localStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = `${activeCafe.storageKey}_profitability`;

function loadSaved<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultOverhead = (): OverheadItem[] => [
  { id: 'rent',        label: 'Rent / Lease',            icon: <Coffee className="h-4 w-4" />,   value: 0, placeholder: '18000', hint: 'Monthly space rental' },
  { id: 'electric',    label: 'Electricity',             icon: <Zap className="h-4 w-4" />,      value: 0, placeholder: '8000',  hint: 'Espresso machines & AC are heavy consumers' },
  { id: 'water',       label: 'Water',                   icon: <Droplets className="h-4 w-4" />, value: 0, placeholder: '1500' },
  { id: 'internet',    label: 'Internet + Streaming',    icon: <Wifi className="h-4 w-4" />,     value: 0, placeholder: '2500',  hint: 'Cafe WiFi + background music/TV subscriptions' },
  { id: 'salaries',    label: 'Salaries (all staff)',    icon: <Users className="h-4 w-4" />,    value: 0, placeholder: '35000', hint: 'Include baristas, cashier, kitchen staff' },
  { id: 'equipment',   label: 'Equipment Amortization',  icon: <Wrench className="h-4 w-4" />,   value: 0, placeholder: '3000',  hint: 'Purchase price ÷ useful months (e.g. ₱180k machine ÷ 60 months = ₱3k/mo)' },
  { id: 'packaging',   label: 'Packaging',               icon: <Package className="h-4 w-4" />,  value: 0, placeholder: '4000',  hint: 'Cups, lids, straws, bags, tissue per month' },
  { id: 'permits',     label: 'Permits & Licenses',      icon: <FileText className="h-4 w-4" />, value: 0, placeholder: '500',   hint: 'Monthly equivalent of annual business permits' },
  { id: 'cleaning',    label: 'Cleaning & Supplies',     icon: <ShoppingBag className="h-4 w-4" />, value: 0, placeholder: '1500' },
  { id: 'other',       label: 'Other Overhead',          icon: <Calculator className="h-4 w-4" />, value: 0, placeholder: '2000' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AdminProfitability = () => {
  const { menuItems, orders } = usePOS();

  const saved = useMemo(() => loadSaved<Record<string, unknown>>(STORAGE_KEY, {}), []);

  // Section 1: Overhead
  const [overhead, setOverhead] = useState<OverheadItem[]>(() => {
    const saved_oh = loadSaved<Record<string, number>>(`${STORAGE_KEY}_overhead`, {});
    return defaultOverhead().map(o => ({ ...o, value: saved_oh[o.id] ?? o.value }));
  });

  // Section 2: Operation params
  const [openDaysPerMonth, setOpenDaysPerMonth] = useState<number>(() =>
    loadSaved<number>(`${STORAGE_KEY}_opendays`, 26));
  const [targetMarginPct, setTargetMarginPct] = useState<number>(() =>
    loadSaved<number>(`${STORAGE_KEY}_targetmargin`, 30));
  const [avgOrderItems, setAvgOrderItems] = useState<number>(() =>
    loadSaved<number>(`${STORAGE_KEY}_avgorderitems`, 2));

  // Section 3: Category mix (how many % of sales from each category)
  const allCategories = useMemo(() => {
    const cats = new Set(menuItems.map(i => i.category));
    return Array.from(cats);
  }, [menuItems]);

  const [categoryMixRaw, setCategoryMixRaw] = useState<Record<string, number>>(() =>
    loadSaved<Record<string, number>>(`${STORAGE_KEY}_catmix`, {}));

  // Derived: per-category avg price & cost from actual menu items
  const categoryStats = useMemo(() => {
    return allCategories.map(cat => {
      const items = menuItems.filter(i => i.category === cat);
      const avgPrice = items.reduce((s, i) => s + i.price, 0) / items.length;
      const costed = items.filter(i => i.costPrice != null);
      const avgCost = costed.length
        ? costed.reduce((s, i) => s + (i.costPrice ?? 0), 0) / costed.length
        : avgPrice * 0.4; // fallback 40% cost estimate
      return { category: cat, avgPrice, avgCost, count: items.length };
    });
  }, [menuItems]);

  // Normalize mix to 100%
  const categoryMix: CategoryMix[] = useMemo(() => {
    const total = Object.values(categoryMixRaw).reduce((s, v) => s + v, 0);
    return categoryStats.map(cs => ({
      category: cs.category,
      pct: total > 0 ? (categoryMixRaw[cs.category] ?? 0) : 100 / categoryStats.length,
      avgPrice: cs.avgPrice,
      avgCost: cs.avgCost,
    }));
  }, [categoryMixRaw, categoryStats]);

  const mixTotal = categoryMix.reduce((s, c) => s + c.pct, 0);

  // ─── Core Calculations ────────────────────────────────────────────────────

  const totalMonthlyOverhead = useMemo(
    () => overhead.reduce((s, o) => s + (o.value || 0), 0),
    [overhead]);

  // Weighted average contribution margin from category mix
  const weightedAvgPrice = useMemo(() => {
    if (mixTotal === 0) return 0;
    return categoryMix.reduce((s, c) => s + c.avgPrice * (c.pct / mixTotal), 0);
  }, [categoryMix, mixTotal]);

  const weightedAvgCost = useMemo(() => {
    if (mixTotal === 0) return 0;
    return categoryMix.reduce((s, c) => s + c.avgCost * (c.pct / mixTotal), 0);
  }, [categoryMix, mixTotal]);

  const weightedContribution = weightedAvgPrice - weightedAvgCost; // per item sold
  const weightedMarginPct = weightedAvgPrice > 0
    ? ((weightedContribution / weightedAvgPrice) * 100)
    : 0;

  // Actual average order value from real orders
  const actualAvgOrderValue = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed');
    if (completed.length === 0) return null;
    return completed.reduce((s, o) => s + o.total, 0) / completed.length;
  }, [orders]);

  const avgOrderValue = (actualAvgOrderValue ?? 0) > 0
    ? actualAvgOrderValue!
    : weightedAvgPrice * avgOrderItems;

  // Break-even calculations
  const dailyOverhead = openDaysPerMonth > 0 ? totalMonthlyOverhead / openDaysPerMonth : 0;

  // Items per day needed to cover overhead (contribution per item basis)
  const breakEvenItemsPerDay = weightedContribution > 0
    ? dailyOverhead / weightedContribution
    : 0;

  // Orders per day needed
  const breakEvenOrdersPerDay = avgOrderItems > 0
    ? breakEvenItemsPerDay / avgOrderItems
    : 0;

  // Revenue per day needed
  const breakEvenRevenuePerDay = breakEvenOrdersPerDay * avgOrderValue;

  // Scenarios
  const scenarios = [
    { label: 'Worst Case', multiplier: 0.6, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
    { label: 'Average', multiplier: 1.0, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { label: 'Good Day', multiplier: 1.4, color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  ];

  // Target profit calculation
  const targetMonthlyRevenue = totalMonthlyOverhead > 0
    ? totalMonthlyOverhead / (1 - targetMarginPct / 100)
    : 0;
  const targetDailyRevenue = openDaysPerMonth > 0 ? targetMonthlyRevenue / openDaysPerMonth : 0;
  const targetDailyOrders = avgOrderValue > 0 ? targetDailyRevenue / avgOrderValue : 0;

  // Pricing health per category
  const pricingHealth = useMemo(() => {
    return categoryStats.map(cs => {
      const margin = cs.avgPrice > 0 ? ((cs.avgPrice - cs.avgCost) / cs.avgPrice) * 100 : 0;
      const recommendedPrice = cs.avgCost / (1 - targetMarginPct / 100);
      const gap = recommendedPrice - cs.avgPrice;
      let status: 'ok' | 'warning' | 'under' = 'ok';
      if (margin < targetMarginPct * 0.7) status = 'under';
      else if (margin < targetMarginPct) status = 'warning';
      return { ...cs, margin, recommendedPrice, gap, status };
    });
  }, [categoryStats, targetMarginPct]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const updateOverhead = (id: string, val: number) => {
    setOverhead(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, value: val } : o);
      const record: Record<string, number> = {};
      updated.forEach(o => { record[o.id] = o.value; });
      save(`${STORAGE_KEY}_overhead`, record);
      return updated;
    });
  };

  const updateCatMix = (cat: string, val: number) => {
    setCategoryMixRaw(prev => {
      const updated = { ...prev, [cat]: val };
      save(`${STORAGE_KEY}_catmix`, updated);
      return updated;
    });
  };

  const persistParam = (key: string, val: number, setter: (v: number) => void) => {
    setter(val);
    save(`${STORAGE_KEY}_${key}`, val);
  };

  const [showPricingDetail, setShowPricingDetail] = useState(false);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-8 pb-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            Profitability Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Enter your real cafe costs to find out exactly how many cups/orders you need to break even and hit your profit target.
          </p>
        </div>

        {/* ── Section 1: Monthly Overhead ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Monthly Fixed Costs
            </CardTitle>
            <CardDescription>
              Fill in your actual monthly expenses. Leave blank items as 0.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {overhead.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="text-muted-foreground shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <Label className="text-sm">{item.label}</Label>
                      {item.hint && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-48 text-xs">{item.hint}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder={item.placeholder}
                        value={item.value || ''}
                        onChange={(e) => updateOverhead(item.id, parseFloat(e.target.value) || 0)}
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overhead total */}
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
              <span className="font-display font-semibold tracking-wider">TOTAL MONTHLY OVERHEAD</span>
              <span className="text-2xl font-display font-bold text-primary">
                {formatCurrency(totalMonthlyOverhead)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Operating Parameters ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Operating Parameters
            </CardTitle>
            <CardDescription>Set your operating schedule and profit target.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-6">
              {/* Open days */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Open Days / Month</Label>
                  <span className="font-display font-bold text-primary text-lg">{openDaysPerMonth}</span>
                </div>
                <Slider
                  min={1} max={31} step={1}
                  value={[openDaysPerMonth]}
                  onValueChange={([v]) => persistParam('opendays', v, setOpenDaysPerMonth)}
                />
                <p className="text-xs text-muted-foreground">Typically 24–26 for a cafe with 1 rest day/week</p>
              </div>

              {/* Target net margin */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Target Net Profit Margin</Label>
                  <span className="font-display font-bold text-primary text-lg">{targetMarginPct}%</span>
                </div>
                <Slider
                  min={5} max={60} step={1}
                  value={[targetMarginPct]}
                  onValueChange={([v]) => persistParam('targetmargin', v, setTargetMarginPct)}
                />
                <p className="text-xs text-muted-foreground">Healthy cafe target: 15–30%</p>
              </div>

              {/* Avg items per order */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Avg Items per Order</Label>
                  <span className="font-display font-bold text-primary text-lg">{avgOrderItems}</span>
                </div>
                <Slider
                  min={1} max={8} step={0.5}
                  value={[avgOrderItems]}
                  onValueChange={([v]) => persistParam('avgorderitems', v, setAvgOrderItems)}
                />
                {actualAvgOrderValue && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Actual avg order value from your orders: {formatCurrency(actualAvgOrderValue)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Product Mix ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Sales Mix by Category
              <Badge variant={Math.abs(mixTotal - 100) < 1 ? "default" : "destructive"} className="ml-auto text-xs">
                {Math.round(mixTotal)}% / 100%
              </Badge>
            </CardTitle>
            <CardDescription>
              Estimate what % of your sales come from each category. Prices and costs are pulled from your menu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((cs) => {
                const pct = categoryMixRaw[cs.category] ?? 0;
                const margin = cs.avgPrice > 0 ? ((cs.avgPrice - cs.avgCost) / cs.avgPrice * 100) : 0;
                return (
                  <div key={cs.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cs.category}</span>
                        <span className="text-xs text-muted-foreground">{cs.count} items</span>
                        <span className="text-xs text-muted-foreground">avg ₱{cs.avgPrice.toFixed(0)}</span>
                        <span className={`text-xs font-medium ${margin >= targetMarginPct ? 'text-green-600 dark:text-green-400' : 'text-yellow-500'}`}>
                          {margin.toFixed(0)}% margin
                        </span>
                      </div>
                      <span className="font-display font-bold w-12 text-right">{pct}%</span>
                    </div>
                    <Slider
                      min={0} max={100} step={5}
                      value={[pct]}
                      onValueChange={([v]) => updateCatMix(cs.category, v)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Weighted stats */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-3 bg-secondary rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Weighted Avg Price</p>
                <p className="font-display font-bold text-lg">{formatCurrency(weightedAvgPrice)}</p>
              </div>
              <div className="p-3 bg-secondary rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Weighted Avg Cost</p>
                <p className="font-display font-bold text-lg">{formatCurrency(weightedAvgCost)}</p>
              </div>
              <div className={`p-3 rounded-lg text-center border ${weightedMarginPct >= targetMarginPct ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                <p className="text-xs text-muted-foreground">Blended Margin</p>
                <p className={`font-display font-bold text-lg ${weightedMarginPct >= targetMarginPct ? 'text-green-600 dark:text-green-400' : 'text-yellow-500'}`}>
                  {weightedMarginPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: Break-Even ── */}
        {totalMonthlyOverhead > 0 && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                Break-Even Analysis
              </CardTitle>
              <CardDescription>
                How much you need to sell just to cover your costs — zero profit, zero loss.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main break-even callout */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="col-span-full sm:col-span-1 p-6 bg-primary/10 border border-primary/30 rounded-xl text-center">
                  <p className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-1">Items to Sell / Day</p>
                  <p className="text-5xl font-display font-black text-primary">
                    {breakEvenItemsPerDay > 0 ? Math.ceil(breakEvenItemsPerDay) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">cups, plates, or pieces</p>
                </div>
                <div className="p-6 bg-secondary rounded-xl text-center">
                  <p className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-1">Orders / Day</p>
                  <p className="text-4xl font-display font-bold">
                    {breakEvenOrdersPerDay > 0 ? Math.ceil(breakEvenOrdersPerDay) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">transactions</p>
                </div>
                <div className="p-6 bg-secondary rounded-xl text-center">
                  <p className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-1">Revenue / Day</p>
                  <p className="text-4xl font-display font-bold">
                    {breakEvenRevenuePerDay > 0 ? formatCurrency(breakEvenRevenuePerDay) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">minimum daily sales</p>
                </div>
              </div>

              {/* Scenario table */}
              <div>
                <h3 className="font-display text-sm tracking-wider font-semibold mb-3 text-muted-foreground uppercase">Daily Scenario Comparison</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {scenarios.map((sc) => {
                    const revenue = breakEvenRevenuePerDay * sc.multiplier;
                    const orders = breakEvenOrdersPerDay * sc.multiplier;
                    const profit = (revenue - dailyOverhead) * (1 - weightedAvgCost / weightedAvgPrice);
                    const monthlyProfit = profit * openDaysPerMonth;
                    const aboveBreakEven = revenue >= breakEvenRevenuePerDay;
                    return (
                      <div key={sc.label} className={`p-4 rounded-xl border ${sc.bg}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-display text-sm font-bold tracking-wider ${sc.color}`}>{sc.label}</span>
                          {aboveBreakEven
                            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                            : <AlertTriangle className="h-4 w-4 text-destructive" />}
                        </div>
                        <p className="text-2xl font-display font-black">{formatCurrency(revenue)}</p>
                        <p className="text-xs text-muted-foreground">{Math.ceil(orders)} orders · {Math.ceil(orders * avgOrderItems)} items</p>
                        <div className="mt-2 pt-2 border-t border-current/10">
                          <p className="text-xs text-muted-foreground">Est. monthly net</p>
                          <p className={`font-bold text-sm ${monthlyProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                            {monthlyProfit >= 0 ? '+' : ''}{formatCurrency(monthlyProfit * openDaysPerMonth / openDaysPerMonth)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Monthly Overhead', val: totalMonthlyOverhead, sub: 'fixed costs' },
                  { label: 'Break-Even Revenue', val: totalMonthlyOverhead / (weightedMarginPct / 100 || 0.01), sub: 'per month' },
                  { label: 'Target Revenue', val: targetMonthlyRevenue, sub: `for ${targetMarginPct}% net margin` },
                  { label: 'Target Daily Sales', val: targetDailyRevenue, sub: `${Math.ceil(targetDailyOrders)} orders/day` },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-card border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-display font-bold text-base mt-0.5">{formatCurrency(item.val)}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Section 5: Pricing Health ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Pricing Health Check
              <button
                onClick={() => setShowPricingDetail(!showPricingDetail)}
                className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPricingDetail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showPricingDetail ? 'Hide' : 'Show'} detail
              </button>
            </CardTitle>
            <CardDescription>
              Based on your {targetMarginPct}% target margin — how does each category stack up?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pricingHealth.map((ph) => {
                const statusColor = ph.status === 'ok'
                  ? 'text-green-600 dark:text-green-400'
                  : ph.status === 'warning'
                    ? 'text-yellow-500'
                    : 'text-destructive';
                const barPct = Math.min(100, (ph.margin / (targetMarginPct * 1.5)) * 100);
                return (
                  <div key={ph.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{ph.category}</span>
                      <div className="flex items-center gap-3">
                        {showPricingDetail && (
                          <span className="text-xs text-muted-foreground">
                            avg ₱{ph.avgPrice.toFixed(0)} · cost ₱{ph.avgCost.toFixed(0)}
                            {ph.gap > 0 && <span className="text-destructive ml-1">(+₱{ph.gap.toFixed(0)} rec.)</span>}
                          </span>
                        )}
                        <span className={`font-display font-bold w-16 text-right ${statusColor}`}>
                          {ph.margin.toFixed(1)}%
                        </span>
                        {ph.status === 'ok' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                        {ph.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />}
                        {ph.status === 'under' && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          ph.status === 'ok' ? 'bg-green-500' :
                          ph.status === 'warning' ? 'bg-yellow-500' : 'bg-destructive'
                        }`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    {showPricingDetail && ph.gap > 0 && (
                      <p className="text-xs text-muted-foreground pl-1">
                        Recommend raising avg price by ₱{ph.gap.toFixed(0)} to hit {targetMarginPct}% margin target.
                        {weightedContribution > 0 && (
                          <span className="text-primary ml-1">
                            Saves ~{Math.round(ph.gap * 0.3)} cups/day at break-even.
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick legend */}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> At or above target</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-yellow-500" /> Below target</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> Critically below</span>
            </div>

            {/* No cost data warning */}
            {categoryStats.some(cs => {
              const costed = menuItems.filter(i => i.category === cs.category && i.costPrice != null);
              return costed.length === 0;
            }) && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Some categories have no cost price data — using a 40% cost estimate as fallback.
                  For accurate results, set cost prices in <strong>Inventory</strong>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Section 6: Profit Projection ── */}
        {totalMonthlyOverhead > 0 && breakEvenItemsPerDay > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Monthly Profit Projection
              </CardTitle>
              <CardDescription>
                Projected net profit based on different customer volumes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-display text-xs tracking-wider text-muted-foreground">CUSTOMERS/DAY</th>
                      <th className="text-right py-2 font-display text-xs tracking-wider text-muted-foreground">MONTHLY REVENUE</th>
                      <th className="text-right py-2 font-display text-xs tracking-wider text-muted-foreground">GROSS PROFIT</th>
                      <th className="text-right py-2 font-display text-xs tracking-wider text-muted-foreground">NET AFTER OVERHEAD</th>
                      <th className="text-center py-2 font-display text-xs tracking-wider text-muted-foreground">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      Math.ceil(breakEvenOrdersPerDay * 0.5),
                      Math.ceil(breakEvenOrdersPerDay * 0.8),
                      Math.ceil(breakEvenOrdersPerDay),
                      Math.ceil(breakEvenOrdersPerDay * 1.25),
                      Math.ceil(breakEvenOrdersPerDay * 1.5),
                      Math.ceil(breakEvenOrdersPerDay * 2),
                    ].filter((v, i, a) => a.indexOf(v) === i && v > 0).map((custPerDay) => {
                      const monthRevenue = custPerDay * avgOrderValue * openDaysPerMonth;
                      const monthCogs = custPerDay * avgOrderItems * weightedAvgCost * openDaysPerMonth;
                      const grossProfit = monthRevenue - monthCogs;
                      const netProfit = grossProfit - totalMonthlyOverhead;
                      const netMargin = monthRevenue > 0 ? (netProfit / monthRevenue * 100) : 0;
                      const isBreakEven = custPerDay >= Math.ceil(breakEvenOrdersPerDay);
                      return (
                        <tr key={custPerDay} className={`border-b border-border/50 ${isBreakEven ? '' : 'opacity-70'}`}>
                          <td className="py-3 font-display font-semibold">{custPerDay} orders</td>
                          <td className="py-3 text-right font-mono">{formatCurrency(monthRevenue)}</td>
                          <td className="py-3 text-right font-mono">{formatCurrency(grossProfit)}</td>
                          <td className={`py-3 text-right font-mono font-bold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">({netMargin.toFixed(1)}%)</span>
                          </td>
                          <td className="py-3 text-center">
                            {netProfit >= targetMonthlyRevenue - totalMonthlyOverhead * (targetMarginPct / 100)
                              ? <Badge className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">Target</Badge>
                              : netProfit >= 0
                                ? <Badge variant="secondary" className="text-xs">Break-even</Badge>
                                : <Badge variant="destructive" className="text-xs">Loss</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {totalMonthlyOverhead === 0 && (
          <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-display tracking-wider">Fill in your monthly costs above to see your break-even analysis.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProfitability;
