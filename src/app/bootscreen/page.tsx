"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const GOLD = "#C8A96A";
const GRAY = "#808080";
const DARK_BG = "#050505";

export default function BootScreen() {
  const [mounted, setMounted] = useState(false);
  const [glowOpacity, setGlowOpacity] = useState(0);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [showEnter, setShowEnter] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Simple fade-in sequence
    const timer1 = setTimeout(() => setGlowOpacity(0.15), 100);
    const timer2 = setTimeout(() => setLogoOpacity(1), 400);
    const timer3 = setTimeout(() => setTitleOpacity(1), 700);
    const timer4 = setTimeout(() => setSubtitleOpacity(1), 1000);
    const timer5 = setTimeout(() => setShowEnter(true), 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [mounted]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: DARK_BG, position: "relative" }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(200,169,106,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Glow behind logo */}
      <div
        className="absolute"
        style={{
          top: "22%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "25vw",
          maxWidth: "300px",
          aspectRatio: "1",
          opacity: glowOpacity,
          transition: "opacity 0.8s ease-out",
          pointerEvents: "none",
        }}
      >
        <Image
          src="/cybersentinels/cybersentinels-glow.png"
          alt=""
          fill
          style={{ objectFit: "contain", filter: "drop-shadow(0 0 60px rgba(200,169,106,0.4))" }}
          priority
        />
      </div>

      {/* Logo */}
      <div
        className="absolute"
        style={{
          top: "22%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "25vw",
          maxWidth: "200px",
          aspectRatio: "1",
          opacity: logoOpacity,
          transition: "opacity 0.8s ease-out",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <Image
          src="/cybersentinels/cybersentinels-logo.png"
          alt="Cyber Sentinels"
          fill
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      {/* Title */}
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: titleOpacity,
          transition: "opacity 0.8s ease-out",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <Image
          src="/cybersentinels/cybersentinels-title.png"
          alt="CYBER SENTINELS"
          width={532}
          height={82}
          style={{ objectFit: "contain", maxWidth: "90vw" }}
        />
      </div>

      {/* Subtitle */}
      <div
        className="absolute"
        style={{
          top: "58%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: subtitleOpacity,
          transition: "opacity 0.8s ease-out",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <Image
          src="/cybersentinels/cybersentinels-subtitle.png"
          alt="Guardians of the Digital Frontier"
          width={344}
          height={40}
          style={{ objectFit: "contain", maxWidth: "90vw" }}
        />
      </div>

      {/* Enter button */}
      {showEnter && (
        <div
          className="absolute bottom-20 text-center opacity-0 transition-opacity duration-1000"
          style={{ opacity: showEnter ? 1 : 0 }}
          id="enter-content"
        >
          <button
            onClick={() => (window.location.href = "/")}
            className="px-8 py-3 text-sm font-mono uppercase tracking-wider"
            style={{
              background: "transparent",
              border: `2px solid ${GOLD}`,
              color: GOLD,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = GOLD;
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = GOLD;
            }}
          >
            Enter Colossus
          </button>
        </div>
      )}

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
          animation: "scanline 8s linear infinite",
          opacity: 0.3,
        }}
      >
        <style jsx global>{`
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
        `}</style>
      </div>

      {/* Corner brackets / UI chrome */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ border: `2px solid ${GOLD}`, opacity: 0.15 }}
      />
      <div
        className="absolute inset-4 pointer-events-none"
        style={{ border: `1px solid ${GOLD}`, opacity: 0.08 }}
      />
    </div>
  );
}