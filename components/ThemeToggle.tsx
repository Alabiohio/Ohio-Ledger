"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";

type ThemeMode = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "ohio-ledger-theme";

function applyTheme(mode: ThemeMode, systemPrefersDark: boolean) {
  const root = document.documentElement;
  const resolvedDark = mode === "dark" || (mode === "system" && systemPrefersDark);

  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }

  root.classList.toggle("dark", resolvedDark);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemPrefersDark(media.matches);

    handleChange();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    applyTheme(mode, systemPrefersDark);
  }, [mode, systemPrefersDark]);

  const setTheme = (nextMode: ThemeMode) => {
    setMode(nextMode);
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
  };

  return (
    <div className="neo-glass rounded-xl p-1 border border-[var(--border)]">
      <div className="flex items-center gap-1 text-[11px] font-semibold">
        {(["system", "light", "dark"] as ThemeMode[]).map((option) => {
          const active = mode === option;
          return (
            <m.button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                active
                  ? "bg-[var(--color-brand-peach)] text-[var(--color-ink)]"
                  : "text-[var(--foreground)] hover:bg-[var(--color-brand-peach)]/15"
              }`}
            >
              {option}
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
