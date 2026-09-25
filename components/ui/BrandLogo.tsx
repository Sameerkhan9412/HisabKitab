import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function BrandLogo({ size = "md", showText = true, className = "" }: BrandLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-3xl",
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* HisabKitab Stylized Ledger Icon */}
      <div
        className={`${iconSizes[size]} relative rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0 group`}
      >
        <div className="w-full h-full bg-slate-950/80 backdrop-blur-sm rounded-[10px] flex items-center justify-center p-1.5 transition-colors group-hover:bg-slate-950/60">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]"
          >
            {/* Open Book / Ledger spine & pages (Kitab) */}
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="currentColor" fillOpacity="0.15" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="currentColor" fillOpacity="0.25" />
            
            {/* Accounting / Checkmark lines (Hisab) */}
            <path d="M6 8h2" strokeWidth="2.5" />
            <path d="M6 12h2" strokeWidth="2.5" />
            <path d="M15 9l2 2 4-4" stroke="#34d399" strokeWidth="2.5" />
          </svg>
        </div>

        {/* Small golden ribbon / ledger bookmark */}
        <span className="absolute -top-1 right-2 w-1.5 h-3 bg-gradient-to-b from-amber-400 to-amber-600 rounded-b-sm shadow-sm" />
      </div>

      {showText && (
        <div className="leading-none">
          <span className={`${textSizes[size]} font-black tracking-tight text-white`}>
            Hisab<span className="text-emerald-400">Kitab</span>
          </span>
          {size !== "sm" && (
            <span className="block text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
              Smart Ledger & Expenses
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
