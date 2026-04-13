import { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { usePOS } from '@/contexts/POSContext';
import { format, subDays, subMonths, startOfDay, endOfDay, isWithinInterval, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import { Download, Users, TrendingUp, ShoppingBag, DollarSign, Clock, FlaskConical, ArrowUp, ArrowDown, Minus, CreditCard, Banknote, XCircle, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Order } from '@/contexts/POSContext';

const TREND_COLORS = ['hsl(var(--primary))', '#e67e22', '#2ecc71', '#9b59b6', '#1abc9c'];

interface DeltaBadgeProps { current: number; prev: number; format?: 'currency' | 'count' }
const DeltaBadge = ({ current, prev }: DeltaBadgeProps) => {
  if (prev === 0 && current === 0) return null;
  const pct = prev === 0 ? 100 : Math.round(((current - prev) / Math.abs(prev)) * 100);
  const up = pct > 0;
  const neutral = pct === 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-display font-bold px-1.5 py-0.5 rounded-sm',
      neutral ? 'text-muted-foreground bg-muted' : up ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
    )}>
      {neutral ? <Minus className="h-2.5 w-2.5" /> : up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {Math.abs(pct)}%
    </span>
  );
};

const COLORS = ['hsl(var(--primary))', '#e67e22', '#2ecc71', '#9b59b6', '#1abc9c', '#e74c3c', '#34495e', '#3498db', '#f39c12', '#d35400'];

type TimeRange = 'today' | 'week' | 'month';

const createDemoOrders = (rangeStart: Date, rangeEnd: Date): Order[] => {
  const categories = ['BESTSELLER', 'CLASSIC COFFEE', 'MATCHA SERIES', 'SNACKS', 'BREAD', 'RICE MEAL'];
  const items = [
    { id: 'demo-1', name: 'Biscoff Coffee', price: 180, category: 'BESTSELLER', description: '' },
    { id: 'demo-2', name: 'S\'mores Latte', price: 180, category: 'BESTSELLER', description: '' },
    { id: 'demo-3', name: 'Spanish Latte', price: 150, category: 'CLASSIC COFFEE', description: '' },
    { id: 'demo-4', name: 'Matcha Milk', price: 180, category: 'MATCHA SERIES', description: '' },
    { id: 'demo-5', name: 'Shawarma', price: 59, category: 'SNACKS', description: '' },
    { id: 'demo-6', name: 'Croffle', price: 140, category: 'BREAD', description: '' },
    { id: 'demo-7', name: 'Tapsilog', price: 180, category: 'RICE MEAL', description: '' },
  ];
  const orders: Order[] = [];
  const days = differenceInDays(rangeEnd, rangeStart) + 1;
  for (let d = 0; d < days; d++) {
    const date = subDays(new Date(), days - 1 - d);
    const ordersPerDay = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < ordersPerDay; i++) {
      const h = 8 + Math.floor(Math.random() * 12);
      const m = Math.floor(Math.random() * 60);
      const ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
      const numItems = 1 + Math.floor(Math.random() * 4);
      const orderItems = Array.from({ length: numItems }, () => {
        const item = items[Math.floor(Math.random() * items.length)];
        return { ...item, quantity: 1 + Math.floor(Math.random() * 2), cartLineId: item.id, modifierTotal: 0, sku: '', isAvailable: true, description: '' };
      });
      const total = orderItems.reduce((s, it) => s + it.price * it.quantity, 0);
      orders.push({
        id: `DEMO-${Date.now()}-${d}-${i}`,
        items: orderItems,
        total,
        timestamp: ts,
        status: 'completed',
        paymentMethod: Math.random() > 0.4 ? 'cash' : 'gcash',
      });
    }
  }
  return orders;
};

