import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, X, Filter } from "lucide-react";
import { api } from "../api";

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    const res = await api.getPayouts(page, 50, statusFilter || undefined);
    setPayouts(res.data);
    setPagination(res.pagination);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleProcess = async (id: string) => {
    if (!confirm("Process this payout? This will transfer funds to the user.")) return;
    await api.processPayout(id);
    load(pagination.page);
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this payout request?")) return;
    await api.rejectPayout(id);
    load(pagination.page);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string }> = {
      pending: { cls: "badge-yellow" },
      processing: { cls: "badge-blue" },
      completed: { cls: "badge-green" },
      failed: { cls: "badge-red" },
      rejected: { cls: "badge-red" },
    };
    const b = map[status] || { cls: "badge-gray" };
    return <span className={`badge ${b.cls}`}>{status.toUpperCase()}</span>;
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Payouts</h1>
      </div>

      <div className="toolbar">
        <Filter size={14} color="var(--text3)" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text3)" }}>Loading...</td></tr>
            ) : payouts.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text3)" }}>No payouts found</td></tr>
            ) : payouts.map((p: any) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.user?.name || "—"}</td>
                <td style={{ fontWeight: 700, color: "var(--emerald)" }}>${p.amount.toFixed(2)}</td>
                <td><span className="badge badge-gray">{p.method}</span></td>
                <td>{statusBadge(p.status)}</td>
                <td style={{ color: "var(--text3)", fontSize: 13 }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td style={{ color: "var(--text3)", fontSize: 13 }}>{p.completedAt ? new Date(p.completedAt).toLocaleDateString() : "—"}</td>
                <td>
                  {p.status === "pending" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm btn-primary" onClick={() => handleProcess(p.id)}>
                        <Check size={12} /> Process
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleReject(p.id)}>
                        <X size={12} /> Reject
                      </button>
                    </div>
                  )}
                </td>
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
    </>
  );
}
