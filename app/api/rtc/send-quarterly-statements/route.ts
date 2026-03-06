import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/send-email";

type StatementLineItem = {
  date: string;
  category: string;
  description: string;
  amount: number;
  status: "Paid" | "Pending";
};

type StatementPayload = {
  memberNumber: string;
  memberName: string;
  memberEmail: string;
  quarterLabel: string;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  lineItems: StatementLineItem[];
};

type QuarterlyStatementRequest = {
  statements: StatementPayload[];
};

function escapeCsv(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function statementToCsv(statement: StatementPayload): string {
  const header = "date,category,description,amount,status";
  const rows = statement.lineItems.map((item) =>
    [
      escapeCsv(item.date),
      escapeCsv(item.category),
      escapeCsv(item.description),
      item.amount.toFixed(2),
      escapeCsv(item.status),
    ].join(",")
  );
  const billedRow = `,,TOTAL BILLED,${statement.totalBilled.toFixed(2)},`;
  const paidRow = `,,TOTAL PAID,${statement.totalPaid.toFixed(2)},`;
  const outstandingRow = `,,OUTSTANDING,${statement.outstanding.toFixed(2)},`;
  return [header, ...rows, "", billedRow, paidRow, outstandingRow].join("\n");
}

function toCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function buildHtml(statement: StatementPayload): string {
  const rows = statement.lineItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 6px;border-top:1px solid #f0ede8;">${item.date}</td>
          <td style="padding:8px 6px;border-top:1px solid #f0ede8;">${item.category}</td>
          <td style="padding:8px 6px;border-top:1px solid #f0ede8;">${item.description}</td>
          <td style="padding:8px 6px;border-top:1px solid #f0ede8;text-align:right;">${toCurrency(item.amount)}</td>
          <td style="padding:8px 6px;border-top:1px solid #f0ede8;">${item.status}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:720px;margin:24px auto;padding:0 12px;">
    <div style="background:#fff;border:1px solid #ece8e2;border-radius:14px;overflow:hidden;">
      <div style="padding:20px 22px;border-bottom:1px solid #f0ede8;">
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8477;">Rhinebeck Tennis Club</div>
        <h1 style="margin:8px 0 0;font-size:24px;">Quarterly Member Statement</h1>
        <p style="margin:10px 0 0;font-size:14px;color:#6b665e;">${statement.quarterLabel} · Member #${statement.memberNumber}</p>
      </div>
      <div style="padding:18px 22px;">
        <p style="margin:0 0 12px;font-size:14px;">Hi ${statement.memberName.split(" ")[0]},</p>
        <p style="margin:0 0 14px;font-size:14px;color:#4a4a4a;">Attached is your quarterly account statement with all bookings, clinics, and events.</p>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <thead>
            <tr style="text-align:left;color:#8a8477;">
              <th style="padding:6px;">Date</th>
              <th style="padding:6px;">Category</th>
              <th style="padding:6px;">Description</th>
              <th style="padding:6px;text-align:right;">Amount</th>
              <th style="padding:6px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="5" style="padding:8px 6px;border-top:1px solid #f0ede8;color:#8a8477;">No charge activity this quarter.</td></tr>`}
          </tbody>
        </table>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid #f0ede8;font-size:13px;color:#4a4a4a;">
          <div>Total billed: <strong>${toCurrency(statement.totalBilled)}</strong></div>
          <div>Total paid: <strong>${toCurrency(statement.totalPaid)}</strong></div>
          <div>Outstanding: <strong>${toCurrency(statement.outstanding)}</strong></div>
        </div>
        <p style="margin:14px 0 0;font-size:13px;color:#6b665e;">Thank you for being part of Rhinebeck Tennis Club.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuarterlyStatementRequest;
    const statements = Array.isArray(body.statements) ? body.statements : [];
    if (!statements.length) {
      return NextResponse.json({ sent: 0, failed: 0, details: [] });
    }

    const details: Array<{ memberNumber: string; email: string; sent: boolean; error?: string }> = [];
    let sent = 0;
    let failed = 0;

    for (const statement of statements) {
      if (!statement.memberEmail?.trim()) {
        details.push({
          memberNumber: statement.memberNumber,
          email: "",
          sent: false,
          error: "Missing member email",
        });
        failed += 1;
        continue;
      }

      const subject = `${statement.quarterLabel} Account Statement - Rhinebeck Tennis Club`;
      const csv = statementToCsv(statement);
      const result = await sendEmail({
        to: statement.memberEmail.trim(),
        subject,
        html: buildHtml(statement),
        text: `Quarterly statement for ${statement.quarterLabel}. Total billed: ${toCurrency(
          statement.totalBilled
        )}. Total paid: ${toCurrency(statement.totalPaid)}. Outstanding: ${toCurrency(
          statement.outstanding
        )}.`,
        attachments: [
          {
            filename: `rtc-statement-${statement.memberNumber}-${statement.quarterLabel.replace(/\s+/g, "-").toLowerCase()}.csv`,
            content: csv,
            contentType: "text/csv",
          },
        ],
      });

      if (result.success) {
        sent += 1;
        details.push({
          memberNumber: statement.memberNumber,
          email: statement.memberEmail,
          sent: true,
        });
      } else {
        failed += 1;
        details.push({
          memberNumber: statement.memberNumber,
          email: statement.memberEmail,
          sent: false,
          error: result.error || "Failed to send",
        });
      }
    }

    return NextResponse.json({ sent, failed, details });
  } catch (error) {
    console.error("[rtc/send-quarterly-statements] error", error);
    return NextResponse.json(
      { error: "Failed to send quarterly statements." },
      { status: 500 }
    );
  }
}
