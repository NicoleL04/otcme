import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getActiveProfile, getProfiles, setActiveProfileId, type Profile } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { ChevronDown, Pill, Settings, UserPlus } from "lucide-react";

export function TopNav() {
  const router = useRouter();
  const navigate = useNavigate();
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
        {active && (
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-navy hover:bg-accent"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-teal text-xs text-white">
                {active.profile_name.charAt(0).toUpperCase()}
              </span>
              {active.profile_name}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {open && (
              <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-md border bg-popover shadow-lg">
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
                      <span className="text-xs text-muted-foreground">Age {p.age}</span>
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
                    <Settings className="h-4 w-4" /> Settings
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
                    <UserPlus className="h-4 w-4" /> Add new profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
