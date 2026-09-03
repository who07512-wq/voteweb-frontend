"use client";
import { WifiOff, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handler = () => setOnline(navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-error-600 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
      <WifiOff size={18} />
      <span className="text-sm font-medium">You are offline. Some features may be unavailable.</span>
      <button onClick={() => window.location.reload()}
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition-colors">
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  );
}
