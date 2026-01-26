'use client';

import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  userName?: string;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Search..."
          className="pl-10"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        <div className="h-6 w-px bg-slate-200" />
        <div className="text-sm">
          <span className="text-slate-500">Welcome back,</span>{' '}
          <span className="font-medium text-slate-900">{userName}</span>
        </div>
      </div>
    </header>
  );
}
