/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import RecruitCard from "../../components/RecruitCard";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

export default function FindPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 9;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Academic Filters
  const [filterSubject, setFilterSubject] = useState("");
  const [filterNumber, setFilterNumber] = useState("");

  // Personal Filters
  const [filterCategory, setFilterCategory] = useState("");

  // Status & Tab State
  const [activeTab, setActiveTab] = useState<'academic' | 'personal' | 'hackathon'>('academic');
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED'>('OPEN');

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when switching tabs/filters
  useEffect(() => {
    setPage(1);
  }, [activeTab, statusFilter, filterSubject, filterNumber, filterCategory]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: LIMIT.toString(),
          status: statusFilter,
          tab: activeTab
        });

        if (debouncedSearch) params.append('search', debouncedSearch);

        if (activeTab === 'academic') {
          if (filterSubject) params.append('subject', filterSubject);
          if (filterNumber) params.append('courseNumber', filterNumber);
        } else if (activeTab === 'personal') {
          if (filterCategory) params.append('category', filterCategory);
        }

        const res = await fetch(`http://localhost:3001/api/projects?${params.toString()}`);
        if (!res.ok) throw new Error("Failed");

        const data = await res.json();
        setProjects(data.projects || []);
        setTotalPages(data.pagination?.totalPages || 1);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page, activeTab, statusFilter, debouncedSearch, filterSubject, filterNumber, filterCategory]);

  const subjects = ["COMP SCI", "ECE", "MATH", "STAT", "DS", "IS", "PSYCH", "ECON", "GEN BUS", "LSC", "ART", "OTHER"];

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
              {['academic', 'hackathon', 'personal'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                    ? "bg-[#c5050c] text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-50"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-200 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setStatusFilter('OPEN')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${statusFilter === 'OPEN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Recruiting (Open)
              </button>
              <button
                onClick={() => setStatusFilter('CLOSED')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${statusFilter === 'CLOSED' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Closed (Ends in 7 days)
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
                    placeholder="No. (577)"
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
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading projects...</div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {projects.map((p) => (
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
                  status={p.status || 'OPEN'}
                />
              ))}
            </div>

            {/* Pagination UI */}
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-100"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 font-bold text-lg mb-2">No projects found matching your search.</p>
            <button onClick={() => { setSearchTerm(""); setFilterSubject(""); setFilterNumber(""); setFilterCategory(""); }} className="text-[#c5050c] font-bold hover:underline">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
