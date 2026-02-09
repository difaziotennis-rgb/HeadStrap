"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, CreditCard } from "lucide-react";

function ChargeMemberContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "charging" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [chargeInfo, setChargeInfo] = useState<{
    bookingId: string;
    memberId: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const data = JSON.parse(atob(token.replace(/-/g, "+").replace(/_/g, "/")));
        setChargeInfo(data);
      } catch {
        setStatus("error");
        setMessage("Invalid charge link.");
      }
    } else {
      setStatus("error");
      setMessage("Missing charge token.");
    }
  }, [token]);

  const handleCharge = async () => {
    if (!chargeInfo) return;

    setStatus("charging");

    try {
      const res = await fetch("/api/charge-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chargeInfo),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Payment charged successfully.");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to charge card.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
          <div className="px-8 pt-10 pb-2 text-center">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] mb-4">
              DiFazio Tennis
            </p>

            {status === "success" ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#e8f5e1] flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-[#2d5016]" />
                  </div>
                </div>
                <h1 className="text-[22px] font-light tracking-tight text-[#1a1a1a]">
                  Payment Charged
                </h1>
              </>
            ) : status === "error" ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#fef2f2] flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-[#991b1b]" />
                  </div>
                </div>
                <h1 className="text-[22px] font-light tracking-tight text-[#1a1a1a]">
                  Charge Failed
                </h1>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#f7f7f5] flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-[#8a8477]" />
                  </div>
                </div>
                <h1 className="text-[22px] font-light tracking-tight text-[#1a1a1a]">
                  Charge Client
                </h1>
              </>
            )}
          </div>

          <div className="px-8 py-5 text-center">
            {status === "idle" && chargeInfo && (
              <>
                <p className="text-[14px] text-[#6b665e] mb-6">
                  Charge <strong>${chargeInfo.amount}</strong> to the client's card on file?
                </p>
                <button
                  onClick={handleCharge}
                  className="w-full py-3 bg-[#2d5016] text-white rounded-lg text-[13px] font-medium tracking-wide hover:bg-[#3a6b1e] transition-colors"
                >
                  Charge ${chargeInfo.amount}
                </button>
              </>
            )}

            {status === "charging" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#2d5016]" />
                <p className="text-[13px] text-[#8a8477]">Processing payment...</p>
              </div>
            )}

            {status === "success" && (
              <p className="text-[14px] text-[#2d5016]">{message}</p>
            )}

            {status === "error" && (
              <p className="text-[14px] text-[#991b1b]">{message}</p>
            )}
          </div>

          <div className="py-3 border-t border-[#e8e5df] text-center">
            <p className="text-[10px] text-[#c4bfb8] tracking-wide">Admin Only</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChargeMemberPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#8a8477]" />
        </div>
      }
    >
      <ChargeMemberContent />
    </Suspense>
  );
}
