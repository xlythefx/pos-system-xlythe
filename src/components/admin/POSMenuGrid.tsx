import { useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { DRINK_SUB_CATEGORIES, MAIN_CATEGORIES } from '@/lib/pos-categories';
import { cn } from '@/lib/utils';
import { Plus, ChevronDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const drinkSubCategories = [...DRINK_SUB_CATEGORIES];
const mainCategories = [...MAIN_CATEGORIES];

const POSMenuGrid = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [drinksExpanded, setDrinksExpanded] = useState(false);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, menuItems } = usePOS();

  const isDrinkActive = activeSubCategory !== null || activeCategory === 'DRINKS';

  const handleMainCategory = (cat: string) => {
    if (cat === 'DRINKS') {
      setDrinksExpanded(!drinksExpanded);
      if (!drinksExpanded) {
        setActiveCategory('DRINKS');
        setActiveSubCategory(null);
      }
    } else {
      setActiveCategory(cat);
      setActiveSubCategory(null);
      setDrinksExpanded(false);
    }
  };

  const handleSubCategory = (sub: string) => {
    setActiveCategory('DRINKS');
    setActiveSubCategory(sub);
  };

  const filteredItems = (() => {
    let items = menuItems;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (activeCategory === 'ALL') return items;
    if (activeCategory === 'DRINKS' && !activeSubCategory) {
      return items.filter(item => drinkSubCategories.includes(item.category));
    }
    if (activeSubCategory) {
      return items.filter(item => item.category === activeSubCategory);
    }
    return items.filter(item => item.category === activeCategory);
  })();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search Bar */}
      <div className="relative mb-3 transition-all duration-200">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 font-display text-sm tracking-wide"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      {/* Category Tabs */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {mainCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => { handleMainCategory(cat); setSearchQuery(''); }}
              className={cn(
                "px-4 py-3 touch-target font-display text-sm font-semibold tracking-wider whitespace-nowrap transition-all duration-300 ease-out flex items-center gap-1.5",
                cat === 'DRINKS'
                  ? isDrinkActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
                  : activeCategory === cat && !activeSubCategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
              )}
            >
              {cat}
              {cat === 'DRINKS' && (
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300 ease-out", drinksExpanded && "rotate-180")} />
              )}
            </button>
          ))}
        </div>

        {/* Drink Sub-Categories */}
        {drinksExpanded && (
          <div className="flex gap-2 overflow-x-auto pb-1 pl-2 animate-fade-in-up [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {drinkSubCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => handleSubCategory(sub)}
                className={cn(
                  "px-3 py-2 touch-target font-display text-xs font-medium tracking-wider whitespace-nowrap transition-all duration-300 ease-out",
                  activeSubCategory === sub
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                )}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Grid - scroll only here, scrollbar hidden */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {filteredItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => addToCart(item)}
            className="brutal-card bg-card p-4 text-left group hover:bg-secondary transition-all duration-300 ease-out hover:scale-[1.02] relative animate-fade-in-up"
            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-primary font-display font-medium tracking-wider mb-1 uppercase">
              {item.category}
            </p>
            <h3 className="font-display font-semibold text-foreground mb-1 tracking-tight">
              {item.name}
            </h3>
            <p className="text-xs text-muted-foreground font-sans mb-2 line-clamp-1">
              {item.description}
            </p>
            <p className="font-display font-bold text-primary tracking-tight">
              ₱{item.price.toFixed(2)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default POSMenuGrid;
