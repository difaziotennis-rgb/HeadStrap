"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Ban } from "lucide-react";

function CancelAutoChargeContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [status, setStatus] = useState<"idle" | "cancelling" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleCancel = async () => {
    if (!bookingId) {
      setStatus("error");
      setMessage("Missing booking information.");
      return;
    }

    setStatus("cancelling");

    try {
      const res = await fetch("/api/cancel-auto-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Auto-charge has been cancelled.");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to cancel auto-charge.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage("Something went wrong.");
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
                  Auto-Charge Cancelled
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
                  Error
                </h1>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#fef3c7] flex items-center justify-center">
                    <Ban className="h-6 w-6 text-[#92400e]" />
                  </div>
                </div>
                <h1 className="text-[22px] font-light tracking-tight text-[#1a1a1a]">
                  Cancel Auto-Charge
                </h1>
              </>
            )}
          </div>

          <div className="px-8 py-5 text-center">
            {status === "idle" && (
              <>
                <p className="text-[14px] text-[#6b665e] mb-6">
                  This will cancel the automatic payment for this lesson. The client will not be charged.
                </p>
                <button
                  onClick={handleCancel}
                  className="w-full py-3 bg-[#991b1b] text-white rounded-lg text-[13px] font-medium tracking-wide hover:bg-[#7f1d1d] transition-colors"
                >
                  Cancel Auto-Charge
                </button>
              </>
            )}

            {status === "cancelling" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-6 w-6 animate-spin text-[#92400e]" />
                <p className="text-[13px] text-[#8a8477]">Cancelling...</p>
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

export default function CancelAutoChargePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#8a8477]" />
        </div>
      }
    >
      <CancelAutoChargeContent />
    </Suspense>
  );
}
