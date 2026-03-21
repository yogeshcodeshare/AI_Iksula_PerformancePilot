'use client';

/**
 * useResultsFilters — encapsulates filter state for the results page table.
 * Extracted from results/page.tsx to reduce component complexity.
 */

import { useState, useMemo } from 'react';
import { AuditPage, MetricResult } from '@/types';

export type StatusFilter = 'all' | 'good' | 'needs-improvement' | 'poor';

interface UseResultsFiltersProps {
  pages: AuditPage[];
  metrics: MetricResult[];
}

export function useResultsFilters({ pages, metrics }: UseResultsFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredPages = useMemo(() => {
    return pages.filter(page => {
      // Search filter
      const matchesSearch = !searchQuery.trim() ||
        page.pageLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.pageType.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter — a page is included if it has at least one metric matching the filter
      if (statusFilter === 'all') return true;

      return metrics.some(m => m.pageId === page.pageId && m.status === statusFilter);
    });
  }, [pages, metrics, searchQuery, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setShowFilterMenu(false);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    showFilterMenu,
    setShowFilterMenu,
    filteredPages,
    hasActiveFilters,
    clearFilters
  };
}
