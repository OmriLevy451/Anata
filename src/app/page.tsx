"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [users, setUsers] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  
  // Form States
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [boardTitle, setBoardTitle] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const loadData = async () => {
    // Load Users
    const uRes = await fetch("/api/users?limit=50");
    const uData = await uRes.json();
    setUsers(uData.data || []);
    
    // Load Boards
    const bRes = await fetch("/api/boards");
    const bData = await bRes.json();
    setBoards(bData || []);
  };

  useEffect(() => { loadData(); }, []);

  // 1. Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!userEmail) return alert("Email required");
    
    const res = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ name: userName, email: userEmail })
    });
    
    if(res.ok) {
      setUserName(""); setUserEmail("");
      loadData(); // Refresh list
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  };

  // 2. Create Board (And automatically a Page)
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedUserId || !boardTitle) return alert("User and Title required");

    // A. Create Board
    const bRes = await fetch("/api/boards", {
      method: "POST",
      body: JSON.stringify({ title: boardTitle, ownerId: selectedUserId })
    });
    const newBoard = await bRes.json();

    if(bRes.ok) {
      // B. Create a Page for this board immediately so we can draw
      await fetch("/api/pages", {
        method: "POST",
        body: JSON.stringify({ boardId: newBoard.id, name: "Page 1" })
      });

      setBoardTitle("");
      loadData();
    } else {
      alert("Error creating board");
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto space-y-12">
      
      {/* HEADER */}
      <header className="border-b pb-4">
        <h1 className="text-4xl font-bold text-gray-900">Anata Whiteboard</h1>
        <p className="text-gray-500">Fabric.js + Next.js + Postgres</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* LEFT COLUMN: ACTIONS */}
        <div className="space-y-8">
          
          {/* CREATE USER FORM */}
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold mb-4">1. Create User</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input 
                className="w-full p-2 border rounded" 
                placeholder="Name (e.g. John Doe)"
                value={userName} onChange={e => setUserName(e.target.value)}
              />
              <input 
                className="w-full p-2 border rounded" 
                placeholder="Email (e.g. john@test.com)"
                value={userEmail} onChange={e => setUserEmail(e.target.value)}
              />
              <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                Create User
              </button>
            </form>
          </section>

          {/* CREATE BOARD FORM */}
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold mb-4">2. Create Board</h2>
            <form onSubmit={handleCreateBoard} className="space-y-3">
              <select 
                className="w-full p-2 border rounded"
                value={selectedUserId} 
                onChange={e => setSelectedUserId(e.target.value)}
              >
                <option value="">Select an Owner...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
              <input 
                className="w-full p-2 border rounded" 
                placeholder="Board Title"
                value={boardTitle} onChange={e => setBoardTitle(e.target.value)}
              />
              <button 
                disabled={!selectedUserId}
                className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Create Board
              </button>
            </form>
          </section>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">Your Boards</h2>
            <div className="grid gap-4">
              {boards.map(board => (
                <Link 
                  key={board.id} 
                  href={`/boards/${board.id}`}
                  className="block p-4 bg-white border rounded hover:border-blue-500 transition shadow-sm hover:shadow-md"
                >
                  <div className="font-bold text-lg">{board.title}</div>
                  <div className="text-xs text-gray-400">ID: {board.id}</div>
                  <div className="text-sm text-gray-500 mt-2">
                    Click to view canvas →
                  </div>
                </Link>
              ))}
              {boards.length === 0 && <p className="text-gray-400">No boards found.</p>}
            </div>
          </section>
        </div>

      </div>
    </main>
  );
}