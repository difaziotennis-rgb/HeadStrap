export const inputClass =
  "w-full rounded-lg border border-[#e8e5df] bg-white px-2.5 py-1.5 text-[13px] text-[#1a1a1a]";

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] text-[#8a8477]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function PaidPill({
  status,
  onToggle,
}: {
  status: "paid" | "pending";
  onToggle?: () => void;
}) {
  const paid = status === "paid";
  const className = `rounded-full px-2 py-0.5 text-[11px] font-medium ${
    paid ? "bg-[#eef4ea] text-[#3d5c34]" : "bg-[#f7efe3] text-[#8a6230]"
  } ${onToggle ? "cursor-pointer" : ""}`;
  if (!onToggle) return <span className={className}>{paid ? "Paid" : "Pending"}</span>;
  return (
    <button type="button" onClick={onToggle} className={className}>
      {paid ? "Paid" : "Pending"}
    </button>
  );
}

export function belongsToMember(
  member: { memberNumber: string; email: string },
  item: { memberNumber?: string; clientEmail?: string; attendeeEmail?: string }
) {
  const email = member.email.trim().toLowerCase();
  if (item.memberNumber && item.memberNumber === member.memberNumber) return true;
  if (item.clientEmail && item.clientEmail.trim().toLowerCase() === email) return true;
  if (item.attendeeEmail && item.attendeeEmail.trim().toLowerCase() === email) return true;
  return false;
}
