# Supabase (optional backend)

Decision: [D005](../decisions.md). Rules: [architecture/database-sop.md](../architecture/database-sop.md).
The app works without any of this. These steps switch on central error logging (Phase A), then login and saved runs (Phases B and C).

## One-time setup (project owner)
1. Create a project at supabase.com with the company account. Region: **Mumbai (ap-south-1)**. Store the database password in a password manager.
2. **Database → Extensions:** enable `pg_cron` (needed for 90-day log cleanup).
3. **Apply migrations** in file-name order (`migrations/*.sql`):
   - either let Claude Code apply them through the Supabase MCP, or
   - **SQL Editor → New query →** paste the file → **Run**.
4. **Authentication → Providers → Email:** turn **OFF** "Allow new users to sign up" (invite-only; needed from Phase B).
5. **Project Settings → API:** copy the **Project URL** and the **anon public** key. In **Vercel → Project → Settings → Environment Variables** add, for Production and Preview:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Then redeploy. **Never** add the `service_role` key to Vercel, the repo or chat.

## Verify Phase A
- Run an audit with a URL that does not exist (e.g. `https://pp-test-no-such-domain-7731.com/`).
- Supabase → **Table Editor → audit_failures**: two new rows (mobile + desktop, `page-unreachable`).
- The New Audit page shows the privacy note ("If an audit fails, the page URL and the error …").

## Reading the error log
Supabase → **Table Editor → audit_failures** (filter by `error_code`, `url`, date), or SQL:
```sql
select error_code, count(*) as failures, count(distinct url) as urls
from audit_failures
where created_at > now() - interval '7 days'
group by error_code
order by failures desc;
```
