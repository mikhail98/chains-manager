import { useState, useEffect } from "react";
import { isSessionActive, getFirebaseConfig, clearSession } from "./auth";
import { initFirebase } from "./firebase";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import type { AppView } from "./types";

export default function App() {
  const [view, setView] = useState<AppView>("login");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isSessionActive()) {
      const config = getFirebaseConfig();
      if (config) {
        initFirebase(config)
          .then(() => { setView("dashboard"); setReady(true); })
          .catch(() => { clearSession(); setReady(true); });
      } else {
        clearSession();
        setReady(true);
      }
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  if (view === "login") {
    return <LoginPage onSuccess={() => setView("dashboard")} />;
  }

  return <Dashboard onLogout={() => setView("login")} />;
}
