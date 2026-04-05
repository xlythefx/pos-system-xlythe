import { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { usePOS } from '@/contexts/POSContext';
import { format, subDays, subMonths, startOfDay, endOfDay, isWithinInterval, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import { Download, Users, TrendingUp, ShoppingBag, DollarSign, Clock, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Order } from '@/contexts/POSContext';

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
        return { ...item, quantity: 1 + Math.floor(Math.random() * 2) };
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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const completedOrders = orders.filter(o => o.status === 'completed');

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (timeRange === 'today') return startOfDay(now);
    if (timeRange === 'week') return startOfDay(subDays(now, 6));
    return startOfDay(subMonths(now, 1));
  }, [timeRange]);

  const rangeEnd = endOfDay(new Date());

  const filteredOrders = useMemo(() => {
    if (isDemoMode) return createDemoOrders(rangeStart, rangeEnd);
    return completedOrders.filter(o =>
      isWithinInterval(new Date(o.timestamp), { start: rangeStart, end: rangeEnd })
    );
  }, [isDemoMode, completedOrders, rangeStart, rangeEnd]);

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
      <div className="space-y-6">
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
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">REVENUE</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground">₱{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">ORDERS</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground">{totalOrders}</p>
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">AVG ORDER</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground">₱{formatCurrency(avgOrderValue)}</p>
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">CUSTOMERS</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground">{customersServed}</p>
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">ITEMS SOLD</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground">{totalItemsSold}</p>
          </div>
          <div className="brutal-card bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-display tracking-wider">PEAK HOUR</p>
            </div>
            <p className="text-xl font-display font-bold text-foreground">{peakHourLabel}</p>
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

        {/* Hourly Distribution */}
        <div className="brutal-card bg-card p-4">
          <p className="text-xs text-muted-foreground font-display tracking-wider mb-4">ORDERS BY HOUR</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--border))', borderRadius: 0 }}
                />
                <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

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
