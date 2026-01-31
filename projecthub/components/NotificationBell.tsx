"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/UserContext";

interface MyNotification {
    id: string;
    message: string;
    type: "INFO" | "SUCCESS" | "ERROR";
    read: boolean;
    link?: string;
    createdAt: string;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<MyNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Polling Function
    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`http://localhost:3001/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched notifications:", data.length);
                setNotifications(data);
                setHasUnread(data.some((n: MyNotification) => !n.read));
            } else {
                console.error("Fetch notifications failed status:", res.status);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    // Poll every 60s
    useEffect(() => {
        if (!user) return;
        fetchNotifications(); // Initial
        const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [user]);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleRead = async (id: string, link?: string) => {
        if (!user) return;

        // Optimistic Update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setHasUnread(notifications.some(n => !n.read && n.id !== id));

        // Background API Call
        try {
            const token = await user.getIdToken();
            // Fixed endpoint from /api/users/notifications to /api/notifications
            await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
                method: 'PATCH', // Fixed method to PATCH to match backend route
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error("Mark read failed", e);
        }

        // Navigate if link exists
        if (link) {
            window.location.href = link;
        }
    };

    if (!user) return null;

    return (
        <div className="relative">
            <button onClick={handleToggle} className="relative p-2 text-gray-600 hover:text-blue-500 transition-colors">
                <span className="text-xl">🔔</span>
                {hasUnread && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden ring-1 ring-black/5 animate-fadeIn">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                            <li className="p-8 text-center text-slate-400 text-sm">No new notifications</li>
                        ) : (
                            notifications.map((n) => (
                                <li
                                    key={n.id}
                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${n.read ? 'opacity-60 grayscale' : 'bg-blue-50/30'}`}
                                    onClick={() => handleRead(n.id, n.link)}
                                >
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-red-500'}`} />
                                    <div>
                                        <p className="text-sm text-slate-800 leading-snug">{n.message}</p>
                                        <span className="text-xs text-slate-400 block mt-1.5 font-medium">
                                            {new Date(n.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
