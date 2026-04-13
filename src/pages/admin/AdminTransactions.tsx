import { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { usePOS, type Order } from '@/contexts/POSContext';
import { format, subDays } from 'date-fns';
import { Banknote, Smartphone, Eye, FlaskConical } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DEMO_TX_ITEMS = [
  { id: 'demo-1', name: 'Biscoff Coffee', price: 180, category: 'BESTSELLER', description: '' },
  { id: 'demo-2', name: "S'mores Latte", price: 180, category: 'BESTSELLER', description: '' },
  { id: 'demo-3', name: 'Spanish Latte', price: 150, category: 'CLASSIC COFFEE', description: '' },
  { id: 'demo-4', name: 'Matcha Milk', price: 180, category: 'MATCHA SERIES', description: '' },
  { id: 'demo-5', name: 'Shawarma', price: 59, category: 'SNACKS', description: '' },
  { id: 'demo-6', name: 'Croffle', price: 140, category: 'BREAD', description: '' },
  { id: 'demo-7', name: 'Tapsilog', price: 180, category: 'RICE MEAL', description: '' },
];

const createDemoTransactions = (): Order[] => {
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
        const item = DEMO_TX_ITEMS[Math.floor(Math.random() * DEMO_TX_ITEMS.length)];
        return { ...item, quantity: 1 + Math.floor(Math.random() * 2), cartLineId: item.id, modifierTotal: 0, sku: '', isAvailable: true };
      });
      const total = orderItems.reduce((s, it) => s + it.price * it.quantity, 0);
      const useGcash = Math.random() > 0.4;
      result.push({
        id: `DEMO-${String(d).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        items: orderItems,
        total,
        timestamp: ts,
        status: Math.random() > 0.08 ? 'completed' : 'cancelled',
        paymentMethod: useGcash ? 'gcash' : 'cash',
        ...(useGcash ? { gcashReference: `GCR-${Math.floor(Math.random() * 900000) + 100000}` } : {}),
      });
    }
  }
  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

/** Total units sold (sum of line quantities) */
function orderUnitCount(order: Order): number {
  return order.items.reduce((sum, i) => sum + i.quantity, 0);
}

const AdminTransactions = () => {
  const { orders } = usePOS();
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const demoTransactions = useMemo(() => createDemoTransactions(), []);

  const allTransactions = isDemoMode
    ? demoTransactions
    : [...orders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <AdminLayout>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="font-display font-bold text-foreground tracking-wider text-xl">TRANSACTION LOGS</h2>
          <div className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-secondary">
            <Label htmlFor="tx-demo-mode" className="text-xs font-display tracking-wider cursor-pointer whitespace-nowrap">
              {isDemoMode ? 'DEMO' : 'LIVE'}
            </Label>
            <Switch
              id="tx-demo-mode"
              checked={isDemoMode}
              onCheckedChange={setIsDemoMode}
              aria-label={isDemoMode ? 'Demo mode on' : 'Live mode on'}
            />
            <FlaskConical className={cn("h-4 w-4", isDemoMode ? "text-primary" : "text-muted-foreground")} />
          </div>
        </div>

        <div className="brutal-card bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-4 font-display text-xs tracking-wider text-muted-foreground">ORDER ID</th>
                  <th className="text-left p-4 font-display text-xs tracking-wider text-muted-foreground">DATE & TIME</th>
                  <th className="text-left p-4 font-display text-xs tracking-wider text-muted-foreground">ITEMS</th>
                  <th className="text-left p-4 font-display text-xs tracking-wider text-muted-foreground">PAYMENT</th>
                  <th className="text-left p-4 font-display text-xs tracking-wider text-muted-foreground">STATUS</th>
                  <th className="text-right p-4 font-display text-xs tracking-wider text-muted-foreground">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground font-display">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  allTransactions.map((order) => {
                    const units = orderUnitCount(order);
                    return (
                    <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="p-4 font-display font-bold text-foreground text-sm">{order.id}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(order.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-display tabular-nums">
                            {units} item{units === 1 ? '' : 's'}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                            aria-label="View all items"
                            onClick={() => setDetailOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 text-sm">
                            {order.paymentMethod === 'gcash' ? (
                              <Smartphone className="h-4 w-4 text-primary" />
                            ) : (
                              <Banknote className="h-4 w-4 text-primary" />
                            )}
                            <span className="font-display text-xs tracking-wider uppercase">{order.paymentMethod}</span>
                          </div>
                          {order.paymentMethod === 'gcash' && order.gcashReference && (
                            <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={order.gcashReference}>
                              {order.gcashReference}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-1 text-xs font-display tracking-wider",
                          order.status === 'completed' ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                        )}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right font-display font-bold text-foreground tabular-nums">
                        ₱{formatCurrency(order.total)}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider">Order items</DialogTitle>
              <DialogDescription>
                {detailOrder && (
                  <>
                    {detailOrder.id} · {detailOrder.items.length} line
                    {detailOrder.items.length === 1 ? '' : 's'} · {orderUnitCount(detailOrder)} unit
                    {orderUnitCount(detailOrder) === 1 ? '' : 's'}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {detailOrder && (
              <ul className="max-h-[min(60vh,420px)] overflow-y-auto space-y-2 pr-1 [scrollbar-width:thin]">
                {detailOrder.items.map((item, idx) => (
                  <li
                    key={`${item.id}-${idx}`}
                    className="flex justify-between gap-3 py-2 border-b border-border last:border-0 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{item.quantity}× {item.name}</span>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 font-display text-primary tabular-nums">
                      ₱{formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDetailOrder(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminTransactions;
