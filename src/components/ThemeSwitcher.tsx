import { useState, useRef, useEffect } from "react";

import {
  Palette,
  Check,
  ChevronDown,
} from "lucide-react";

import { useTheme, type Theme } from "../context/ThemeContext";

const themes: {
  id: Theme;
  name: string;
  description: string;
  primary: string;
  background: string;
}[] = [
  {
    id: "green",
    name: "Green & White",
    description: "Fresh and professional",
    primary: "#168653",
    background: "#F5F8F5",
  },
  {
    id: "midnight",
    name: "Midnight Luxury",
    description: "Deep Indigo & Soft Pearl",
    primary: "#1E1B4B",
    background: "#F8FAFC",
  },
  {
    id: "sage",
    name: "Sage Balance",
    description: "Muted Eucalyptus & Off-White",
    primary: "#2D4A43",
    background: "#F6F7F5",
  },
  {
    id: "espresso",
    name: "Nordic Espresso",
    description: "Dark Cocoa & Warm Cream",
    primary: "#2D221E",
    background: "#F9F6F0",
  },
  {
    id: "steel",
    name: "Steel Minimalist",
    description: "Charcoal & Frost Gray",
    primary: "#1E293B",
    background: "#F1F5F9",
  },
  {
    id: "plum",
    name: "Warm Plum",
    description: "Aubergine & Pale Almond",
    primary: "#3B1E30",
    background: "#FAF7F2",
  },
  {
    id: "teal",
    name: "Deep Teal",
    description: "Marine Blue-Green & Clean Ice",
    primary: "#044E54",
    background: "#F0F4F8",
  },
  {
    id: "pink",
    name: "Pink & White",
    description: "Soft Pink & Elegant White",
    primary: "#E75480",
    background: "#FFF5F8",
  },
];

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const selectedTheme = themes.find(
    (item) => item.id === theme
  );

  return (
    <div className="theme-switcher" ref={menuRef}>
      <button
        className="theme-switcher-button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        aria-label="Select website theme"
      >
        <Palette size={18} />

        <span>Theme</span>

        <span
          className="theme-button-dot"
          style={{
            background: selectedTheme?.primary,
          }}
        />

        <ChevronDown
          size={16}
          className={isOpen ? "theme-chevron open" : "theme-chevron"}
        />
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-dropdown-heading">
            <div>
              <h3>Appearance</h3>
              <p>Choose your preferred workspace theme</p>
            </div>
          </div>

          <div className="theme-options-list">
            {themes.map((item) => (
              <button
                key={item.id}
                className={`theme-option-card ${
                  theme === item.id ? "selected" : ""
                }`}
                onClick={() => {
                  setTheme(item.id);
                  setIsOpen(false);
                }}
              >
                <div
                  className="theme-preview"
                  style={{
                    background: item.background,
                  }}
                >
                  <div
                    className="theme-preview-sidebar"
                    style={{
                      background: item.primary,
                    }}
                  />

                  <div className="theme-preview-content">
                    <span
                      style={{
                        background: item.primary,
                      }}
                    />

                    <span />
                    <span />
                  </div>
                </div>

                <div className="theme-option-details">
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </div>

                {theme === item.id && (
                  <span className="theme-selected-check">
                    <Check size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="theme-dropdown-footer">
            <span className="theme-footer-dot" />
            Your preference is saved automatically.
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;