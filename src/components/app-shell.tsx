import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/brand-lockup";
import {
  LayoutDashboard, Users, Calendar, FileText, Receipt,
  Star, Sparkles, Settings, ShieldAlert, LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/bookings", label: "Bookings", icon: Calendar },
  { to: "/estimates", label: "Estimates", icon: FileText },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/marketing", label: "Marketing", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [bizName, setBizName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u?.user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
        setIsAdmin(!!roles?.some((r) => r.role === "admin") || u.user.email === "hamdi.rabahksu@gmail.com");
      }
      const { data: biz } = await supabase.from("businesses").select("name").maybeSingle();
      setBizName(biz?.name ?? null);
    })();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <BrandLockup size="sm" href="/app" showSubtitle={false} />
        <button onClick={() => setOpen(!open)} className="grid h-9 w-9 place-items-center rounded-md border border-border">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${open ? "block" : "hidden"} md:block fixed md:sticky top-0 z-30 h-screen w-64 shrink-0 border-r border-border bg-card/40`}>
          <div className="hidden items-center gap-3 border-b border-border px-5 py-5 md:flex">
            <BrandLockup size="md" href="/app" />
          </div>
          {bizName && <div className="hidden px-5 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:block">{bizName}</div>}
          <nav className="flex flex-col gap-0.5 p-3">
            {NAV.map((item) => {
              const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)}
                className={`mt-2 flex items-center gap-3 rounded-md border border-primary/30 px-3 py-2 text-sm ${
                  pathname.startsWith("/admin") ? "bg-primary/15 text-primary" : "text-primary/80 hover:bg-primary/10"
                }`}>
                <ShieldAlert className="h-4 w-4" /> Admin
              </Link>
            )}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
            <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {(title || subtitle) && (
            <div className="border-b border-border px-6 py-6">
              {subtitle && <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">{subtitle}</p>}
              {title && <h1 className="mt-1 font-display text-3xl">{title}</h1>}
            </div>
          )}
          <div className="px-4 py-6 md:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
