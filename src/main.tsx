import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);

// Enregistrement du Service Worker + purge automatique du cache pour tous les visiteurs.
// Never let a production service worker cache Vite's versioned development chunks.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) =>
    Promise.all(registrations.map((registration) => registration.unregister())),
  );
  if ("caches" in window) {
    void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
  }
} else if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Certains environnements (aperçu iframe) ne servent pas /sw.js : on vérifie avant d'enregistrer.
    fetch("/sw.js", { method: "HEAD" })
      .then((res) => {
        if (!res.ok) throw new Error("sw unavailable");
        return navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      })

      .then((reg) => {
        // Vérifier une mise à jour à chaque chargement et au retour d'onglet.
        reg.update().catch(() => {});
        const check = () => reg.update().catch(() => {});
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
        setInterval(check, 60_000);

        // Si un nouveau SW est prêt, on active immédiatement.
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              sw.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {});

    // Recharge la page quand un nouveau SW prend le contrôle → visiteurs toujours à jour.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
