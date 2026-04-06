import { useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { Minus, Plus, Trash2, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ReceiptDialog from '@/components/admin/ReceiptDialog';
import { formatCurrency } from '@/lib/utils';
import type { Order } from '@/contexts/POSContext';

const QUICK_AMOUNTS = [100, 200, 500, 1000];

const POSCart = () => {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart, completeOrder } = usePOS();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [amountReceivedStr, setAmountReceivedStr] = useState('');

  const amountReceived = parseFloat(amountReceivedStr) || 0;
  const change = amountReceived >= cartTotal ? amountReceived - cartTotal : 0;
  const isAmountValid = amountReceived >= cartTotal;

  const resetPaymentState = () => {
    setAmountReceivedStr('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetPaymentState();
    setPaymentDialogOpen(open);
  };

  const handlePaymentComplete = (method: 'cash' | 'gcash', opts?: { amountReceived?: number; gcashReference?: string }) => {
    const order = completeOrder(method, opts);
    handleOpenChange(false);
    if (order) {
      setReceiptOrder(order);
      setReceiptOpen(true);
    }
    resetPaymentState();
  };

  const handleCashConfirm = () => {
    if (!isAmountValid) return;
    handlePaymentComplete('cash', { amountReceived });
  };

  const setQuickAmount = (amt: number) => {
    if (amt === 0) {
      setAmountReceivedStr(cartTotal.toString());
    } else {
      const current = parseFloat(amountReceivedStr) || 0;
      setAmountReceivedStr((current + amt).toString());
    }
  };

  return (
    <div className="flex flex-col h-full bg-card min-h-0">
      {/* Header - fixed */}
      <div className="p-4 flex items-center justify-between shrink-0">
        <h2 className="font-display font-bold text-foreground tracking-wider">CURRENT ORDER</h2>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Cart Items - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {cart.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="font-display font-medium text-sm tracking-wide">No items in cart</p>
            <p className="text-xs mt-1 font-sans">Tap items to add them</p>
          </div>
        ) : (
          cart.map((item) => {
            const unitPrice = item.price + item.modifierTotal;
            return (
              <div
                key={item.cartLineId}
                className="flex items-start gap-3 p-3 bg-secondary animate-fade-in-up transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground truncate tracking-tight">
                    {item.name}
                  </p>
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-primary mt-0.5">
                    ₱{formatCurrency(unitPrice * item.quantity)}
                    {item.quantity > 1 && (
                      <span className="text-muted-foreground text-xs ml-1">×{item.quantity}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.cartLineId, item.quantity - 1)}
                    className="p-1 bg-background hover:bg-muted transition-colors duration-200 rounded"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-display w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartLineId, item.quantity + 1)}
                    className="p-1 bg-background hover:bg-muted transition-colors duration-200 rounded"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.cartLineId)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer - fixed (TOTAL + CHARGE always visible) */}
      <div className="p-4 space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-muted-foreground tracking-wider">TOTAL</span>
          <span className="font-display text-2xl font-bold text-foreground">
            ₱{formatCurrency(cartTotal)}
          </span>
        </div>
        
        <Button
          onClick={() => setPaymentDialogOpen(true)}
          disabled={cart.length === 0}
          className="w-full h-14 font-display tracking-wider text-lg bg-primary hover:bg-primary/90"
        >
          CHARGE ₱{formatCurrency(cartTotal)}
        </Button>
      </div>

      {/* Payment Dialog - Cash only */}
      <Dialog open={paymentDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md transition-all duration-200 ease-out">
          <DialogHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
              className="absolute left-0 top-0 h-8 w-8 -translate-y-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
                <DialogTitle className="font-display tracking-wider pl-10 pr-8">CASH PAYMENT</DialogTitle>
                <DialogDescription>Total: ₱{formatCurrency(cartTotal)} · Enter amount received</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-display text-muted-foreground tracking-wider mb-2 block">
                    AMOUNT RECEIVED
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={amountReceivedStr}
                    onChange={(e) => setAmountReceivedStr(e.target.value)}
                    className="text-lg font-display h-12"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setQuickAmount(amt)}
                      className="px-3 py-2 bg-secondary hover:bg-muted font-display font-bold transition-all duration-200 active:scale-[0.98]"
                    >
                      +₱{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setQuickAmount(0)}
                    className="px-3 py-2 bg-secondary hover:bg-muted font-display font-bold transition-all duration-200 active:scale-[0.98]"
                  >
                    Exact
                  </button>
                </div>
                {amountReceived > 0 && (
                  <div className="p-4 bg-secondary space-y-2 transition-opacity duration-200">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-display">Total</span>
                      <span className="font-display font-semibold">₱{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-display">Received</span>
                      <span className="font-display font-semibold">₱{formatCurrency(amountReceived)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-display font-bold">CHANGE</span>
                      <span className="font-display text-lg font-bold text-primary">
                        ₱{formatCurrency(change)}
                      </span>
                    </div>
                  </div>
                )}
                {amountReceivedStr && !isAmountValid && (
                  <p className="text-sm text-destructive font-display">Amount received must be at least ₱{formatCurrency(cartTotal)}</p>
                )}
                <Button
                  onClick={handleCashConfirm}
                  disabled={!isAmountValid}
                  className="w-full h-12 font-display tracking-wider text-base"
                >
                  CONFIRM PAYMENT
                </Button>
              </div>
        </DialogContent>
      </Dialog>

      <ReceiptDialog
        order={receiptOrder}
        open={receiptOpen}
        onOpenChange={(open) => {
          setReceiptOpen(open);
          if (!open) setReceiptOrder(null);
        }}
      />
    </div>
  );
};

export default POSCart;
