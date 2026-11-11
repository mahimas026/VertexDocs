import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme =
  | "green"
  | "midnight"
  | "sage"
  | "espresso"
  | "steel"
  | "plum"
  | "teal"
  | "pink";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("vertexdocs-theme");

    const availableThemes: Theme[] = [
      "green",
      "midnight",
      "sage",
      "espresso",
      "steel",
      "plum",
      "teal",
      "pink",
    ];

    return availableThemes.includes(savedTheme as Theme)
      ? (savedTheme as Theme)
      : "green";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vertexdocs-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}