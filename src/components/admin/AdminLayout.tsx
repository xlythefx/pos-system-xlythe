import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Coffee, ShoppingCart, ClipboardList, BarChart3, FileText, Package, LogOut, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
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
  { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
  { label: 'Transactions', path: '/admin/transactions', icon: FileText },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card">
        {/* Logo */}
        <div className={cn("p-4 border-b border-border", collapsed ? "px-2" : "p-6")}>
          <Link to="/admin" className="flex items-center gap-3">
            <Coffee className="h-8 w-8 text-primary shrink-0" />
            {!collapsed && (
              <div>
                <h1 className="font-display font-bold text-lg text-foreground">GODS WILL</h1>
                <p className="text-xs text-muted-foreground tracking-wider">ADMIN POS</p>
              </div>
            )}
          </Link>
        </div>

        <SidebarGroup>
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

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => navigate('/')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-display text-sm tracking-wider rounded-none border-0 bg-transparent cursor-pointer",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>LOGOUT</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="h-screen overflow-hidden flex w-full">
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
          <main className="flex-1 p-4 md:p-6 min-h-0 overflow-hidden flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
