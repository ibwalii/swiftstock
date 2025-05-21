
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
  User as UserIcon, // Renamed to avoid conflict with local User type
  Users,
  Box, // Import Box for logo icon
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
// Logo component is no longer imported from '@/components/app/logo' as its rendering is handled inline
import { Toaster } from '@/components/ui/toaster';
import { useAuth, type User } from '@/hooks/use-auth';

const baseNavItems = [
  { href: '/pos', icon: ShoppingCart, label: 'Point of Sale', tooltip: 'Point of Sale', roles: ['admin', 'cashier'] },
  { href: '/inventory', icon: Package, label: 'Inventory', tooltip: 'Inventory Management', roles: ['admin'] },
  { href: '/invoicing', icon: FileText, label: 'Invoices', tooltip: 'Invoices & Quotations', roles: ['admin', 'cashier'] },
  { href: '/users', icon: Users, label: 'Users', tooltip: 'User Management', roles: ['admin'] },
];

function getInitials(name?: string | null, email?: string | null) {
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length > 1) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      const emailParts = email.split('@')[0].split(/[._-]/);
      if (emailParts.length > 1) {
          return (emailParts[0][0] + emailParts[1][0]).toUpperCase();
      }
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
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
         <div className="flex items-center gap-2" aria-label="SwiftStock Logo">
            <Box className="h-7 w-7 text-primary" />
            {sidebarState === 'expanded' && (
              <span className="text-xl font-semibold text-primary">SwiftStock</span>
            )}
          </div>
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
                  <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="user avatar" alt={`${user.name} Avatar`} />
                  <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium truncate max-w-[120px]" title={user.name}>{user.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" /> 
                {user.name} ({user.email})
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
                            <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="user avatar" alt={`${user.name} Avatar`} />
                            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" side="right" align="start">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" /> 
                      {user.name} ({user.email})
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
  const { user, isLoadingAuth } = useAuth(); 
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
    // This case should ideally be handled by the redirect logic in useAuth
    // but kept as a fallback.
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
          <SidebarTrigger /> 
          <div className="flex-1">
            {/* Page specific title could go here, managed by pages */}
          </div>
          {/* You can add other header elements here if needed */}
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
