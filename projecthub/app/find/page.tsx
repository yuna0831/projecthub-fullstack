"use client";

import { useEffect, useState } from "react";
import { getAllProjects } from "../../lib/firestore";
import SkeletonCard from "../../components/SkeletonCard";
import RecruitCard from "../../components/RecruitCard";

export default function FindPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const categories = ["All", "IT/Development", "Design/Creative", "Business/Startup", "Marketing", "Data/Research", "Other"];

  useEffect(() => {
    async function fetchData() {
      const data = await getAllProjects();
      console.log("✅ Projects fetched:", data);
      setProjects(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Filter Logic
  const filteredProjects = filter === "All"
    ? projects
    : projects.filter(p => p.category === filter);

  if (loading) {
    return (
      <main className="min-h-screen p-6 bg-gray-50">
        <h1 className="text-3xl font-bold mb-6 text-center">Find a Project</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Find a Project</h1>
          <p className="text-slate-500 text-lg mb-8">Discover exciting side projects and join a team today.</p>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${filter === cat
                    ? "bg-slate-900 text-white shadow-md transform scale-105"
                    : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((p, index) => (
              <RecruitCard
                key={p.id || index}
                id={p.id || ""}
                title={p.title || "Untitled"}
                description={p.description || "No description provided."}
                role={p.role || "Unspecified role"}
                createdBy={p.createdBy || "Anonymous"}
                teamMembers={p.teamMembers}
                techStack={p.techStack}
                category={p.category}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-lg">No projects found in this category.</p>
            <p className="text-slate-400 text-sm mt-2">Check back later or start your own project!</p>
          </div>
        )}
      </div>
    </main>
  );
}
