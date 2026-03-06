'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
    const pathname = usePathname();

    const isNavActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <Activity className="h-6 w-6 text-slate-800" />
                            <span className="font-bold text-xl text-slate-900 tracking-tight">PerformancePilot</span>
                        </div>

                        {/* Desktop Nav Links */}
                        <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isNavActive('/') && !isNavActive('/audit')
                                        ? 'border-slate-800 text-slate-900'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/audit"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isNavActive('/audit')
                                        ? 'border-slate-800 text-slate-900'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                            >
                                New Audit
                            </Link>
                        </div>
                    </div>

                    {/* Right side icons */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Link href="/settings">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
