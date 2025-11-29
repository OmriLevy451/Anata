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
    const uRes = await fetch("/api/users?limit=50");
    const uData = await uRes.json();
    setUsers(uData.data || []);
    
    const bRes = await fetch("/api/boards");
    const bData = await bRes.json();
    setBoards(bData || []);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!userEmail) return alert("Email required");
    
    const res = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ name: userName, email: userEmail })
    });
    
    if(res.ok) {
      setUserName(""); setUserEmail("");
      loadData(); 
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedUserId || !boardTitle) return alert("User and Title required");

    const bRes = await fetch("/api/boards", {
      method: "POST",
      body: JSON.stringify({ title: boardTitle, ownerId: selectedUserId })
    });
    const newBoard = await bRes.json();

    if(bRes.ok) {
      // Create default page automatically
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
      <header className="border-b border-black/10 pb-4">
        <h1 className="text-5xl font-extrabold text-black tracking-tight">ANATA</h1>
        {/* 4. Guide text: Dark Grey + Italic */}
        <p className="text-gray-800 italic mt-2 text-lg">
          The collaborative whiteboard.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* LEFT COLUMN: ACTIONS */}
        <div className="space-y-8">
          
          {/* CREATE USER CARD */}
          <section className="bg-white p-6 rounded-xl shadow-lg border-2 border-black">
            <h2 className="text-xl font-bold mb-1 text-black">1. Create User</h2>
            <p className="text-gray-600 italic text-sm mb-4">Start by creating a persona.</p>
            
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input 
                className="w-full p-2 border-2 border-gray-200 rounded focus:border-black outline-none transition" 
                placeholder="Name (e.g. Omri)"
                value={userName} onChange={e => setUserName(e.target.value)}
              />
              <input 
                className="w-full p-2 border-2 border-gray-200 rounded focus:border-black outline-none transition" 
                placeholder="Email (e.g. omri@anata.com)"
                value={userEmail} onChange={e => setUserEmail(e.target.value)}
              />
              <button className="w-full bg-black text-white font-bold p-2 rounded hover:bg-gray-800 transition">
                Create User
              </button>
            </form>
          </section>

          {/* CREATE BOARD CARD */}
          <section className="bg-white p-6 rounded-xl shadow-lg border-2 border-black">
            <h2 className="text-xl font-bold mb-1 text-black">2. Create Board</h2>
            <p className="text-gray-600 italic text-sm mb-4">Assign a board to a user.</p>

            <form onSubmit={handleCreateBoard} className="space-y-3">
              <select 
                className="w-full p-2 border-2 border-gray-200 rounded focus:border-black outline-none"
                value={selectedUserId} 
                onChange={e => setSelectedUserId(e.target.value)}
              >
                <option value="">Select an Owner...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
              <input 
                className="w-full p-2 border-2 border-gray-200 rounded focus:border-black outline-none" 
                placeholder="Board Title"
                value={boardTitle} onChange={e => setBoardTitle(e.target.value)}
              />
              <button 
                disabled={!selectedUserId}
                className="w-full bg-black text-white font-bold p-2 rounded hover:bg-gray-800 disabled:opacity-50 transition"
              >
                Create Board
              </button>
            </form>
          </section>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">Your Boards</h2>
            <div className="grid gap-4">
              {boards.map(board => (
                <Link 
                  key={board.id} 
                  href={`/boards/${board.id}`}
                  className="block p-5 bg-white border-2 border-black rounded-lg hover:translate-x-1 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                >
                  <div className="font-bold text-xl text-black">{board.title}</div>
                  <div className="text-xs text-gray-500 italic mt-1">ID: {board.id}</div>
                  <div className="text-sm text-gray-800 italic mt-3">
                    Click to open canvas &rarr;
                  </div>
                </Link>
              ))}
              {boards.length === 0 && (
                <p className="text-black italic bg-white/50 p-4 rounded">
                  No boards found. Create one on the left!
                </p>
              )}
            </div>
          </section>
        </div>

      </div>
    </main>
  );
}