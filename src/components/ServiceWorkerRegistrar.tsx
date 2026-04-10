"use client";

import { useEffect, useState } from "react";

export default function ServiceWorkerRegistrar() {
  const [toast, setToast] = useState<"offline" | "online" | null>(null);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — not critical
      });
    }

    // Online/offline detection
    function handleOffline() {
      setToast("offline");
    }

    function handleOnline() {
      setToast("online");

      // Notify service worker to refetch cached resources
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "ONLINE_AGAIN" });
      }

      // Auto-dismiss after 3 seconds
      setTimeout(() => setToast(null), 3000);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Check initial state
    if (!navigator.onLine) {
      setToast("offline");
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${
        toast === "offline"
          ? "bg-accent-warm text-white"
          : "bg-accent text-white"
      }`}
    >
      {toast === "offline" ? "Du är offline" : "Ansluten igen"}
    </div>
  );
}
