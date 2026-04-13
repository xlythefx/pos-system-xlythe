import { useState, useRef, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { usePOS, Order } from '@/contexts/POSContext';
import { cn, formatCurrency } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { Banknote, Smartphone, ChevronDown, ChevronUp, Printer, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DEMO_ITEMS = [
  { id: 'demo-1', name: 'Biscoff Coffee', price: 180, category: 'BESTSELLER', description: '' },
  { id: 'demo-2', name: "S'mores Latte", price: 180, category: 'BESTSELLER', description: '' },
  { id: 'demo-3', name: 'Spanish Latte', price: 150, category: 'CLASSIC COFFEE', description: '' },
  { id: 'demo-4', name: 'Matcha Milk', price: 180, category: 'MATCHA SERIES', description: '' },
  { id: 'demo-5', name: 'Shawarma', price: 59, category: 'SNACKS', description: '' },
  { id: 'demo-6', name: 'Croffle', price: 140, category: 'BREAD', description: '' },
  { id: 'demo-7', name: 'Tapsilog', price: 180, category: 'RICE MEAL', description: '' },
];

const createDemoOrders = (): Order[] => {
  const result: Order[] = [];
  for (let d = 0; d < 30; d++) {
    const date = subDays(new Date(), 29 - d);
    const perDay = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < perDay; i++) {
      const h = 8 + Math.floor(Math.random() * 12);
      const m = Math.floor(Math.random() * 60);
      const ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
      const numItems = 1 + Math.floor(Math.random() * 3);
      const orderItems = Array.from({ length: numItems }, () => {
        const item = DEMO_ITEMS[Math.floor(Math.random() * DEMO_ITEMS.length)];
        return { ...item, quantity: 1 + Math.floor(Math.random() * 2), cartLineId: item.id, modifierTotal: 0, sku: '', isAvailable: true };
      });
      const total = orderItems.reduce((s, it) => s + it.price * it.quantity, 0);
      result.push({
        id: `DEMO-${String(d).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        items: orderItems,
        total,
        timestamp: ts,
        status: Math.random() > 0.08 ? 'completed' : 'cancelled',
        paymentMethod: Math.random() > 0.4 ? 'cash' : 'gcash',
      });
    }
  }
  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const AdminOrders = () => {
  const { orders } = usePOS();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const demoOrders = useMemo(() => createDemoOrders(), []);
  const displayOrders = isDemoMode ? demoOrders : orders;

  const filteredOrders = displayOrders.filter(o =>
    filter === 'all' ? true : o.status === filter
  );

  const todayTotal = displayOrders
    .filter(o => {
      const today = new Date();
      const orderDate = new Date(o.timestamp);
      return o.status === 'completed' &&
        orderDate.toDateString() === today.toDateString();
    })
    .reduce((sum, o) => sum + o.total, 0);

  const todayCount = displayOrders.filter(o => {
    const today = new Date();
    const orderDate = new Date(o.timestamp);
    return o.status === 'completed' &&
      orderDate.toDateString() === today.toDateString();
  }).length;

  const handlePrintReceipt = (order: Order) => {
    setReceiptOrder(order);
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow || !receiptOrder) return;

    const receiptHTML = `
      <html>
        <head>
          <title>Receipt - ${receiptOrder.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; padding: 20px 10px; font-size: 12px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 4px 0; }
            .footer { margin-top: 16px; padding-top: 8px; border-top: 2px solid #000; text-align: center; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:16px">GODS WILL CAFE</div>
          <div class="center" style="margin-bottom:4px">Thank you for your order!</div>
          <div class="line"></div>
          <div class="row"><span>Order:</span><span>${receiptOrder.id}</span></div>
          <div class="row"><span>Date:</span><span>${format(new Date(receiptOrder.timestamp), 'MMM dd, yyyy')}</span></div>
          <div class="row"><span>Time:</span><span>${format(new Date(receiptOrder.timestamp), 'hh:mm a')}</span></div>
          <div class="row"><span>Payment:</span><span>${receiptOrder.paymentMethod.toUpperCase()}</span></div>
          <div class="line"></div>
          ${receiptOrder.items.map(item => `
            <div class="row">
              <span>${item.quantity}x ${item.name}${item.description ? ' - ' + item.description : ''}</span>
              <span>₱${formatCurrency(item.price * item.quantity)}</span>
            </div>
          `).join('')}
          <div class="line"></div>
          <div class="total-row"><span>TOTAL</span><span>₱${formatCurrency(receiptOrder.total)}</span></div>
          <div class="line"></div>
          <div class="center" style="margin-top:12px">Thank you! Come again!</div>
          <div class="footer">
            <div class="bold">Nap.AI Digital Solutions</div>
            <div>Binangonan, Rizal</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <AdminLayout>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="font-display font-bold text-foreground tracking-wider text-xl">ORDERS</h2>
          <div className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-secondary">
            <Label htmlFor="orders-demo-mode" className="text-xs font-display tracking-wider cursor-pointer whitespace-nowrap">
              {isDemoMode ? 'DEMO' : 'LIVE'}
            </Label>
            <Switch
              id="orders-demo-mode"
              checked={isDemoMode}
              onCheckedChange={setIsDemoMode}
              aria-label={isDemoMode ? 'Demo mode on' : 'Live mode on'}
            />
            <FlaskConical className={cn("h-4 w-4", isDemoMode ? "text-primary" : "text-muted-foreground")} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="brutal-card bg-card p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wider">TODAY'S SALES</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">
              ₱{formatCurrency(todayTotal)}
            </p>
          </div>
          <div className="brutal-card bg-card p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wider">TODAY'S ORDERS</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">
              {todayCount}
            </p>
          </div>
          <div className="brutal-card bg-card p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wider">TOTAL ORDERS</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">
              {displayOrders.filter(o => o.status === 'completed').length}
            </p>
          </div>
          <div className="brutal-card bg-card p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wider">CANCELLED</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">
              {displayOrders.filter(o => o.status === 'cancelled').length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'completed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 font-display text-sm tracking-wider border-2 transition-all uppercase",
                filter === f
                  ? "bg-primary text-primary-foreground border-foreground"
                  : "bg-secondary text-muted-foreground border-transparent hover:border-border"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="brutal-card bg-card p-8 text-center">
              <p className="text-muted-foreground font-display">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="brutal-card bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-display font-bold text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.timestamp), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className={cn(
                      "px-2 py-1 text-xs font-display tracking-wider",
                      order.status === 'completed' ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                    )}>
                      {order.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {order.paymentMethod === 'gcash' ? (
                        <Smartphone className="h-4 w-4" />
                      ) : (
                        <Banknote className="h-4 w-4" />
                      )}
                    </div>
                    <p className="font-display font-bold text-foreground">
                      ₱{formatCurrency(order.total)}
                    </p>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expandedOrder === order.id && (
                  <div className="border-t border-border p-4 bg-secondary/50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground font-display tracking-wider">ORDER ITEMS</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintReceipt(order)}
                        className="font-display text-xs tracking-wider"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        RECEIPT
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-foreground">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-muted-foreground">
                            ₱{formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptOrder} onOpenChange={() => setReceiptOrder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider text-center">RECEIPT</DialogTitle>
          </DialogHeader>
          {receiptOrder && (
            <div className="font-mono text-sm space-y-3">
              <div className="text-center">
                <p className="font-bold text-lg">GODS WILL CAFE</p>
                <p className="text-muted-foreground text-xs">Thank you for your order!</p>
              </div>
              <div className="border-t border-dashed border-border pt-2 space-y-1">
                <div className="flex justify-between"><span>Order:</span><span>{receiptOrder.id}</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{format(new Date(receiptOrder.timestamp), 'MMM dd, yyyy')}</span></div>
                <div className="flex justify-between"><span>Time:</span><span>{format(new Date(receiptOrder.timestamp), 'hh:mm a')}</span></div>
                <div className="flex justify-between"><span>Payment:</span><span>{receiptOrder.paymentMethod.toUpperCase()}</span></div>
              </div>
              <div className="border-t border-dashed border-border pt-2 space-y-1">
                {receiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>₱{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-border pt-2">
                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL</span>
                  <span>₱{formatCurrency(receiptOrder.total)}</span>
                </div>
              </div>
              <div className="text-center text-xs text-muted-foreground pt-2">
                Thank you! Come again!
              </div>
              <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
                <p className="font-display font-medium text-foreground">Nap.AI Digital Solutions</p>
                <p>Binangonan, Rizal</p>
              </div>
              <Button onClick={printReceipt} className="w-full font-display tracking-wider mt-2">
                <Printer className="h-4 w-4 mr-2" />
                PRINT RECEIPT
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
