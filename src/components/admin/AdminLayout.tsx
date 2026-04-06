import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Coffee, ShoppingCart, ClipboardList, BarChart3, FileText, Package, LogOut, Sun, Moon, ShieldAlert, Calculator } from 'lucide-react';
import { activeCafe } from '@/lib/cafe-config';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useTheme } from 'next-themes';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'POS', path: '/admin', icon: ShoppingCart },
  { label: 'Inventory', path: '/admin/inventory', icon: Package },
  { label: 'Audit', path: '/admin/audit', icon: ShieldAlert },
  { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
  { label: 'Transactions', path: '/admin/transactions', icon: FileText },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Profitability', path: '/admin/profitability', icon: Calculator },
];

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border h-screen sticky top-0">
      <SidebarContent className="bg-card flex-1">
        {/* Logo */}
        <div className={cn("border-b border-border shrink-0", collapsed ? "px-2 py-4" : "p-6")}>
          <Link to="/admin" className="flex items-center gap-3">
            <Coffee className="h-8 w-8 text-primary shrink-0" />
            {!collapsed && (
              <div>
                <h1 className="font-display font-bold text-lg text-foreground">{activeCafe.displayName.toUpperCase()}</h1>
                <p className="text-xs text-muted-foreground tracking-wider">ADMIN POS</p>
              </div>
            )}
          </Link>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 font-display text-sm tracking-wider transition-all",
                        location.pathname === item.path
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-card border-t border-border p-0">
        <button
          onClick={() => navigate('/')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-display text-sm tracking-wider border-0 bg-transparent cursor-pointer",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>LOGOUT</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="h-screen flex w-full overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <header className="h-12 flex items-center justify-between border-b border-border bg-card px-2 shrink-0">
            <SidebarTrigger className="ml-1" />
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-secondary transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </header>
          <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
