"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/UserContext";
import { getNotifications, markNotificationRead, subscribeToNotifications, Notification } from "../lib/firestore";

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Real-time subscription
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToNotifications(user.uid, (data) => {
            setNotifications(data);
            setHasUnread(data.some(n => !n.read));
        });

        return () => unsubscribe();
    }, [user]);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleRead = async (id: string) => {
        if (!user) return;
        await markNotificationRead(user.uid, id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setHasUnread(notifications.some(n => !n.read && n.id !== id));
    };

    if (!user) return null;

    return (
        <div className="relative">
            <button onClick={handleToggle} className="relative p-2 text-gray-600 hover:text-blue-500">
                🔔
                {hasUnread && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-lg rounded-lg z-50">
                    <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <li className="p-4 text-center text-gray-400 text-sm">No notifications</li>
                        ) : (
                            notifications.map((n) => (
                                <li
                                    key={n.id}
                                    className={`p-3 border-b hover:bg-gray-50 text-sm cursor-pointer ${n.read ? 'opacity-50' : 'bg-blue-50 font-medium'}`}
                                    onClick={() => handleRead(n.id)}
                                >
                                    <p>{n.message}</p>
                                    <span className="text-xs text-gray-400 block mt-1">
                                        {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
