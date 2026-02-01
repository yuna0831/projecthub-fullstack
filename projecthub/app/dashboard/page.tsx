/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/UserContext"; // Adjust path if needed
import {
    ClipboardDocumentCheckIcon,
    BriefcaseIcon,
    UserGroupIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface DashboardData {
    ownedProjects: any[];
    myApplications: any[];
}

interface Notification {
    id: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
    read: boolean;
    link?: string;
    createdAt: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData>({ ownedProjects: [], myApplications: [] });
    const [notifications, setNotifications] = useState<Notification[]>([]); // 🆕
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'progress' | 'completed' | 'drafts' | 'applications' | 'notifications'>('progress');

    // Modal State
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
            fetchNotifications(); // 🆕
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const token = await user?.getIdToken();
            if (!token) return;

            const res = await fetch('http://localhost:3001/api/users/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch dashboard');
            const jsonData = await res.json();
            setData(jsonData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = await user?.getIdToken();
            if (!token) return;
            const res = await fetch('http://localhost:3001/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setNotifications(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleMarkRead = async (id: string, link?: string) => {
        try {
            const token = await user?.getIdToken();
            await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Update local
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

            if (link) window.location.href = link;
        } catch (e) { console.error(e); }
    };

    const handleOpenApplicants = (project: any) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    const handleUpdateStatus = async (appId: string, status: 'ACCEPTED' | 'REJECTED') => {
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`http://localhost:3001/api/users/applications/${appId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error('Failed to update');

            // Update local state to reflect change immediately
            setSelectedProject((prev: any) => ({
                ...prev,
                applications: prev.applications.map((app: any) =>
                    app.id === appId ? { ...app, status } : app
                )
            }));

            // Refresh main data too
            fetchDashboardData();

        } catch (e) {
            console.error(e);
            alert("Failed to update status");
        }
    };

    const handleCompleteProject = async (projectId: string) => {
        if (!confirm("Are you sure you want to mark this project as COMPLETED? This will allow peer reviews.")) return;

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`http://localhost:3001/api/projects/${projectId}/complete`, { // Using project route not generic update
                method: 'POST', // Changed to POST /complete
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                // Try legacy/other endpoint if fetch fails? (from previous code it was PUT project update but here we utilize the new route)
                // actually the new route is POST /complete. 
                throw new Error('Failed to complete project');
            }

            // Refresh
            fetchDashboardData();
        } catch (e) {
            console.error(e);
            alert("Failed to complete project");
        }
    };

    // Filter Logic
    const inProgressLeading = data.ownedProjects.filter(p => p.status !== 'DRAFT' && p.status !== 'COMPLETED');
    const inProgressParticipating = data.myApplications.filter(a => a.status === 'ACCEPTED' && a.project.status !== 'COMPLETED');

    const completedLeading = data.ownedProjects.filter(p => p.status === 'COMPLETED');
    const completedParticipating = data.myApplications.filter(a => a.status === 'ACCEPTED' && a.project.status === 'COMPLETED');

    const drafts = data.ownedProjects.filter(p => p.status === 'DRAFT');

    const activeApplications = data.myApplications.filter(a => a.status === 'PENDING' || a.status === 'REJECTED'); // Or just not Accepted?

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Manage your projects and applications.</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-6 hide-scrollbar">
                    {[
                        { id: 'my-projects', label: 'Projects I Posted', count: data.ownedProjects.length },
                        { id: 'progress', label: 'In Progress', count: inProgressLeading.length + inProgressParticipating.length },
                        { id: 'completed', label: 'Completed', count: completedLeading.length + completedParticipating.length },
                        { id: 'drafts', label: 'Drafts', count: drafts.length },
                        { id: 'applications', label: 'Applications', count: activeApplications.length },
                        { id: 'notifications', label: 'Notifications', count: notifications.filter(n => !n.read).length, badge: true }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 
                                ${activeTab === tab.id ? 'border-b-2 border-[#c5050c] text-[#c5050c]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab.badge ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {tab.badge ? tab.count : `(${tab.count})`}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-8">

                    {/* 📂 PROJECTS I POSTED (ALL OWNED) - Re-ordered to be consistent but render logic switch handles it */}
                    {activeTab === 'my-projects' && (
                        <div className="space-y-4">
                            {data.ownedProjects.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500 mb-4">You haven't posted any projects yet.</p>
                                    <Link href="/post" className="text-[#c5050c] font-bold hover:underline">Create a Project</Link>
                                </div>
                            )}
                            {data.ownedProjects.map(project => (
                                <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Link href={`/project/${project.id}`} className="text-lg font-bold text-slate-900 hover:text-[#c5050c] hover:underline transition">
                                                {project.title}
                                            </Link>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold 
                                                ${project.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                                    project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                        project.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-slate-100 text-slate-500'}`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/project/${project.id}`} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100 transition">
                                            View
                                        </Link>
                                        {project.status === 'DRAFT' && (
                                            <Link href={`/post/${project.id}/edit`} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition">
                                                Edit
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🟢 IN PROGRESS */}
                    {activeTab === 'progress' && (
                        <>
                            {inProgressLeading.length === 0 && inProgressParticipating.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500 mb-4">No active projects.</p>
                                    <Link href="/post" className="text-[#c5050c] font-bold hover:underline">Start a Project</Link>
                                    <span className="mx-2 text-slate-300">|</span>
                                    <Link href="/find" className="text-[#c5050c] font-bold hover:underline">Find a Project</Link>
                                </div>
                            )}

                            {/* Leading Section */}
                            {inProgressLeading.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1">Projects I Lead</h3>
                                    <div className="grid gap-4">
                                        {inProgressLeading.map(project => (
                                            <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Link href={`/project/${project.id}`} className="text-lg font-bold text-slate-900 hover:text-[#c5050c] hover:underline transition">
                                                            {project.title}
                                                        </Link>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${project.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {project.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {project.status === 'CLOSED' ? (
                                                        <button
                                                            onClick={() => handleCompleteProject(project.id)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                                                        >
                                                            <CheckCircleIcon className="w-5 h-5" /> Mark Completed
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenApplicants(project)}
                                                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                                        >
                                                            <UserGroupIcon className="w-5 h-5" />
                                                            {project._count.applications} Applicants
                                                            <ChevronRightIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Participating Section */}
                            {inProgressParticipating.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1 mt-8">Projects I Joined</h3>
                                    <div className="grid gap-4">
                                        {inProgressParticipating.map(app => (
                                            <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                                <div>
                                                    <Link href={`/project/${app.project.id}`} className="text-lg font-bold text-slate-900 mb-1 hover:text-[#c5050c] hover:underline block transition">
                                                        {app.project.title}
                                                    </Link>
                                                    <p className="text-xs text-slate-400">Accepted on {new Date(app.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1.5">
                                                    <CheckCircleIcon className="w-4 h-4" /> Member
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* 🏁 COMPLETED */}
                    {activeTab === 'completed' && (
                        <>
                            {completedLeading.length === 0 && completedParticipating.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500">No completed projects yet. Keep going! 🚀</p>
                                </div>
                            )}

                            {completedLeading.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1">Completed (Leader)</h3>
                                    <div className="grid gap-4">
                                        {completedLeading.map(project => (
                                            <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                                                <div>
                                                    <Link href={`/project/${project.id}`} className="text-lg font-bold text-slate-900 hover:text-[#c5050c] hover:underline flex items-center gap-2">
                                                        {project.title}
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">Completed</span>
                                                    </Link>
                                                    <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                                                </div>
                                                <Link href={`/project/${project.id}`} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition">
                                                    View Result
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {completedParticipating.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1 mt-8">Completed (Member)</h3>
                                    <div className="grid gap-4">
                                        {completedParticipating.map(app => (
                                            <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                                                <div>
                                                    <Link href={`/project/${app.project.id}`} className="text-lg font-bold text-slate-900 hover:text-[#c5050c] hover:underline flex items-center gap-2">
                                                        {app.project.title}
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">Completed</span>
                                                    </Link>
                                                    <p className="text-xs text-slate-400">Project Owner: {app.project.ownerId}</p>
                                                </div>
                                                <Link href={`/project/${app.project.id}`} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition">
                                                    View Result
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}



                    {/* 📝 DRAFTS */}
                    {activeTab === 'drafts' && (
                        <div className="space-y-4">
                            {drafts.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500">No drafts.</p>
                                </div>
                            )}
                            {drafts.map(project => (
                                <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
                                    <div>
                                        <Link href={`/project/${project.id}`} className="text-lg font-bold text-slate-900 hover:text-[#c5050c] hover:underline block transition">
                                            {project.title} <span className="text-slate-400 font-normal text-sm ml-2">(Draft)</span>
                                        </Link>
                                        <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                                    </div>
                                    <Link href={`/post/${project.id}/edit`} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition">
                                        Continue Editing
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 📤 APPLICATIONS */}
                    {activeTab === 'applications' && (
                        <div className="space-y-4">
                            {activeApplications.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500">No pending applications.</p>
                                </div>
                            )}
                            {activeApplications.map(app => (
                                <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
                                    <div>
                                        <Link href={`/project/${app.project.id}`} className="text-lg font-bold text-slate-900 mb-1 hover:text-[#c5050c] hover:underline block transition">
                                            {app.project.title}
                                        </Link>
                                        <p className="text-xs text-slate-400">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5
                                        ${app.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {app.status === 'REJECTED' ? <XCircleIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />}
                                        {app.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🔔 NOTIFICATIONS */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            {notifications.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500">No new notifications.</p>
                                </div>
                            )}
                            {notifications.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => handleMarkRead(note.id, note.link)}
                                    className={`bg-white rounded-xl border p-5 flex items-start cursor-pointer transition-colors hover:bg-slate-50
                                        ${note.read ? 'border-slate-200 opacity-70' : 'border-blue-200 shadow-sm ring-1 ring-blue-50'}
                                    `}
                                >
                                    <div className={`mt-1 w-2.5 h-2.5 rounded-full mr-4 flex-shrink-0 ${note.read ? 'bg-slate-300' : 'bg-[#c5050c]'}`}></div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${note.read ? 'text-slate-600' : 'text-slate-900 font-bold'}`}>
                                            {note.message}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                                    </div>
                                    {note.type === 'WARNING' && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded">Action Needed</span>}
                                </div>
                            ))}
                        </div>
                    )}

                </div>

                {/* Applicant Modal */}
                {isModalOpen && selectedProject && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-bold text-slate-900">Applicants for "{selectedProject.title}"</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-6 space-y-6">
                                {selectedProject.applications.length === 0 ? (
                                    <p className="text-center text-slate-500 py-10">No applicants yet.</p>
                                ) : (
                                    selectedProject.applications.map((app: any) => (
                                        <div key={app.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <a href={`/profile/${app.user.id}`} className="font-bold text-lg text-slate-900 hover:text-[#c5050c] hover:underline" target="_blank">
                                                        {app.user.name}
                                                    </a>
                                                    <p className="text-sm text-slate-500">{app.user.major} • {app.user.year}</p>
                                                    <a href={`mailto:${app.user.email}`} className="text-xs text-blue-600 hover:underline">{app.user.email}</a>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded text-xs font-bold ${app.status === 'ACCEPTED' ? 'text-green-600 bg-green-50' : app.status === 'REJECTED' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'}`}>
                                                    {app.status}
                                                </div>
                                            </div>

                                            {app.message && (
                                                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 italic">
                                                    "{app.message}"
                                                </div>
                                            )}

                                            {app.resumeUrl && (
                                                <div className="mb-4">
                                                    <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#c5050c] hover:underline flex items-center gap-1">
                                                        <ClipboardDocumentCheckIcon className="w-4 h-4" /> View Resume / Portfolio
                                                    </a>
                                                </div>
                                            )}

                                            {app.status === 'PENDING' && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                                                        className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition-colors"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                                                        className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