const AdminAnalytics = () => {
  const { orders } = usePOS();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const completedOrders = orders.filter(o => o.status === 'completed');

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (timeRange === 'today') return startOfDay(now);
    if (timeRange === 'week') return startOfDay(subDays(now, 6));
    return startOfDay(subMonths(now, 1));
  }, [timeRange]);

  const rangeEnd = endOfDay(new Date());

  // Previous period (same length, immediately before current period)
  const prevRangeEnd = useMemo(() => {
    const s = new Date(rangeStart);
    s.setDate(s.getDate() - 1);
    return endOfDay(s);
  }, [rangeStart]);
  const prevRangeStart = useMemo(() => {
    const periodDays = differenceInDays(rangeEnd, rangeStart) + 1;
    return startOfDay(subDays(prevRangeEnd, periodDays - 1));
  }, [prevRangeEnd, rangeStart, rangeEnd]);

  const filteredOrders = useMemo(() => {
    if (isDemoMode) return createDemoOrders(rangeStart, rangeEnd);
    return completedOrders.filter(o =>
      isWithinInterval(new Date(o.timestamp), { start: rangeStart, end: rangeEnd })
    );
  }, [isDemoMode, completedOrders, rangeStart, rangeEnd]);

  const prevFilteredOrders = useMemo(() => {
    if (isDemoMode) return createDemoOrders(prevRangeStart, prevRangeEnd);
    return completedOrders.filter(o =>
      isWithinInterval(new Date(o.timestamp), { start: prevRangeStart, end: prevRangeEnd })
    );
  }, [isDemoMode, completedOrders, prevRangeStart, prevRangeEnd]);

  // Sales over time chart data
  const chartData = useMemo(() => {
    const days = differenceInDays(rangeEnd, rangeStart) + 1;
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dayOrders = filteredOrders.filter(o =>
        isWithinInterval(new Date(o.timestamp), { start: startOfDay(date), end: endOfDay(date) })
      );
      return {
        date: days <= 1 ? format(date, 'HH:mm') : format(date, 'MMM dd'),
        sales: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      };
    });
  }, [filteredOrders, rangeStart, rangeEnd]);

  // Key metrics
  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = filteredOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0);
  const customersServed = totalOrders; // each order = 1 customer

  // Peak hour
  const hourMap: Record<number, number> = {};
  filteredOrders.forEach(o => {
    const h = new Date(o.timestamp).getHours();
    hourMap[h] = (hourMap[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourMap).sort(([, a], [, b]) => b - a)[0];
  const peakHourLabel = peakHour ? `${Number(peakHour[0]) % 12 || 12}${Number(peakHour[0]) >= 12 ? 'PM' : 'AM'}` : 'N/A';

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  filteredOrders.forEach(o => {
    o.items.forEach(item => {
      categoryMap[item.category] = (categoryMap[item.category] || 0) + item.price * item.quantity;
    });
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Previous period metrics
  const prevTotalRevenue = prevFilteredOrders.reduce((s, o) => s + o.total, 0);
  const prevTotalOrders = prevFilteredOrders.length;
  const prevAvgOrderValue = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;
  const prevItemsSold = prevFilteredOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0);

  // Cancellation rate — demo: synthetic 8%; live: real all-status orders in range
  const { cancelledCount, totalAllOrders } = isDemoMode
    ? (() => { const c = Math.round(totalOrders * 0.08); return { cancelledCount: c, totalAllOrders: totalOrders + c }; })()
    : (() => {
        const all = orders.filter(o => isWithinInterval(new Date(o.timestamp), { start: rangeStart, end: rangeEnd }));
        return { cancelledCount: all.filter(o => o.status === 'cancelled').length, totalAllOrders: all.length };
      })();
  const cancellationRate = totalAllOrders > 0 ? (cancelledCount / totalAllOrders) * 100 : 0;

  // Avg items per order
  const avgItemsPerOrder = totalOrders > 0 ? totalItemsSold / totalOrders : 0;
  const prevAvgItemsPerOrder = prevTotalOrders > 0
    ? prevFilteredOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0) / prevTotalOrders : 0;

  // Payment method split
  const cashOrders = filteredOrders.filter(o => o.paymentMethod === 'cash');
  const gcashOrders = filteredOrders.filter(o => o.paymentMethod === 'gcash');
  const paymentSplitData = [
    { name: 'Cash',  value: cashOrders.length,  revenue: cashOrders.reduce((s, o) => s + o.total, 0) },
    { name: 'GCash', value: gcashOrders.length, revenue: gcashOrders.reduce((s, o) => s + o.total, 0) },
  ];

  // Top selling items
  const itemMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
  filteredOrders.forEach(o => {
    o.items.forEach(item => {
      if (!itemMap[item.id]) itemMap[item.id] = { name: item.name, category: item.category, qty: 0, revenue: 0 };
      itemMap[item.id].qty += item.quantity;
      itemMap[item.id].revenue += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

  // Best sellers trend (top 5 items × daily qty)
  const top5Names = topItems.slice(0, 5).map((i) => i.name);
  const trendData = useMemo(() => {
    const days = differenceInDays(rangeEnd, rangeStart) + 1;
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dayOrders = filteredOrders.filter(o =>
        isWithinInterval(new Date(o.timestamp), { start: startOfDay(date), end: endOfDay(date) })
      );
      const row: Record<string, number | string> = { date: format(date, days <= 1 ? 'HH:mm' : 'MMM dd') };
      top5Names.forEach((name) => {
        row[name] = dayOrders.reduce((s, o) =>
          s + o.items.filter(it => it.name === name).reduce((ss, it) => ss + it.quantity, 0), 0
        );
      });
      return row;
    });
  }, [filteredOrders, rangeStart, rangeEnd, top5Names.join(',')]);

  // 7-day hourly heatmap (last 7 days, always)
  const heatmapData = useMemo(() => {
    const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6AM–10PM
    const last7 = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    return last7.map((date) => {
      const dayOrders = completedOrders.filter(o =>
        isWithinInterval(new Date(o.timestamp), { start: startOfDay(date), end: endOfDay(date) })
      );
      const row: { day: string; [h: number]: number } = { day: format(date, 'EEE') };
      HOURS.forEach((h) => {
        row[h] = dayOrders.filter(o => new Date(o.timestamp).getHours() === h)
          .reduce((s, o) => s + o.total, 0);
      });
      return row;
    });
  }, [completedOrders]);

  const HEATMAP_HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
  const heatmapMax = Math.max(1, ...heatmapData.flatMap(row => HEATMAP_HOURS.map(h => row[h] ?? 0)));
  const heatLabel = (h: number) => `${h % 12 || 12}${h >= 12 ? 'p' : 'a'}`;

  // Hourly distribution
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`,
    orders: hourMap[h] || 0,
  })).filter(d => d.orders > 0 || true).slice(6, 23); // 6AM to 10PM

  // Export CSV
  const exportCSV = () => {
    const rangeLabel = timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month';
    const headers = ['Order ID', 'Date', 'Items', 'Status', 'Total'];
    const rows = filteredOrders.map(o => [
      o.id,
      format(new Date(o.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      o.items.map(i => `${i.quantity}x ${i.name}`).join('; '),
      o.status.toUpperCase(),
      formatCurrency(o.total),
    ]);

    // Summary section
    const summary = [
      [],
      ['SUMMARY'],
      ['Period', rangeLabel],
      ['Total Revenue', `₱${formatCurrency(totalRevenue)}`],
      ['Total Orders', totalOrders.toString()],
      ['Avg Order Value', `₱${formatCurrency(avgOrderValue)}`],
      ['Items Sold', totalItemsSold.toString()],
      [],
      ['TOP SELLING ITEMS'],
      ['Rank', 'Item', 'Category', 'Qty Sold', 'Revenue'],
      ...topItems.map((item, i) => [
        (i + 1).toString(),
        item.name,
        item.category,
        item.qty.toString(),
        `₱${formatCurrency(item.revenue)}`,
      ]),
      [],
      ['TRANSACTIONS'],
      headers,
      ...rows,
    ];

    const csv = summary.map(row => (row as string[]).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="font-display font-bold text-foreground tracking-wider text-xl">ANALYTICS</h2>
          <div className="flex flex-wrap items-center gap-3">
            {/* Demo / Live Toggle */}
            <div className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-secondary">
              <Label htmlFor="demo-mode" className="text-xs font-display tracking-wider cursor-pointer whitespace-nowrap">
                {isDemoMode ? 'DEMO' : 'LIVE'}
              </Label>
              <Switch
                id="demo-mode"
                checked={isDemoMode}
                onCheckedChange={setIsDemoMode}
                aria-label={isDemoMode ? 'Demo mode on' : 'Live mode on'}
              />
              <FlaskConical className={cn("h-4 w-4", isDemoMode ? "text-primary" : "text-muted-foreground")} />
            </div>
            {/* Time Range Tabs */}
            <div className="flex gap-1">
              {([
                { key: 'today', label: 'TODAY' },
                { key: 'week', label: '7 DAYS' },
                { key: 'month', label: '30 DAYS' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key)}
                  className={cn(
                    "px-3 py-1.5 font-display text-xs tracking-wider border-2 transition-all",
                    timeRange === key
                      ? "bg-primary text-primary-foreground border-foreground"
                      : "bg-secondary text-muted-foreground border-transparent hover:border-border"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} className="font-display text-xs tracking-wider">
              <Download className="h-4 w-4 mr-1" />
              EXPORT CSV
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">REVENUE</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground mb-1">₱{formatCurrency(totalRevenue)}</p>
            <DeltaBadge current={totalRevenue} prev={prevTotalRevenue} />
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">ORDERS</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground mb-1">{totalOrders}</p>
            <DeltaBadge current={totalOrders} prev={prevTotalOrders} />
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">AVG ORDER</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground mb-1">₱{formatCurrency(avgOrderValue)}</p>
            <DeltaBadge current={avgOrderValue} prev={prevAvgOrderValue} />
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">CUSTOMERS</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground mb-1">{customersServed}</p>
            <DeltaBadge current={customersServed} prev={prevTotalOrders} />
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">ITEMS SOLD</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground mb-1">{totalItemsSold}</p>
            <DeltaBadge current={totalItemsSold} prev={prevItemsSold} />
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">PEAK HOUR</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground">{peakHourLabel}</p>
          </div>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <ListOrdered className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">AVG ITEMS / ORDER</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground mb-1">{avgItemsPerOrder.toFixed(1)}</p>
            <DeltaBadge current={avgItemsPerOrder} prev={prevAvgItemsPerOrder} />
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">CANCELLATION RATE</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground mb-1">{cancellationRate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground font-display">{cancelledCount} cancelled of {totalAllOrders}</p>
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">PAYMENT SPLIT</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Banknote className="h-3 w-3 text-green-500" />
                <span className="text-sm font-display font-bold">{cashOrders.length}</span>
                <span className="text-[10px] text-muted-foreground">CASH</span>
              </div>
              <span className="text-muted-foreground text-xs">/</span>
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-blue-500" />
                <span className="text-sm font-display font-bold">{gcashOrders.length}</span>
                <span className="text-[10px] text-muted-foreground">GCASH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sales Over Time */}
          <div className="brutal-card bg-card p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wider mb-4">SALES OVER TIME</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))', borderRadius: 0 }}
                    formatter={(value: number) => [`₱${formatCurrency(value)}`, 'Sales']}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="brutal-card bg-card p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wider mb-4">SALES BY CATEGORY</p>
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`₱${formatCurrency(value)}`]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground font-display text-sm">No data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method Split + Hourly Order Volume */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="brutal-card bg-card p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wider mb-4">PAYMENT METHOD SPLIT</p>
            <div className="h-64">
              {totalOrders > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentSplitData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))', borderRadius: 0 }}
                      formatter={(value: number, name: string, props: { payload: { revenue: number } }) =>
                        [`${value} orders · ₱${formatCurrency(props.payload.revenue)}`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground font-display text-sm">No data yet</div>
              )}
            </div>
          </div>

          <div className="brutal-card bg-card p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wider mb-4">HOURLY ORDER VOLUME</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))', borderRadius: 0 }}
                    formatter={(v: number) => [v, 'Orders']}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--primary) / 0.75)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 7-Day Hourly Revenue Heatmap */}
        <div className="brutal-card bg-card p-4">
          <p className="text-xs text-muted-foreground font-display tracking-wider mb-4">
            HOURLY REVENUE HEATMAP <span className="text-[10px] normal-case font-sans">(last 7 days · darker = higher revenue)</span>
          </p>
          <div className="overflow-x-auto">
            <table className="text-[10px] border-separate border-spacing-1 mx-auto">
              <thead>
                <tr>
                  <th className="font-sans text-muted-foreground w-8 pr-2 text-right" />
                  {HEATMAP_HOURS.map((h) => (
                    <th key={h} className="font-sans text-muted-foreground w-7 text-center">{heatLabel(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr key={row.day}>
                    <td className="font-display font-semibold text-muted-foreground pr-2 text-right">{row.day}</td>
                    {HEATMAP_HOURS.map((h) => {
                      const val = (row[h] as number) ?? 0;
                      const intensity = val / heatmapMax;
                      return (
                        <td key={h} title={val > 0 ? `₱${formatCurrency(val)}` : 'No sales'}>
                          <div
                            className="w-7 h-6 rounded-sm transition-all duration-300"
                            style={{
                              backgroundColor: val === 0
                                ? 'hsl(var(--secondary))'
                                : `hsl(var(--primary) / ${Math.max(0.12, intensity).toFixed(2)})`,
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Sellers Trend */}
        {top5Names.length > 0 && (
          <div className="brutal-card bg-card p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wider mb-4">BEST SELLERS TREND</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))', borderRadius: 0, fontSize: 11 }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                  {top5Names.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={TREND_COLORS[i % TREND_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Selling Items */}
        <div className="brutal-card bg-card p-4">
          <p className="text-xs text-muted-foreground font-display tracking-wider mb-4">TOP SELLING ITEMS</p>
          {topItems.length === 0 ? (
            <p className="text-muted-foreground font-display text-sm text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {topItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-primary w-6">{i + 1}</span>
                    <div>
                      <span className="font-display text-foreground">{item.name}</span>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-muted-foreground">{item.qty} sold</span>
                    <span className="font-display font-bold text-foreground">₱{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
