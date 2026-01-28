
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    members: any[]; // List of project members to review
}

export default function ReviewModal({ isOpen, onClose, projectId, members }: ReviewModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <ReviewModalContent
                projectId={projectId}
                members={members}
                onClose={onClose}
            />
        </div>
    );
}

// Separate component to use hook safely or just use it in main
import { useAuth } from "../context/UserContext";

function ReviewModalContent({ projectId, members, onClose }: any) {
    const { user } = useAuth();
    const [selectedMember, setSelectedMember] = useState("");
    const [selectedBadge, setSelectedBadge] = useState<string>("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedMember || !selectedBadge || !user) return;

        try {
            setSubmitting(true);
            const token = await user.getIdToken();
            const res = await fetch(`http://localhost:3001/api/reviews/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    revieweeId: selectedMember,
                    badge: selectedBadge,
                    comment
                })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to submit review");
                return;
            }

            alert("Review submitted successfully! 🌟");
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error submitting review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold mb-2 text-slate-800">Give a Praise Badge 🏆</h3>
            <p className="text-sm text-slate-500 mb-6">Recognize your teammate&apos;s contribution.</p>

            <div className="space-y-4">
                {/* Select Member */}
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Who are you reviewing?</label>
                    <select
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#c5050c]"
                        value={selectedMember}
                        onChange={e => setSelectedMember(e.target.value)}
                    >
                        <option value="">Select a teammate</option>
                        {members.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                        ))}
                    </select>
                </div>

                {/* Select Badge */}
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Select Badge</label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setSelectedBadge('CODE_WIZARD')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${selectedBadge === 'CODE_WIZARD' ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400' : 'border-slate-200 hover:border-yellow-300'}`}
                        >
                            <span className="text-2xl">💻</span>
                            <span className="text-[10px] font-bold text-slate-600">Code Wizard</span>
                        </button>
                        <button
                            onClick={() => setSelectedBadge('DEADLINE_FAIRY')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${selectedBadge === 'DEADLINE_FAIRY' ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-400' : 'border-slate-200 hover:border-purple-300'}`}
                        >
                            <span className="text-2xl">🧚</span>
                            <span className="text-[10px] font-bold text-slate-600">Deadline Fairy</span>
                        </button>
                        <button
                            onClick={() => setSelectedBadge('COMMUNICATION_KING')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${selectedBadge === 'COMMUNICATION_KING' ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-400' : 'border-slate-200 hover:border-blue-300'}`}
                        >
                            <span className="text-2xl">🗣️</span>
                            <span className="text-[10px] font-bold text-slate-600">Comm. King</span>
                        </button>
                    </div>
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Short Comment (Optional)</label>
                    <textarea
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#c5050c]"
                        rows={2}
                        placeholder="Great job on the frontend..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={!selectedMember || !selectedBadge || submitting}
                className="w-full mt-6 py-3 bg-[#c5050c] text-white font-bold rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                {submitting ? "Sending..." : "Send Badge ✨"}
            </button>
        </div>
    );
}
