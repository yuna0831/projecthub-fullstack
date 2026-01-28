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

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData>({ ownedProjects: [], myApplications: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'managed' | 'applied'>('managed');

    // Modal State
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (user) fetchDashboardData();
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
                <div className="flex border-b border-slate-200 mb-8">
                    <button
                        onClick={() => setActiveTab('managed')}
                        className={`pb-4 px-6 text-sm font-bold transition-all ${activeTab === 'managed' ? 'border-b-2 border-[#c5050c] text-[#c5050c]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Projects I Manage ({data.ownedProjects.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('applied')}
                        className={`pb-4 px-6 text-sm font-bold transition-all ${activeTab === 'applied' ? 'border-b-2 border-[#c5050c] text-[#c5050c]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        My Applications ({data.myApplications.length})
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'managed' ? (
                    <div className="space-y-4">
                        {data.ownedProjects.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 mb-4">You haven't posted any projects yet.</p>
                                <Link href="/post" className="text-[#c5050c] font-bold hover:underline">Create a Project</Link>
                            </div>
                        )}
                        {data.ownedProjects.map(project => (
                            <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${project.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                                </div>

                                <button
                                    onClick={() => handleOpenApplicants(project)}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                >
                                    <UserGroupIcon className="w-5 h-5" />
                                    {project._count.applications} Applicants
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.myApplications.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 mb-4">You haven't applied to any projects yet.</p>
                                <Link href="/find" className="text-[#c5050c] font-bold hover:underline">Find Projects</Link>
                            </div>
                        )}
                        {data.myApplications.map(app => (
                            <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{app.project.title}</h3>
                                    <p className="text-xs text-slate-400">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5
                            ${app.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                        app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-600'}`
                                }>
                                    {app.status === 'ACCEPTED' && <CheckCircleIcon className="w-4 h-4" />}
                                    {app.status === 'REJECTED' && <XCircleIcon className="w-4 h-4" />}
                                    {app.status === 'PENDING' && <ClockIcon className="w-4 h-4" />}
                                    {app.status}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
                                                    <h3 className="font-bold text-lg text-slate-900">{app.user.name}</h3>
                                                    <p className="text-sm text-slate-500">{app.user.major} • {app.user.year}</p>
                                                    <a href={`mailto:${app.user.email}`} className="text-xs text-blue-600 hover:underline">{app.user.email}</a>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded textxs font-bold ${app.status === 'ACCEPTED' ? 'text-green-600 bg-green-50' : app.status === 'REJECTED' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'}`}>
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
