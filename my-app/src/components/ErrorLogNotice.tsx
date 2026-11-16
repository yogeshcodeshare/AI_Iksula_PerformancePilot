'use client';

import { useEffect, useState } from 'react';
import { isSupabaseEnabled } from '@/lib/supabase';

/**
 * Privacy notice required by architecture/database-sop.md.
 * Rendered only in the browser and only when central error logging is enabled,
 * so the static (prerendered) HTML never differs from the first client render.
 */
export function ErrorLogNotice() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(isSupabaseEnabled());
  }, []);
  if (!enabled) return null;
  return (
    <p className="text-xs text-muted-foreground mt-3" data-testid="error-log-notice">
      If an audit fails, the page URL and the error (no personal data) are logged to help the Iksula team fix issues. Logs are deleted after 90 days.
    </p>
  );
}
