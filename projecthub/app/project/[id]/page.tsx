"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firestore";
import { useParams } from "next/navigation";
import ApplyModal from "../../../components/ApplyModal";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      const docRef = doc(db, "recruitPosts", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setProject(docSnap.data());
    }
    fetchProject();
  }, [id]);

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-4 bg-slate-200 rounded w-32 mb-4"></div>
        <div className="h-6 bg-slate-200 rounded w-48"></div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left Column: Content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-8">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-4">
              Recruiting
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-4">{project.title}</h1>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <span>Posted by {project.createdBy}</span>
              <span>•</span>
              <span>{project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 prose prose-slate max-w-none">
            <h3 className="text-xl font-bold text-slate-900 mb-4">About the Project</h3>
            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {project.description}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Action Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white p-6 rounded-2xl shadow-lg border border-indigo-50">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Join this Project</h3>

            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Looking For</p>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-indigo-100">
                  {project.role}
                </span>
              </div>
            </div>

            {/* Tech Stack Section */}
            {project.techStack && project.techStack.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tech Stack</p>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((stack: string) => (
                    <span key={stack} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold border border-slate-200">
                      {stack}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Team Size</p>
              <div className="flex -space-x-2 overflow-hidden">
                {/* Mock Avatars or Real Members if available */}
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs text-slate-500 font-bold">
                  {project.createdBy[0]}
                </div>
                {(project.teamMembers || []).map((m: any, i: number) => (
                  <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-green-100 flex items-center justify-center text-xs text-green-600 font-bold">
                    M
                  </div>
                ))}
              </div>
            </div>

            {project.useApply ? (
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              >
                Apply Now
              </button>
            ) : (
              <a
                href={`mailto:${project.createdByEmail}`}
                className="block w-full text-center bg-white text-slate-700 border-2 border-slate-200 font-bold py-3.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                Contact via Email
              </a>
            )}

            <p className="text-center text-slate-400 text-xs mt-4">
              Reliable & Trustworthy Platform
            </p>
          </div>
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <ApplyModal
          projectId={id as string}
          onClose={() => setShowModal(false)}
        />
      )}
    </main>
  );
}
