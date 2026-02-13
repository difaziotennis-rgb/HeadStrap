import { useState, useEffect } from "react";
import { Package, DollarSign, Plus } from "lucide-react";
import { api } from "../api";

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSell, setShowSell] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Create form
  const [sessionIds, setSessionIds] = useState("");
  const [pkgName, setPkgName] = useState("");
  const [category, setCategory] = useState("");

  // Sell form
  const [salePrice, setSalePrice] = useState("");
  const [buyerId, setBuyerId] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await api.getPackages();
    setPackages(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const ids = sessionIds.split(/[,\s]+/).filter(Boolean);
    if (ids.length === 0) return;
    await api.createPackage(ids, pkgName || `Package ${new Date().toISOString().split("T")[0]}`, category || "general");
    setShowCreate(false);
    setSessionIds("");
    setPkgName("");
    setCategory("");
    load();
  };

  const handleSell = async () => {
    if (!showSell || !salePrice) return;
    await api.sellPackage(showSell.id, parseFloat(salePrice), buyerId || undefined);
    setShowSell(null);
    setSalePrice("");
    setBuyerId("");
    load();
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Data Packages</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Create Package
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text3)" }}>Loading...</p>
      ) : packages.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <Package size={32} color="var(--text3)" style={{ marginBottom: 12 }} />
          <p style={{ color: "var(--text3)" }}>No packages yet. Bundle sessions together to sell as data packages.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Sessions</th>
                <th>Size</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Sale Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name || "Untitled"}</td>
                  <td><span className="badge badge-blue">{p.category || "—"}</span></td>
                  <td>{p.sessions?.length || 0}</td>
                  <td>{p.totalSizeMB > 1024 ? `${(p.totalSizeMB / 1024).toFixed(1)} GB` : `${p.totalSizeMB.toFixed(0)} MB`}</td>
                  <td>{(p.totalDurationMinutes / 60).toFixed(1)} hrs</td>
                  <td>
                    <span className={`badge ${p.status === "sold" ? "badge-green" : p.status === "listed" ? "badge-blue" : "badge-gray"}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{p.salePrice ? <span style={{ color: "var(--emerald)" }}>${p.salePrice}</span> : "—"}</td>
                  <td>
                    {p.status !== "sold" && (
                      <button className="btn btn-sm btn-primary" onClick={() => setShowSell(p)}>
                        <DollarSign size={12} /> Sell
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Data Package</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 4 }}>
                Session IDs (comma-separated)
              </label>
              <input
                placeholder="Paste session IDs..."
                value={sessionIds}
                onChange={(e) => setSessionIds(e.target.value)}
                style={{ width: "100%" }}
              />
              <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                Tip: Copy IDs from the Sessions page
              </p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 4 }}>Package Name</label>
              <input value={pkgName} onChange={(e) => setPkgName(e.target.value)} style={{ width: "100%" }} placeholder="e.g. Trade Skills Q1" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 4 }}>Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%" }} placeholder="e.g. trades, tech" />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>
                <Plus size={14} /> Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSell && (
        <div className="modal-overlay" onClick={() => setShowSell(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Sell: {showSell.name}</h2>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
              {showSell.sessions?.length || 0} sessions • {(showSell.totalDurationMinutes / 60).toFixed(1)} hrs •{" "}
              {showSell.totalSizeMB > 1024 ? `${(showSell.totalSizeMB / 1024).toFixed(1)} GB` : `${showSell.totalSizeMB.toFixed(0)} MB`}
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 4 }}>Sale Price ($)</label>
              <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} style={{ width: "100%" }} placeholder="e.g. 500" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 4 }}>Buyer ID (optional)</label>
              <input value={buyerId} onChange={(e) => setBuyerId(e.target.value)} style={{ width: "100%" }} placeholder="e.g. acme_corp" />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowSell(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSell} disabled={!salePrice}>
                <DollarSign size={14} /> Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
