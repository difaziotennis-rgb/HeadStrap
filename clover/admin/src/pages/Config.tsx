import { useState, useEffect } from "react";
import { Save, RefreshCw, Mic, MicOff, Server, CreditCard } from "lucide-react";
import { api } from "../api";

export default function ConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [form, setForm] = useState({
    narRatePerMinute: 0.28,
    silentRatePerMinute: 0.12,
  narUserSplit: 0.5,
  narPlatformSplit: 0.5,
  silentUserSplit: 0.3,
  silentPlatformSplit: 0.7,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const data = await api.getConfig();
    setConfig(data);
    setForm({
      narRatePerMinute: data.rates.narrated.perMinute,
      silentRatePerMinute: data.rates.silent.perMinute,
      narUserSplit: data.rates.narrated.userSplit,
      narPlatformSplit: data.rates.narrated.platformSplit,
      silentUserSplit: data.rates.silent.userSplit,
      silentPlatformSplit: data.rates.silent.platformSplit,
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    await api.updateConfig(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  };

  if (!config) return <p style={{ color: "var(--text3)" }}>Loading...</p>;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Platform Config</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={load}><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Narrated Rates */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Mic size={18} color="var(--emerald)" />
          <span className="section-title" style={{ margin: 0 }}>Narrated Recordings</span>
          <span className="badge badge-green">Premium</span>
        </div>
        <div className="config-grid">
          <div className="config-item">
            <label>Rate per Minute ($)</label>
            <input
              type="number"
              step="0.01"
              value={form.narRatePerMinute}
              onChange={(e) => setForm({ ...form, narRatePerMinute: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="config-item">
            <label>Hourly Rate (computed)</label>
            <input type="text" value={`$${(form.narRatePerMinute * 60).toFixed(2)}/hr`} disabled />
          </div>
          <div className="config-item">
            <label>User Split (0-1)</label>
            <input
              type="number"
              step="0.05"
              min="0" max="1"
              value={form.narUserSplit}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setForm({ ...form, narUserSplit: v, narPlatformSplit: +(1 - v).toFixed(2) });
              }}
            />
          </div>
          <div className="config-item">
            <label>Platform Split (auto)</label>
            <input type="number" value={form.narPlatformSplit} disabled />
          </div>
        </div>
      </div>

      {/* Silent Rates */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <MicOff size={18} color="var(--text3)" />
          <span className="section-title" style={{ margin: 0 }}>Silent Recordings</span>
          <span className="badge badge-gray">Standard</span>
        </div>
        <div className="config-grid">
          <div className="config-item">
            <label>Rate per Minute ($)</label>
            <input
              type="number"
              step="0.01"
              value={form.silentRatePerMinute}
              onChange={(e) => setForm({ ...form, silentRatePerMinute: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="config-item">
            <label>Hourly Rate (computed)</label>
            <input type="text" value={`$${(form.silentRatePerMinute * 60).toFixed(2)}/hr`} disabled />
          </div>
          <div className="config-item">
            <label>User Split (0-1)</label>
            <input
              type="number"
              step="0.05"
              min="0" max="1"
              value={form.silentUserSplit}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setForm({ ...form, silentUserSplit: v, silentPlatformSplit: +(1 - v).toFixed(2) });
              }}
            />
          </div>
          <div className="config-item">
            <label>Platform Split (auto)</label>
            <input type="number" value={form.silentPlatformSplit} disabled />
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="card">
        <span className="section-title">Integration Status</span>
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={16} color={config.stripe.configured ? "var(--emerald)" : "var(--text3)"} />
            <span style={{ fontSize: 14 }}>Stripe</span>
            {config.stripe.configured
              ? <span className="badge badge-green">Connected</span>
              : <span className="badge badge-gray">Not configured</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Server size={16} color={config.azure.configured ? "var(--emerald)" : "var(--text3)"} />
            <span style={{ fontSize: 14 }}>Azure Storage</span>
            {config.azure.configured
              ? <span className="badge badge-green">{config.azure.storageAccount}</span>
              : <span className="badge badge-gray">Not configured</span>}
          </div>
        </div>
      </div>
    </>
  );
}
