import { useState, useEffect } from "react";
import {
  Users, FileVideo, HardDrive, DollarSign, TrendingUp, Clock,
  Upload, ShoppingCart, CreditCard, AlertCircle,
} from "lucide-react";
import { api } from "../api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: "var(--red)" }}>{error}</p>;
  if (!data) return <p style={{ color: "var(--text3)" }}>Loading...</p>;

  const { users, sessions, data: dataStats, revenue, payouts } = data;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{ fontSize: 13, color: "var(--text3)" }}>
          Real-time platform overview
        </span>
      </div>

      {/* Key Metrics */}
      <div className="card-grid">
        <div className="card">
          <div className="card-label">TOTAL USERS</div>
          <div className="card-value">{users.total}</div>
        </div>
        <div className="card">
          <div className="card-label">TOTAL SESSIONS</div>
          <div className="card-value">{sessions.total}</div>
        </div>
        <div className="card">
          <div className="card-label">DATA COLLECTED</div>
          <div className="card-value">{dataStats.totalGB} GB</div>
          <div className="card-sub">{dataStats.totalHours} hours recorded</div>
        </div>
        <div className="card">
          <div className="card-label">ESTIMATED VALUE</div>
          <div className="card-value" style={{ color: "var(--emerald)" }}>
            ${revenue.totalEstimated}
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="section-title" style={{ marginTop: 8 }}>Revenue</div>
      <div className="card-grid">
        <div className="card">
          <div className="card-label">ACTUAL SALES</div>
          <div className="card-value" style={{ color: "var(--emerald)" }}>
            ${revenue.totalActualSales}
          </div>
          <div className="card-sub">From sold data</div>
        </div>
        <div className="card">
          <div className="card-label">PLATFORM REVENUE</div>
          <div className="card-value">${revenue.totalPlatformRevenue}</div>
          <div className="card-sub">Your cut from all sales</div>
        </div>
        <div className="card">
          <div className="card-label">USER PAYOUTS</div>
          <div className="card-value">${revenue.totalUserPayouts}</div>
          <div className="card-sub">Owed to workers</div>
        </div>
      </div>

      {/* Data Pipeline */}
      <div className="section-title" style={{ marginTop: 8 }}>Data Pipeline</div>
      <div className="card-grid">
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Upload size={16} color="var(--yellow)" />
            <div className="card-label" style={{ margin: 0 }}>PENDING UPLOAD</div>
          </div>
          <div className="card-value">{sessions.pendingUpload}</div>
        </div>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <HardDrive size={16} color="var(--blue)" />
            <div className="card-label" style={{ margin: 0 }}>UPLOADED</div>
          </div>
          <div className="card-value">{sessions.uploaded}</div>
          <div className="card-sub">Ready to sell</div>
        </div>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <ShoppingCart size={16} color="var(--emerald)" />
            <div className="card-label" style={{ margin: 0 }}>SOLD</div>
          </div>
          <div className="card-value">{sessions.sold}</div>
        </div>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <CreditCard size={16} color="var(--emerald)" />
            <div className="card-label" style={{ margin: 0 }}>PAID OUT</div>
          </div>
          <div className="card-value">{sessions.paidOut}</div>
        </div>
      </div>

      {/* Payouts */}
      <div className="section-title" style={{ marginTop: 8 }}>Payouts</div>
      <div className="card-grid">
        <div className="card">
          <div className="card-label">COMPLETED</div>
          <div className="card-value" style={{ color: "var(--emerald)" }}>
            ${payouts.completedAmount}
          </div>
        </div>
        <div className="card">
          <div className="card-label">PENDING</div>
          <div className="card-value" style={{ color: "var(--yellow)" }}>
            ${payouts.pendingAmount}
          </div>
        </div>
        <div className="card">
          <div className="card-label">TOTAL REQUESTS</div>
          <div className="card-value">{payouts.total}</div>
        </div>
      </div>
    </>
  );
}
