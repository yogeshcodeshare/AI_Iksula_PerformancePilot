// Build the app in "team mode" for E2E: Supabase is configured, but pointed at
// a fake host that Playwright intercepts (e2e/team/supabaseMock.ts).
// No real Supabase project, key or network is used.
import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_DIST_DIR: 'dist-team',
    NEXT_PUBLIC_SUPABASE_URL: 'https://sb-e2e.test',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
  },
});
process.exit(r.status ?? 1);
