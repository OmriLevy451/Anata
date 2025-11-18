"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [boards, setBoards] = useState<{id:string}[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch("/api/boards");
      const data = await res.json();
      setBoards(data);
    } catch (e:any) {
      setError(e?.message ?? "Failed to load");
    }
  };

  const create = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/boards", { method: "POST" });
      const data = await res.json();
      setCreatedId(data.id);
      await load();
    } catch (e:any) {
      setError(e?.message ?? "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Boards</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={create}
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create board"}
        </button>
        <button
          onClick={load}
          className="px-4 py-2 rounded border"
        >
          Refresh
        </button>
      </div>

      {createdId && <p className="text-sm">Created: <b>{createdId}</b></p>}
      {error && <p className="text-red-600">{error}</p>}

      <ul className="list-disc pl-6">
        {boards.map(b => <li key={b.id}>{b.id}</li>)}
      </ul>
    </main>
  );
}
