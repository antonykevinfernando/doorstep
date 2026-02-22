'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ArrowRightLeft,
  ClipboardCheck,
  FileText,
  MessageCircle,
  UserCheck,
  Settings,
  PanelLeft,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/approvals', label: 'Approvals', icon: UserCheck },
  { href: '/moves', label: 'Moves', icon: ArrowRightLeft },
  { href: '/checklists', label: 'Checklists', icon: ClipboardCheck },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  displayName: string;
  role: string;
}

export function Sidebar({ displayName, role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
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
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-xl text-sm font-medium transition-colors ${
                collapsed
                  ? 'justify-center p-2.5'
                  : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'text-foreground font-semibold'
                  : 'text-foreground/45 hover:text-foreground/80'
              }`}
            >
              <Icon size={18} strokeWidth={1.8} className="shrink-0" />
              {!collapsed && item.label}
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
