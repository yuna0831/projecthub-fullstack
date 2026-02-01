/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useAuth } from "../../../context/UserContext";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    MapPinIcon,
    BriefcaseIcon,
    AcademicCapIcon,
} from "@heroicons/react/24/outline";
import Avatar from "../../../components/Avatar"; // 🆕

export default function UserProfilePage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [educations, setEducations] = useState<any[]>([]);
    const [experiences, setExperiences] = useState<any[]>([]);
    const [badges, setBadges] = useState<any>({});

    useEffect(() => {
        if (id && user) {
            fetchProfile();
        }
    }, [id, user]);

    async function fetchProfile() {
        try {
            const token = await user?.getIdToken();
            // Fetch User by ID
            const res = await fetch(`http://localhost:3001/api/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to fetch user");

            const userData = await res.json();
            setProfile(userData);
            setEducations(userData.educations || []);
            setExperiences(userData.experiences || []);

            // Fetch Badges
            fetch(`http://localhost:3001/api/reviews/user/${userData.id}/badges`)
                .then(r => r.json())
                .then(data => setBadges(data))
                .catch(e => console.error("Badge fetch error", e));

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
    if (!profile) return <div className="min-h-screen flex items-center justify-center">User not found</div>;

    return (
        <main className="min-h-screen bg-[#F3F2EF] py-8 px-4 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* 1. Header Section (LinkedIn Style) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
                    {/* Cover Image */}
                    <div className="h-52 relative bg-[#1D2226]">
                        {profile.coverImage ? (
                            <Image src={profile.coverImage} alt="Cover" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-[#c5050c] to-[#9b0000]"></div>
                        )}
                    </div>

                    <div className="px-8 pb-8">
                        <div className="flex flex-col md:flex-row items-start justify-between">

                            {/* Profile Info */}
                            <div className="flex flex-col md:flex-row gap-6 -mt-20 relative z-10">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-xl bg-white overflow-hidden relative flex items-center justify-center">
                                        <Avatar name={profile.name} id={profile.id} size="2xl" className="w-full h-full text-6xl" />
                                    </div>
                                </div>

                                {/* Text Info */}
                                <div className="mt-20 md:mt-24 space-y-2">
                                    <div>
                                        <h1 className="text-3xl font-bold flex items-center gap-3">
                                            {profile.name}
                                            {profile.futureRole && (
                                                <span className="px-3 py-1 bg-red-50 text-[#c5050c] text-xs font-bold uppercase tracking-wide rounded-full border border-red-100 shadow-sm">
                                                    {profile.futureRole}
                                                </span>
                                            )}
                                        </h1>
                                        <div className="text-slate-600 flex items-center gap-4 mt-1 text-sm font-medium">
                                            <span className="flex items-center gap-1.5"><AcademicCapIcon className="w-5 h-5 text-slate-400" /> {profile.major || "Undecided"} • {profile.year || "Freshman"}</span>
                                            <span className="flex items-center gap-1.5"><MapPinIcon className="w-5 h-5 text-slate-400" /> Madison, WI</span>
                                        </div>

                                        {/* Work Style Chips */}
                                        {profile.workStyles && profile.workStyles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {profile.workStyles.map((ws: string) => (
                                                    <span key={ws} className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm border border-slate-700">
                                                        {ws}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons (Social Links Only) */}
                            <div className="mt-4 md:mt-6 flex flex-col items-end gap-3">
                                <div className="flex gap-3">
                                    {profile.githubUrl && (
                                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#c5050c] hover:border-[#c5050c] rounded-full transition shadow-sm group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src="https://simpleicons.org/icons/github.svg" width={20} height={20} alt="GitHub" className="opacity-70 group-hover:opacity-100" />
                                        </a>
                                    )}
                                    {profile.linkedinUrl && (
                                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0077b5] hover:border-[#0077b5] rounded-full transition shadow-sm group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src="https://simpleicons.org/icons/linkedin.svg" width={20} height={20} alt="LinkedIn" className="opacity-70 group-hover:opacity-100" />
                                        </a>
                                    )}
                                    {profile.portfolioUrl && (
                                        <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-900 rounded-full transition shadow-sm group">
                                            <BriefcaseIcon className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* About (Summary) */}
                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">About Me</h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line max-w-4xl">{profile.bio || "No description provided."}</p>
                        </div>
                    </div>
                </div>

                {/* 2. Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column (Stats, Badges, Skills) */}
                    <div className="space-y-6">

                        {/* 🏆 Badges */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🏆</div>
                            <h3 className="text-lg font-bold mb-4 relative z-10">Reputation & Badges</h3>

                            {Object.keys(badges).length === 0 ? (
                                <div className="text-slate-400 text-sm italic relative z-10">
                                    No badges yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 relative z-10">
                                    {/* Badge Rendering */}
                                    {['CODE_WIZARD', 'DEADLINE_FAIRY', 'COMMUNICATION_KING'].map(type => badges[type] && (
                                        <div key={type} className="bg-white/10 p-2 rounded-lg text-center backdrop-blur-sm border border-white/10 hover:bg-white/20 transition cursor-help" title={type}>
                                            <div className="text-2xl mb-1">{type === 'CODE_WIZARD' ? '💻' : type === 'DEADLINE_FAIRY' ? '🧚' : '🗣️'}</div>
                                            <div className="text-xs font-bold opacity-80">{badges[type]}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 🛠 Skills */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Top Skills</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {profile.techStacks && profile.techStacks.length > 0 ? profile.techStacks.map((tech: string) => (
                                    <div key={tech} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 hover:shadow-md hover:border-[#c5050c]/30 transition group">
                                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm group-hover:text-[#c5050c]">{tech.substring(0, 2).toUpperCase()}</div>
                                        <span className="text-sm font-semibold text-slate-700">{tech}</span>
                                    </div>
                                )) : <p className="text-slate-400 text-sm">No skills added.</p>}
                            </div>
                        </div>

                    </div>

                    {/* Right Column (Timeline: Exp & Edu) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Experience Timeline */}
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <BriefcaseIcon className="w-6 h-6 text-[#c5050c]" /> Professional Experience
                                </h2>
                            </div>

                            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
                                {experiences.map((exp: any) => (
                                    <div key={exp.id} className="relative pl-10 group">
                                        {/* Dot */}
                                        <div className="absolute left-[13px] top-1.5 w-3.5 h-3.5 bg-white border-[3px] border-[#c5050c] rounded-full group-hover:scale-125 transition-transform z-10" />

                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{exp.title}</h3>
                                                <div className="text-slate-600 font-medium">{exp.company}</div>
                                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide font-bold">{exp.startDate} — {exp.endDate || "Present"}</p>
                                                {exp.description && <p className="mt-3 text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{exp.description}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {experiences.length === 0 && <p className="pl-10 text-slate-400 italic">No experience entries.</p>}
                            </div>
                        </div>

                        {/* Education Timeline */}
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <AcademicCapIcon className="w-6 h-6 text-[#c5050c]" /> Education History
                                </h2>
                            </div>

                            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
                                {educations.map((edu: any) => (
                                    <div key={edu.id} className="relative pl-10 group">
                                        <div className="absolute left-[13px] top-1.5 w-3.5 h-3.5 bg-white border-[3px] border-slate-400 group-hover:border-[#c5050c] rounded-full transition-colors z-10" />

                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{edu.school}</h3>
                                                <div className="text-slate-600">{edu.degree ? `${edu.degree} in ` : ''}{edu.major}</div>
                                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide font-bold">Class of {edu.graduationYear}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {educations.length === 0 && <p className="pl-10 text-slate-400 italic">No education entries.</p>}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}
