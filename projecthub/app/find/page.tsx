/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import RecruitCard from "../../components/RecruitCard";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

export default function FindPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterNumber, setFilterNumber] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [activeTab, setActiveTab] = useState<'academic' | 'personal' | 'hackathon'>('academic');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:3001/api/projects');
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setProjects(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter Logic
  const filteredProjects = projects.filter(p => {
    let matchesTab = false;
    if (activeTab === 'academic') matchesTab = p.isCourseProject === true;
    else if (activeTab === 'hackathon') matchesTab = !!p.hackathonName;
    else matchesTab = !p.isCourseProject && !p.hackathonName; // Personal

    // Search by Title OR Owner Name
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Course Filters
    let matchesCourse = true;
    if (activeTab === 'academic') {
      if (filterSubject && !p.courseCode?.startsWith(filterSubject)) matchesCourse = false;
      if (filterNumber && !p.courseCode?.includes(filterNumber)) matchesCourse = false;
    }

    // Category Filter (Personal)
    let matchesCategory = true;
    if (activeTab === 'personal') {
      if (filterCategory && p.category !== filterCategory) matchesCategory = false;
    }

    return matchesTab && matchesSearch && matchesCourse && matchesCategory;
  });

  const subjects = ["COMP SCI", "ECE", "MATH", "STAT", "DS", "IS", "PSYCH", "ECON", "GEN BUS", "LSC", "ART", "OTHER"];

  if (loading) {
    // ... (loading state)
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header Area */}
        <header className="mb-12 text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#c5050c]">
            Explore Projects
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find a team for your class project or join a side hustle with fellow Badgers.
          </p>

          {/* TABS */}
          <div className="flex justify-center mt-8 mb-6">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
              <button
                onClick={() => setActiveTab('academic')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'academic'
                  ? "bg-[#c5050c] text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                Academic
              </button>
              <button
                onClick={() => setActiveTab('hackathon')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'hackathon'
                  ? "bg-[#c5050c] text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                Hackathon
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'personal'
                  ? "bg-[#c5050c] text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                Personal
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-3 max-w-4xl mx-auto">
            {/* Main Search */}
            <div className="relative w-full md:flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-[#c5050c] focus:border-[#c5050c] outline-none transition-all"
              />
            </div>

            {/* Academic Filters */}
            {activeTab === 'academic' && (
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:min-w-[140px]">
                  <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full pl-9 pr-8 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-[#c5050c] outline-none appearance-none text-sm font-semibold text-slate-600"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="relative w-[100px]">
                  <input
                    type="text"
                    placeholder="No. (e.g 577)"
                    value={filterNumber}
                    onChange={e => setFilterNumber(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-[#c5050c] outline-none text-sm text-center"
                  />
                </div>
              </div>
            )}

            {/* Personal Filters */}
            {activeTab === 'personal' && (
              <div className="relative w-full md:w-auto min-w-[160px]">
                <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-9 pr-8 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-[#c5050c] outline-none appearance-none text-sm font-semibold text-slate-600"
                >
                  <option value="">All Categories</option>
                  {["IT/Development", "Design/Creative", "Marketing/Business", "Content/Writing", "Sales", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <RecruitCard
                key={p.id}
                id={p.id}
                title={p.title}
                description={p.description}
                ownerName={p.owner?.name || "Unknown"}
                techStacks={p.techStacks ? p.techStacks.map((t: any) => t.name) : []}
                courseCode={p.courseCode}
                semester={p.semester}
                isCourseProject={p.isCourseProject}
                roles={p.roles || []}
                hackathonName={p.hackathonName}
                hackathonDate={p.hackathonDate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 font-bold text-lg mb-2">No projects found matching your {activeTab} search.</p>
            <button onClick={() => { setSearchTerm(""); setFilterSubject(""); setFilterNumber(""); setFilterCategory(""); }} className="text-[#c5050c] font-bold hover:underline">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
