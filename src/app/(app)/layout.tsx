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

const navItems = [
  { href: '/pos', icon: ShoppingCart, label: 'Point of Sale', tooltip: 'Point of Sale' },
  { href: '/inventory', icon: Package, label: 'Inventory', tooltip: 'Inventory Management' },
  { href: '/invoicing', icon: FileText, label: 'Invoices', tooltip: 'Invoices & Quotations' },
];

function AppSidebar() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();

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
                    className: 'bg-primary text-primary-foreground', // Custom tooltip style
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
         {sidebarState === 'expanded' && (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarImage src="https://picsum.photos/40/40" data-ai-hint="user avatar" alt="User Avatar" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">John Doe</span>
                  <span className="text-xs text-muted-foreground">john.doe@example.com</span>
                </div>
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
         )}
         {sidebarState === 'collapsed' && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://picsum.photos/40/40" data-ai-hint="user avatar" alt="User Avatar" />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" side="right" align="start">
                    <DropdownMenuLabel>John Doe</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
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
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Page specific title could go here, managed by pages */}
          </div>
          {/* Add other header elements if needed, like search or notifications */}
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
