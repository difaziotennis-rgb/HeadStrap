"use client";

type Props = {
  error: Error;
  reset: () => void;
};

export default function GameError({ error, reset }: Props) {
  return (
    <div className="rounded-xl border border-red-900 bg-red-950/30 p-6">
      <h2 className="text-lg font-semibold text-red-200">Game section error</h2>
      <p className="mt-2 text-sm text-red-100/90">{error.message}</p>
      <button
        className="mt-4 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
