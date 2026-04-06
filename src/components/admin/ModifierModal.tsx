import { useState, useEffect } from 'react';
import type { MenuItem, ModifierGroup, SelectedModifier } from '@/contexts/POSContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ModifierModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItem, selectedModifiers: SelectedModifier[]) => void;
}

function buildInitialSelections(groups: ModifierGroup[]): SelectedModifier[] {
  const selections: SelectedModifier[] = [];
  for (const group of groups) {
    if (group.required && group.options.length > 0) {
      const opt = group.options[0];
      selections.push({ groupId: group.id, groupName: group.name, optionId: opt.id, optionName: opt.name, price: opt.price });
    }
  }
  return selections;
}

const ModifierModal = ({ item, open, onClose, onConfirm }: ModifierModalProps) => {
  const [selections, setSelections] = useState<SelectedModifier[]>([]);

  useEffect(() => {
    if (item?.modifierGroups) {
      setSelections(buildInitialSelections(item.modifierGroups));
    }
  }, [item]);

  if (!item) return null;

  const groups = item.modifierGroups ?? [];

  const isSelected = (groupId: string, optionId: string) =>
    selections.some((s) => s.groupId === groupId && s.optionId === optionId);

  const toggle = (group: ModifierGroup, optionId: string) => {
    const opt = group.options.find((o) => o.id === optionId);
    if (!opt) return;

    setSelections((prev) => {
      if (group.multiSelect) {
        // Toggle individual option; keep required group at ≥1 selected
        const already = prev.some((s) => s.groupId === group.id && s.optionId === optionId);
        if (already) {
          const remaining = prev.filter((s) => !(s.groupId === group.id && s.optionId === optionId));
          // Don't allow deselecting the last option in a required group
          if (group.required && !remaining.some((s) => s.groupId === group.id)) return prev;
          return remaining;
        }
        return [...prev, { groupId: group.id, groupName: group.name, optionId: opt.id, optionName: opt.name, price: opt.price }];
      } else {
        // Single-select: replace existing selection for this group
        const others = prev.filter((s) => s.groupId !== group.id);
        return [...others, { groupId: group.id, groupName: group.name, optionId: opt.id, optionName: opt.name, price: opt.price }];
      }
    });
  };

  const requiredGroups = groups.filter((g) => g.required);
  const allRequiredMet = requiredGroups.every((g) => selections.some((s) => s.groupId === g.id));

  const modifierTotal = selections.reduce((s, m) => s + m.price, 0);
  const totalPrice = item.price + modifierTotal;

  const handleConfirm = () => {
    if (!allRequiredMet) return;
    onConfirm(item, selections);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">{item.name}</DialogTitle>
          <DialogDescription className="font-sans text-sm">
            {item.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1 [scrollbar-width:thin]">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="font-display font-semibold tracking-wider text-sm uppercase">{group.name}</p>
                {group.required && (
                  <span className="text-[10px] font-display tracking-wider text-primary border border-primary px-1.5 py-0.5 leading-none">
                    REQUIRED
                  </span>
                )}
                {group.multiSelect && (
                  <span className="text-[10px] font-display tracking-wider text-muted-foreground">
                    pick any
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((opt) => {
                  const selected = isSelected(group.id, opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggle(group, opt.id)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 border-2 text-left transition-all duration-150 active:scale-[0.97]',
                        selected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-secondary hover:border-primary/50 text-muted-foreground'
                      )}
                    >
                      <span className="font-display text-sm font-medium">{opt.name}</span>
                      <span className={cn('text-xs font-display', selected ? 'text-primary font-bold' : 'text-muted-foreground')}>
                        {selected && <Check className="inline h-3 w-3 mr-0.5" />}
                        {opt.price > 0 ? `+₱${opt.price.toFixed(0)}` : 'FREE'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border space-y-3">
          {modifierTotal > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="font-display tracking-wider">BASE</span>
              <span>₱{formatCurrency(item.price)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-display font-bold tracking-wider">TOTAL</span>
            <span className="font-display font-bold text-primary text-lg">₱{formatCurrency(totalPrice)}</span>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!allRequiredMet}
            className="w-full h-12 font-display tracking-wider"
          >
            ADD TO ORDER · ₱{formatCurrency(totalPrice)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModifierModal;
