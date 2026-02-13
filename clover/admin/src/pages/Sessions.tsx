import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Download, DollarSign, Mic, MicOff, Filter,
} from "lucide-react";
import { api } from "../api";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_upload: { label: "UPLOADING", cls: "badge-yellow" },
    uploaded: { label: "UPLOADED", cls: "badge-blue" },
    listed: { label: "LISTED", cls: "badge-blue" },
    sold: { label: "SOLD", cls: "badge-green" },
    paid_out: { label: "PAID", cls: "badge-green" },
  };
  const b = map[status] || { label: status, cls: "badge-gray" };
  return <span className={`badge ${b.cls}`}>{b.label}</span>;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSellModal, setShowSellModal] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    const res = await api.getSessions(page, 50, filters);
    setSessions(res.data);
    setPagination(res.pagination);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === sessions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sessions.map((s) => s.id)));
    }
  };

  const handleMarkSold = async () => {
    if (!salePrice || selected.size === 0) return;
    await api.markSold(Array.from(selected), parseFloat(salePrice), buyerId || undefined);
    setShowSellModal(false);
    setSalePrice("");
    setBuyerId("");
    setSelected(new Set());
    load(pagination.page);
  };

  const handleExport = async () => {
    const manifest = await api.exportSessions();
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clover-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Sessions</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={handleExport}><Download size={14} /> Export</button>
          {selected.size > 0 && (
            <button className="btn btn-primary" onClick={() => setShowSellModal(true)}>
              <DollarSign size={14} /> Mark Sold ({selected.size})
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <Filter size={14} color="var(--text3)" />
        <select
          value={filters.status || ""}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="pending_upload">Pending Upload</option>
          <option value="uploaded">Uploaded</option>
          <option value="listed">Listed</option>
          <option value="sold">Sold</option>
          <option value="paid_out">Paid Out</option>
        </select>
        <select
          value={filters.narrated || ""}
          onChange={(e) => setFilters((f) => ({ ...f, narrated: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="true">Narrated</option>
          <option value="false">Silent</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={selected.size === sessions.length && sessions.length > 0} onChange={selectAll} />
              </th>
              <th>User</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Data</th>
              <th>Narrated</th>
              <th>Est.</th>
              <th>Actual</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: "center", color: "var(--text3)" }}>Loading...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: "center", color: "var(--text3)" }}>No sessions found</td></tr>
            ) : sessions.map((s: any) => (
              <tr key={s.id}>
                <td><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} /></td>
                <td style={{ fontWeight: 500 }}>{s.user?.name || "—"}</td>
                <td>{s.type}</td>
                <td>{s.durationMinutes} min</td>
                <td>{s.dataSizeMB > 1024 ? `${(s.dataSizeMB / 1024).toFixed(1)} GB` : `${s.dataSizeMB} MB`}</td>
                <td>
                  {s.narrationEnabled
                    ? <span className="badge badge-green"><Mic size={10} /> Yes</span>
                    : <span className="badge badge-gray"><MicOff size={10} /> No</span>}
                </td>
                <td>${s.estimatedEarnings.toFixed(2)}</td>
                <td>{s.actualEarnings > 0 ? <span style={{ color: "var(--emerald)" }}>${s.actualEarnings.toFixed(2)}</span> : "—"}</td>
                <td><StatusBadge status={s.dataSaleStatus} /></td>
                <td style={{ color: "var(--text3)", fontSize: 13 }}>{new Date(s.startTime).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-sm" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>
              <ChevronLeft size={14} />
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="btn btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Sell Modal */}
      {showSellModal && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Mark {selected.size} Sessions as Sold</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 4 }}>
                Total Sale Price ($)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 4 }}>
                Buyer ID (optional)
              </label>
              <input
                placeholder="e.g. acme_corp"
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>
              Revenue will be split per-session based on duration and narration status (50/50 narrated, 30/70 silent).
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowSellModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleMarkSold} disabled={!salePrice}>
                <DollarSign size={14} /> Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
