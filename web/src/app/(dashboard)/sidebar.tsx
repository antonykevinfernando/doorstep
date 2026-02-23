'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ArrowRightLeft,
  ClipboardCheck,
  MessageCircle,
  Users,
  Settings,
  PanelLeft,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/residents', label: 'Residents', icon: Users },
  { href: '/moves', label: 'Moves', icon: ArrowRightLeft },
  { href: '/checklists', label: 'Checklists', icon: ClipboardCheck },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  displayName: string;
  role: string;
  userId: string;
  initialUnread: number;
}

export function Sidebar({ displayName, role, userId, initialUnread }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const pathname = usePathname();
  const router = useRouter();
  const supabaseRef = useRef(createClient());

  // Live-update unread count via Realtime
  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel('sidebar-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.sender_id !== userId) {
            setUnread((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Clear badge when on messages page
  useEffect(() => {
    if (pathname.startsWith('/messages')) {
      setUnread(0);
    }
  }, [pathname]);

  async function handleLogout() {
    const supabase = supabaseRef.current;
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className={`glass rounded-2xl flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[68px] p-3' : 'w-60 p-5'
      }`}
    >
      <Link
        href="/moves"
        className={`flex items-center gap-2.5 mb-8 ${collapsed ? 'justify-center px-0' : 'px-3'}`}
      >
        <Image
          src="/doorstep-logo.png"
          alt="Doorstep"
          width={34}
          height={34}
          className="rounded-lg shrink-0"
        />
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight">doorstep</span>
        )}
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          const showBadge = item.href === '/messages' && unread > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center rounded-xl text-sm font-medium transition-colors ${
                collapsed
                  ? 'justify-center p-2.5'
                  : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'text-foreground font-semibold'
                  : 'text-foreground/45 hover:text-foreground/80'
              }`}
            >
              <div className="relative shrink-0">
                <Icon size={18} strokeWidth={1.8} />
                {showBadge && collapsed && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
                )}
              </div>
              {!collapsed && item.label}
              {showBadge && !collapsed && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-foreground/5 pt-4 mt-4 ${collapsed ? 'px-0' : 'px-3'}`}>
        {!collapsed && (
          <>
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </>
        )}

        <div className={`flex ${collapsed ? 'flex-col items-center gap-2 mt-1' : 'items-center justify-between mt-3'}`}>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={15} strokeWidth={1.8} />
            {!collapsed && 'Sign out'}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <PanelLeft
              size={16}
              strokeWidth={1.8}
              className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
