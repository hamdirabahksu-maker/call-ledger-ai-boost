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
        setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      }
      const { data: biz } = await supabase.from("businesses").select("name").maybeSingle();
      setBizName(biz?.name ?? null);
    })();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-3 py-2 backdrop-blur md:hidden">
        <BrandLockup size="sm" href="/app" showSubtitle={false} />
        <button onClick={() => setOpen(!open)} aria-label="Toggle navigation" className="press grid h-8 w-8 place-items-center rounded-full border border-border">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar — denser to match Figma AppShell */}
        <aside className={`${open ? "block" : "hidden"} md:block fixed md:sticky top-0 z-30 h-screen w-[220px] shrink-0 border-r border-border bg-card/30`}>
          <div className="hidden items-center gap-2 border-b border-border px-3.5 py-3 md:flex">
            <BrandLockup size="sm" href="/app" showSubtitle={false} />
          </div>
          {bizName && (
            <div className="hidden truncate px-3.5 pt-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground md:block">
              {bizName}
            </div>
          )}
          <nav className="flex flex-col gap-px p-2">
            {NAV.map((item) => {
              const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                  className={`press relative flex h-8 items-center gap-2 rounded-full px-2.5 text-[12.5px] leading-none ${
                    active ? "bg-primary/15 font-semibold text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}>
                  <span
                    aria-hidden
                    className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200 ease-out ${
                      active ? "h-3.5 w-[2.5px] opacity-100" : "h-0 w-[2.5px] opacity-0"
                    }`}
                  />
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)}
                className={`press mt-1.5 flex h-8 items-center gap-2 rounded-full border border-primary/30 px-2.5 text-[12.5px] ${
                  pathname.startsWith("/admin") ? "bg-primary/15 text-primary" : "text-primary/80 hover:bg-primary/10"
                }`}>
                <ShieldAlert className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-border p-2">
            <button onClick={signOut} className="press flex h-8 w-full items-center gap-2 rounded-full px-2.5 text-[12.5px] text-muted-foreground hover:bg-accent/60 hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 animate-page-enter">
          {(title || subtitle) && (
            <div className="border-b border-border px-4 py-3.5 md:px-5">
              {subtitle && <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">{subtitle}</p>}
              {title && <h1 className={`font-display text-[26px] leading-tight ${subtitle ? "mt-0.5" : ""}`}>{title}</h1>}
            </div>
          )}
          <div className="px-4 py-4 md:px-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
