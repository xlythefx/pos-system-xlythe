import AdminLayout from '@/components/admin/AdminLayout';
import { usePOS } from '@/contexts/POSContext';
import { format } from 'date-fns';
import { Banknote, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminTransactions = () => {
  const { orders } = usePOS();

  const allTransactions = [...orders].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="font-display font-bold text-foreground tracking-wider text-xl">TRANSACTION LOGS</h2>

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
                  allTransactions.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="p-4 font-display font-bold text-foreground text-sm">{order.id}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(order.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="p-4 text-sm text-foreground max-w-[200px]">
                        <div className="space-y-0.5">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="truncate text-xs">
                              {item.quantity}x {item.name}
                            </p>
                          ))}
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
                      <td className="p-4 text-right font-display font-bold text-foreground">
                        ₱{order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTransactions;
