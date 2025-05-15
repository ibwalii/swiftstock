
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Package,
  FileText,
  Settings,
  ChevronDown,
  LogOut,
  Loader2,
  User as UserIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/app/logo';
import { Toaster } from '@/components/ui/toaster';
import { useAuth, type User } from '@/hooks/use-auth';

const baseNavItems = [
  { href: '/pos', icon: ShoppingCart, label: 'Point of Sale', tooltip: 'Point of Sale', roles: ['admin', 'cashier'] },
  { href: '/inventory', icon: Package, label: 'Inventory', tooltip: 'Inventory Management', roles: ['admin'] },
  { href: '/invoicing', icon: FileText, label: 'Invoices', tooltip: 'Invoices & Quotations', roles: ['admin', 'cashier'] },
];

function getInitials(email?: string | null) {
    if (!email) return 'U';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
}


function AppSidebar() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const navItems = baseNavItems.filter(item => user && item.roles.includes(user.role));

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="h-16 items-center justify-center p-4 md:justify-start">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{
                    children: item.tooltip,
                    className: 'bg-primary text-primary-foreground', 
                  }}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
         {sidebarState === 'expanded' && user && (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="user avatar" alt={`${user.email} Avatar`} />
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium truncate max-w-[120px]" title={user.email}>{user.email}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" /> 
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
         )}
         {sidebarState === 'collapsed' && user && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="user avatar" alt={`${user.email} Avatar`} />
                            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" side="right" align="start">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" /> 
                      {user.email}
                      </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
         )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoadingAuth } = useAuth(); // Use `user` instead of `isLoggedIn` for more context
  const [clientRendered, setClientRendered] = React.useState(false);

  React.useEffect(() => {
    setClientRendered(true);
  }, []);


  if (!clientRendered || isLoadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-2">Redirecting to login...</p>
        </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Page specific title could go here, managed by pages */}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}

