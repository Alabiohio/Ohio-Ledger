"use client";

import { useEffect, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "ohio-ledger-theme";

function getSystemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const resolvedDark = mode === "dark" || (mode === "system" && getSystemPrefersDark());

  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }

  root.classList.toggle("dark", resolvedDark);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    applyTheme(mode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => {
      if (mode === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", onSystemThemeChange);
    return () => media.removeEventListener("change", onSystemThemeChange);
  }, [mode]);

  const setTheme = (nextMode: ThemeMode) => {
    setMode(nextMode);
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    applyTheme(nextMode);
  };

  return (
    <div className="neo-glass rounded-xl p-1 border border-[var(--border)]">
      <div className="flex items-center gap-1 text-[11px] font-semibold">
        {(["system", "light", "dark"] as ThemeMode[]).map((option) => {
          const active = mode === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                active
                  ? "bg-[var(--color-brand-peach)] text-[var(--color-ink)]"
                  : "text-[var(--foreground)] hover:bg-[var(--color-brand-peach)]/15"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
