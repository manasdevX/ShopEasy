export default function useDarkSide() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark"; // Force Dark for first-timers
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const oldTheme = theme === "dark" ? "light" : "dark";

    root.classList.remove(oldTheme);
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return [theme, setTheme]; // Standard return: [currentValue, setter]
}