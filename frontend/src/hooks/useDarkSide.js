import { useState, useEffect } from "react";

export default function useDarkSide() {
  // 1. Initialize theme: Priority is LocalStorage > System Preference > 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    
    return window.matchMedia("(prefers-color-scheme: dark)").matches 
      ? "dark" 
      : "light";
  });

  const colorTheme = theme === "dark" ? "light" : "dark";

  useEffect(() => {
    const root = window.document.documentElement;

    // 2. Remove the old class and add the current one
    root.classList.remove(colorTheme);
    root.classList.add(theme);

    // 3. Persist the choice in localStorage
    localStorage.setItem("theme", theme);
  }, [theme, colorTheme]);

  return [colorTheme, setTheme];
}