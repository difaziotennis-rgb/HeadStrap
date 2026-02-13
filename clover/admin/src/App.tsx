import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, FileVideo, Package, CreditCard, Settings, Clover, LogOut, KeyRound,
} from "lucide-react";
import { getApiKey, setApiKey, api } from "./api";
import DashboardPage from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import SessionsPage from "./pages/Sessions";
import PackagesPage from "./pages/Packages";
import PayoutsPage from "./pages/Payouts";
import ConfigPage from "./pages/Config";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "sessions", label: "Sessions", icon: FileVideo },
  { id: "packages", label: "Packages", icon: Package },
  { id: "payouts", label: "Payouts", icon: CreditCard },
  { id: "config", label: "Config", icon: Settings },
] as const;

type Page = typeof NAV[number]["id"];

function LoginScreen({ onConnect }: { onConnect: () => void }) {
  const [key, setKey] = useState(getApiKey());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setError("");
    setApiKey(key.trim());
    try {
      await api.getDashboard();
      onConnect();
    } catch {
      setError("Invalid API key or server not reachable");
    }
    setLoading(false);
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <h1>CLOVER</h1>
        <p>Admin Dashboard</p>
        <input
          type="password"
          placeholder="Admin API Key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
        />
        {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</p>}
        <button className="btn btn-primary" onClick={handleConnect} disabled={loading}>
          <KeyRound size={16} />
          {loading ? "Connecting..." : "Connect"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");

  useEffect(() => {
    if (getApiKey()) {
      api.getDashboard().then(() => setAuthed(true)).catch(() => {});
    }
  }, []);

  if (!authed) return <LoginScreen onConnect={() => setAuthed(true)} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "users": return <UsersPage />;
      case "sessions": return <SessionsPage />;
      case "packages": return <PackagesPage />;
      case "payouts": return <PayoutsPage />;
      case "config": return <ConfigPage />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1><Clover size={16} style={{ marginRight: 6 }} />CLOVER</h1>
          <span>Admin Panel</span>
        </div>
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          className="nav-item"
          onClick={() => { setApiKey(""); setAuthed(false); }}
        >
          <LogOut size={18} /> Disconnect
        </button>
      </aside>
      <main className="main">{renderPage()}</main>
    </div>
  );
}
