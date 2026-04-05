import { useRef } from "react";
import { format } from "date-fns";
import type { Order } from "@/contexts/POSContext";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ReceiptDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReceiptDialog = ({ order, open, onOpenChange }: ReceiptDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!order || !printRef.current) return;

    const content = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=340,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              width: 280px;
              margin: 0 auto;
              padding: 20px 12px;
              font-size: 12px;
              color: #000;
              background: #fff;
            }
            .receipt { max-width: 256px; margin: 0 auto; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #333; margin: 12px 0; }
            .divider-thick { border-top: 2px solid #333; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; gap: 16px; }
            .row-item { flex: 1; }
            .row-price { text-align: right; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 8px 0; }
            .item-name { font-weight: 600; }
            .item-desc { font-size: 10px; color: #555; margin-left: 12px; margin-bottom: 2px; }
            .item-line { display: flex; justify-content: space-between; margin: 2px 0 2px 12px; }
            .footer { margin-top: 20px; padding-top: 12px; border-top: 2px solid #000; text-align: center; font-size: 10px; color: #333; }
            .store { font-size: 18px; letter-spacing: 2px; margin-bottom: 4px; }
            .time { font-size: 11px; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center store bold">GODS WILL CAFE</div>
            <div class="center" style="font-size: 11px; margin-bottom: 8px;">Brutalist Coffee Experience</div>
            <div class="divider"></div>

            <div class="row"><span>Order No.</span><span>${order.id}</span></div>
            <div class="row"><span>Date</span><span>${format(new Date(order.timestamp), "MMM dd, yyyy")}</span></div>
            <div class="row"><span>Time</span><span>${format(new Date(order.timestamp), "hh:mm:ss a")}</span></div>
            <div class="row"><span>Payment</span><span>${order.paymentMethod.toUpperCase()}</span></div>
            ${order.paymentMethod === 'gcash' && order.gcashReference ? `<div class="row"><span>Ref No.</span><span>${order.gcashReference}</span></div>` : ''}
            <div class="divider"></div>

            <div class="bold" style="margin-bottom: 6px;">ITEMS</div>
            ${order.items
              .map(
                (item) => `
              <div class="item-name">${item.quantity}x ${item.name}</div>
              ${item.description ? `<div class="item-desc">${item.description}</div>` : ""}
              <div class="item-line">
                <span>@ ₱${formatCurrency(item.price)}</span>
                <span>₱${formatCurrency(item.price * item.quantity)}</span>
              </div>
            `
              )
              .join("")}

            <div class="divider-thick"></div>
            <div class="total-row"><span>TOTAL</span><span>₱${formatCurrency(order.total)}</span></div>
            ${order.paymentMethod === 'cash' && order.amountReceived != null && order.change != null ? `
            <div class="row"><span>Amount Received</span><span>₱${formatCurrency(order.amountReceived)}</span></div>
            <div class="total-row" style="color: #166534;"><span>CHANGE</span><span>₱${formatCurrency(order.change)}</span></div>
            ` : ''}
            <div class="divider"></div>

            <div class="center" style="margin: 12px 0; font-size: 11px;">Thank you for your order!</div>
            <div class="center" style="font-size: 11px;">We hope to see you again.</div>

            <div class="footer">
              <div class="bold">Nap.AI Digital Solutions</div>
              <div>Binangonan, Rizal</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">
            Order Complete
          </DialogTitle>
          <DialogDescription>
            Receipt for {order.id} · {order.paymentMethod.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="hidden" aria-hidden="true">
          {/* Hidden - actual print uses custom HTML above */}
        </div>

        <div className="rounded border-2 border-border bg-secondary p-4 font-mono text-sm">
          <div className="text-center font-display font-bold text-lg mb-3">
            GODS WILL CAFE
          </div>
          <div className="space-y-1 text-muted-foreground mb-4">
            <div className="flex justify-between">
              <span>Order</span>
              <span>{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{format(new Date(order.timestamp), "MMM dd, yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span>Time</span>
              <span>{format(new Date(order.timestamp), "hh:mm a")}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment</span>
              <span>{order.paymentMethod.toUpperCase()}</span>
            </div>
            {order.paymentMethod === 'gcash' && order.gcashReference && (
              <div className="flex justify-between">
                <span>Ref No.</span>
                <span>{order.gcashReference}</span>
              </div>
            )}
          </div>
          <div className="border-t border-border py-3 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.quantity}x {item.name}</span>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <span className="text-primary font-display">
                  ₱{formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-border pt-3 space-y-2">
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL</span>
              <span className="text-primary">₱{formatCurrency(order.total)}</span>
            </div>
            {order.paymentMethod === 'cash' && order.amountReceived != null && order.change != null && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount received</span>
                  <span>₱{formatCurrency(order.amountReceived)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-primary">
                  <span>CHANGE</span>
                  <span>₱{formatCurrency(order.change)}</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-border text-center text-xs text-muted-foreground">
            <p className="font-display font-medium text-foreground">Nap.AI Digital Solutions</p>
            <p>Binangonan, Rizal</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDialog;
