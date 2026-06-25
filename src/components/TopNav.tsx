import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getActiveProfile, getProfiles, setActiveProfileId, type Profile } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";
import { ChevronDown, Pill, Settings, UserPlus } from "lucide-react";

export function TopNav() {
  const router = useRouter();
  const navigate = useNavigate();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [active, setActive] = useState<Profile | null>(null);

  const refresh = () => {
    setProfiles(getProfiles());
    setActive(getActiveProfile());
  };

  useEffect(() => {
    refresh();
  }, []);

  const choose = (id: string) => {
    setActiveProfileId(id);
    setOpen(false);
    refresh();
    router.invalidate();
  };

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Pill className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold text-navy">OTC&amp;Me</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {active && (
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl border bg-card px-2.5 py-1.5 text-left shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-teal text-sm font-semibold text-white">
                {active.profile_name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-semibold text-navy">{active.profile_name}</span>
                <span className="text-[11px] text-muted-foreground">
                  Age {active.age} · {active.gender}
                </span>
              </span>
              <span className="flex flex-col leading-tight sm:hidden">
                <span className="text-sm font-semibold text-navy">{active.profile_name}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {open && (
              <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border bg-popover shadow-lg">
                <div className="border-b bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("nav_switch_profile")}
                  </p>
                </div>
                <div className="p-1">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => choose(p.id)}
                      className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-accent ${
                        p.id === active.id ? "bg-accent" : ""
                      }`}
                    >
                      <span>{p.profile_name}</span>
                      <span className="text-xs text-muted-foreground">{t("onb_age")} {p.age}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: "/settings" });
                    }}
                  >
                    <Settings className="h-4 w-4" /> {t("nav_settings")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: "/onboarding" });
                    }}
                  >
                    <UserPlus className="h-4 w-4" /> {t("nav_add_profile")}
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </header>
  );
}
