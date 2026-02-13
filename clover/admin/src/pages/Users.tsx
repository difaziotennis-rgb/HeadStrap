import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import { api } from "../api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    const res = await api.getUsers(page, 50, search);
    setUsers(res.data);
    setPagination(res.pagination);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => load(1);

  const viewUser = async (id: string) => {
    const data = await api.getUser(id);
    setSelected(data);
  };

  if (selected) {
    const { user, earnings, payouts } = selected;
    return (
      <>
        <div className="page-header">
          <div>
            <button className="btn btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: 8 }}>
              <ChevronLeft size={14} /> Back
            </button>
            <h1 className="page-title">{user.name}</h1>
            <span style={{ fontSize: 13, color: "var(--text3)" }}>{user.email}</span>
          </div>
        </div>

        <div className="card-grid">
          <div className="card">
            <div className="card-label">ESTIMATED</div>
            <div className="card-value">${earnings.totalEstimated}</div>
          </div>
          <div className="card">
            <div className="card-label">ACTUAL EARNED</div>
            <div className="card-value" style={{ color: "var(--emerald)" }}>${earnings.totalActualEarned}</div>
          </div>
          <div className="card">
            <div className="card-label">PENDING PAYOUT</div>
            <div className="card-value" style={{ color: "var(--yellow)" }}>${earnings.pendingPayout}</div>
          </div>
          <div className="card">
            <div className="card-label">PAID OUT</div>
            <div className="card-value">${earnings.paidOut}</div>
          </div>
        </div>

        <div className="card-grid">
          <div className="card">
            <div className="card-label">DATA</div>
            <div className="card-value">{earnings.totalDataGB} GB</div>
          </div>
          <div className="card">
            <div className="card-label">HOURS</div>
            <div className="card-value">{earnings.totalHours}</div>
          </div>
          <div className="card">
            <div className="card-label">SESSIONS</div>
            <div className="card-value">{earnings.sessions.length}</div>
          </div>
          <div className="card">
            <div className="card-label">STRIPE</div>
            <div className="card-value" style={{ fontSize: 16 }}>
              {user.stripeConnectId ? <span className="badge badge-green">Connected</span> : <span className="badge badge-gray">Not set</span>}
            </div>
          </div>
        </div>

        <div className="section-title" style={{ marginTop: 8 }}>Sessions</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Duration</th>
                <th>Narrated</th>
                <th>Estimated</th>
                <th>Actual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings.sessions.map((s: any) => (
                <tr key={s.id}>
                  <td>{s.type}</td>
                  <td>{s.durationMinutes} min</td>
                  <td>{s.narrationEnabled ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                  <td>${s.estimatedEarnings.toFixed(2)}</td>
                  <td>{s.actualEarnings > 0 ? <span style={{ color: "var(--emerald)" }}>${s.actualEarnings.toFixed(2)}</span> : "—"}</td>
                  <td><StatusBadge status={s.dataSaleStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ width: 280 }}
        />
        <button className="btn" onClick={handleSearch}><Search size={14} /> Search</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Sessions</th>
              <th>Payouts</th>
              <th>Stripe</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text3)" }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text3)" }}>No users found</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ color: "var(--text2)" }}>{u.email}</td>
                <td>{u._count.sessions}</td>
                <td>{u._count.payouts}</td>
                <td>{u.stripeConnectId ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                <td style={{ color: "var(--text3)", fontSize: 13 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td><button className="btn btn-sm" onClick={() => viewUser(u.id)}>View</button></td>
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
