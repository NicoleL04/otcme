import { useLanguage } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border bg-card p-0.5 text-xs ${className}`}
      role="group"
      aria-label="Language"
    >
      <Languages className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={`rounded-md px-2 py-1 font-medium transition ${
          language === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("zh")}
        aria-pressed={language === "zh"}
        className={`rounded-md px-2 py-1 font-medium transition ${
          language === "zh"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent"
        }`}
      >
        中文
      </button>
    </div>
  );
}
