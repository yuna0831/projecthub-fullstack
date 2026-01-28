
/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../context/UserContext";
import { PlusIcon, TrashIcon, CheckCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function ProjectRoomPage() {
    const { id } = useParams(); // Project ID
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [project, setProject] = useState<any>(null);
    const [checklist, setChecklist] = useState<any[]>([]);
    const [newItemText, setNewItemText] = useState("");

    // 1. Check Access & Fetch Data
    useEffect(() => {
        async function init() {
            if (!user) return;
            try {
                const token = await user.getIdToken();

                // Fetch Checklist (Backend validates access)
                const res = await fetch(`http://localhost:3001/api/checklist/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.status === 403 || res.status === 401) {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                if (!res.ok) throw new Error("Failed to load room");

                const items = await res.json();
                setChecklist(items);

                // Fetch Project Info for Title
                const projRes = await fetch(`http://localhost:3001/api/projects/${id}`);
                if (projRes.ok) setProject(await projRes.json());

            } catch (e) {
                console.error(e);
                setAccessDenied(true);
            } finally {
                setLoading(false);
            }
        }

        if (user) init();
        else if (!loading && !user) setAccessDenied(true);

    }, [id, user]);


    // 2. Actions
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`http://localhost:3001/api/checklist/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: newItemText })
            });
            if (res.ok) {
                const added = await res.json();
                setChecklist([...checklist, added]);
                setNewItemText("");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggle = async (itemId: string) => {
        // Optimistic Update
        const oldList = [...checklist];
        setChecklist(checklist.map(item => item.id === itemId ? { ...item, isChecked: !item.isChecked } : item));

        try {
            const token = await user?.getIdToken();
            await fetch(`http://localhost:3001/api/checklist/item/${itemId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {
            console.error(e);
            setChecklist(oldList); // Revert
        }
    };

    const handleDelete = async (itemId: string) => {
        if (!confirm("Remove this item?")) return;
        try {
            const token = await user?.getIdToken();
            await fetch(`http://localhost:3001/api/checklist/item/${itemId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setChecklist(checklist.filter(i => i.id !== itemId));
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Room...</div>;

    if (accessDenied) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <LockClosedIcon className="w-16 h-16 text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800">Private Workspace</h1>
                <p className="text-slate-500 mt-2 max-w-sm">
                    This room is only accessible to the Project Owner and Accepted Team Members.
                </p>
                <button onClick={() => router.push(`/project/${id}`)} className="mt-6 text-[#c5050c] font-bold hover:underline">
                    Back to Project Page
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#F3F2EF] py-8 px-4 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Project Room</p>
                        <h1 className="text-2xl font-bold text-slate-900">{project?.title || "Team Workspace"}</h1>
                    </div>
                    <button onClick={() => router.push(`/project/${id}`)} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
                        View Public Page &rarr;
                    </button>
                </div>

                {/* Checklist */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <CheckCircleIcon className="w-6 h-6 text-[#c5050c]" />
                            Shared Checklist
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Keep track of tasks with your teammates.</p>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* List */}
                        <div className="space-y-2">
                            {checklist.length === 0 && <p className="text-slate-400 italic text-sm text-center py-4">No tasks yet. Add one to get started!</p>}
                            {checklist.map(item => (
                                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${item.isChecked ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                    <input
                                        type="checkbox"
                                        checked={item.isChecked}
                                        onChange={() => handleToggle(item.id)}
                                        className="w-5 h-5 rounded border-slate-300 text-[#c5050c] focus:ring-[#c5050c] cursor-pointer"
                                    />
                                    <span className={`flex-1 text-sm font-medium ${item.isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                        {item.content}
                                    </span>
                                    <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 transition px-2">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Input */}
                        <form onSubmit={handleAddItem} className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                            <input
                                type="text"
                                value={newItemText}
                                onChange={e => setNewItemText(e.target.value)}
                                placeholder="Add a new task..."
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c5050c] outline-none transition"
                            />
                            <button type="submit" disabled={!newItemText.trim()} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 font-bold text-sm">
                                <PlusIcon className="w-4 h-4" /> Add
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </main>
    );
}
