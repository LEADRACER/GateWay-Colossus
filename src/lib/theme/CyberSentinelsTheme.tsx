"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const GOLD = "#C8A96A";
const GRAY = "#808080";
const DARK_BG = "#050505";

interface CyberSentinelsThemeContextType {
  isMounted: boolean;
  gold: string;
  gray: string;
  darkBg: string;
}

const CyberSentinelsThemeContext = createContext<CyberSentinelsThemeContextType | undefined>(undefined);

export function CyberSentinelsThemeProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Apply global CSS variables
    document.documentElement.style.setProperty("--cyber-gold", GOLD);
    document.documentElement.style.setProperty("--cyber-gray", GRAY);
    document.documentElement.style.setProperty("--cyber-dark-bg", DARK_BG);
    document.body.style.background = DARK_BG;
  }, []);

  return (
    <CyberSentinelsThemeContext.Provider value={{ isMounted, gold: GOLD, gray: GRAY, darkBg: DARK_BG }}>
      {children}
    </CyberSentinelsThemeContext.Provider>
  );
}

export function useCyberSentinelsTheme() {
  const context = useContext(CyberSentinelsThemeContext);
  if (!context) {
    throw new Error("useCyberSentinelsTheme must be used within a CyberSentinelsThemeProvider");
  }
  return context;
}

// Global styles component that injects cyberpunk theme styles
export function CyberSentinelsGlobalStyles() {
  const { isMounted } = useCyberSentinelsTheme();

  if (!isMounted) return null;

  return (
    <style jsx global>{`
      /* Cyber Sentinels global theme variables */
      :root {
        --cyber-gold: #C8A96A;
        --cyber-gold-dim: #B8965A;
        --cyber-gold-glow: rgba(200, 169, 106, 0.3);
        --cyber-gold-subtle: rgba(200, 169, 106, 0.08);
        --cyber-gray: #808080;
        --cyber-dark-bg: #050505;
        --cyber-surface: #0A0A0A;
        --cyber-surface-elevated: #101010;
        --cyber-border: rgba(200, 169, 106, 0.15);
        --cyber-border-bright: rgba(200, 169, 106, 0.3);
      }

      /* Global scanline overlay */
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9998;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.08) 2px,
          rgba(0, 0, 0, 0.08) 4px
        );
        animation: scanline 12s linear infinite;
        opacity: 0.15;
      }

      @keyframes scanline {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
      }

      /* Global focus styles - gold rings */
      *:focus-visible {
        outline: none !important;
        box-shadow:
          0 0 0 2px var(--cyber-dark-bg) !important,
          0 0 0 4px var(--cyber-gold) !important;
        border-radius: 4px;
      }

      /* Selection color */
      ::selection {
        background: rgba(200, 169, 106, 0.25);
        color: white;
      }

      /* Cyber card utility class */
      .cyber-card {
        border: 1px solid var(--cyber-border);
        background: var(--cyber-surface);
        backdrop-filter: blur(10px);
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
      }

      .cyber-card:hover {
        border-color: var(--cyber-gold);
        box-shadow: 0 0 24px var(--cyber-gold-glow);
      }

      /* Gold gradient text */
      .cyber-gold-text {
        background: linear-gradient(135deg, #C8A96A 0%, #E8D5A8 50%, #C8A96A 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      /* Gold glow utility */
      .cyber-gold-glow {
        box-shadow: 0 0 24px var(--cyber-gold-glow);
      }

      /* Corner brackets */
      .cyber-corners {
        position: relative;
      }

      .cyber-corners::before,
      .cyber-corners::after {
        content: "";
        position: absolute;
        border: 2px solid var(--cyber-gold);
        opacity: 0.15;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .cyber-corners::before {
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
      }

      .cyber-corners::after {
        top: 4px;
        left: 4px;
        right: 4px;
        bottom: 4px;
        opacity: 0.08;
      }

      .cyber-corners:hover::before,
      .cyber-corners:hover::after {
        opacity: 0.3;
      }

      /* Cyber button */
      .cyber-btn {
        background: transparent;
        border: 2px solid var(--cyber-gold);
        color: var(--cyber-gold);
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.75rem 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        z-index: 1;
      }

      .cyber-btn::before {
        content: "";
        position: absolute;
        inset: 0;
        background: var(--cyber-gold);
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        z-index: -1;
      }

      .cyber-btn:hover {
        color: #000;
      }

      .cyber-btn:hover::before {
        transform: translateX(0);
      }

      .cyber-btn:focus-visible {
        box-shadow: 0 0 0 2px var(--cyber-dark-bg), 0 0 0 4px var(--cyber-gold);
      }

      /* Cyber input */
      .cyber-input {
        background: rgba(10, 10, 10, 0.9);
        border: 1px solid var(--cyber-border);
        color: white;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        padding: 0.75rem 1rem;
        width: 100%;
        transition: all 0.3s ease;
      }

      .cyber-input:focus {
        outline: none;
        border-color: var(--cyber-gold);
        box-shadow: 0 0 0 2px var(--cyber-gold-subtle);
      }

      .cyber-input::placeholder {
        color: var(--cyber-gray);
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(200, 169, 106, 0.3);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(200, 169, 106, 0.5);
      }

      /* Gold accent border for focused elements */
      .cyber-focus-ring:focus-visible {
        box-shadow: 0 0 0 2px var(--cyber-dark-bg), 0 0 0 4px var(--cyber-gold);
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}