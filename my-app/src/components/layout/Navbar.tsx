'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';

export function Navbar() {
    const pathname = usePathname();

    const isNavActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    return (
        <nav className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 transition-colors">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
                {/* Left: Logo + Nav Links */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 no-underline">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-foreground">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        <span className="font-semibold text-base text-foreground tracking-[-0.02em]">PerformancePilot</span>
                    </Link>
                    <div className="hidden sm:flex items-center gap-6">
                        <Link
                            href="/"
                            className={`relative text-sm font-medium transition-colors py-1 ${
                                isNavActive('/') && !isNavActive('/audit') && !isNavActive('/compare') && !isNavActive('/settings') && !isNavActive('/results') && !isNavActive('/about')
                                    ? 'text-foreground after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[1.5px] after:bg-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/audit"
                            className={`relative text-sm font-medium transition-colors py-1 ${
                                isNavActive('/audit')
                                    ? 'text-foreground after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[1.5px] after:bg-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            New Audit
                        </Link>
                        <Link
                            href="/about"
                            className={`relative text-sm font-medium transition-colors py-1 ${
                                isNavActive('/about')
                                    ? 'text-foreground after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[1.5px] after:bg-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            About
                        </Link>
                    </div>
                </div>

                {/* Right: Settings */}
                <div className="flex items-center gap-3">
                    <Link href="/settings">
                        <button className="p-2 rounded-lg border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
                            <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
                        </button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
