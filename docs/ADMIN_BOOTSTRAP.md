# First administrator setup

The application intentionally does not grant administrator privileges from a hard-coded email address. Create the first administrator explicitly after the owner account has signed up.

1. In Supabase Dashboard, open Authentication and find the owner account.
2. Copy that account's user UUID (not its email address).
3. Open the SQL Editor for the correct project and run the following after replacing the UUID placeholder:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE_AUTH_USER_UUID_HERE'::uuid, 'admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;
```

4. Sign out and sign back in, then verify that the admin screen is available.
5. Keep the administrator list small and enable strong authentication on every administrator account.

Never grant `admin` to an unverified user. Do not put a real email address, project URL, API key, or user UUID in source code or an issue report.
