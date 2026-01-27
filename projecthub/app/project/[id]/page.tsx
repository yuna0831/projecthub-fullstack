"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../context/UserContext";
import ReactMarkdown from "react-markdown";
import {
  BriefcaseIcon, MapPinIcon, ClockIcon, AcademicCapIcon,
  CheckCircleIcon, UserGroupIcon, EnvelopeIcon, CalendarIcon, ServerIcon
} from "@heroicons/react/24/outline";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Project Data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`http://localhost:3001/api/projects/${id}`);
        if (!res.ok) throw new Error("Failed to fetch project");
        const data = await res.json();
        setProject(data);

        if (user) {
          // Check ownership
          // Assuming the backend returns owner info. 
          // If the backend assumes we passed the token, we can verify properly.
          // Since it's public GetProject, we just compare IDs/Emails.
          const isOwnerCheck = data.owner?.email === user.email; // Fallback to email or use ID if available in session
          setIsOwner(isOwnerCheck);

          const token = await user.getIdToken();

          if (isOwnerCheck) {
            // Fetch Applicants
            const appRes = await fetch(`http://localhost:3001/api/projects/${id}/applications`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (appRes.ok) setApplicants(await appRes.json());
          } else {
            // Check if user has already applied
            try {
              const statusRes = await fetch(`http://localhost:3001/api/projects/${id}/application-status`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.applied) setHasApplied(true);
              }
            } catch (e) {
              console.error("Failed to check application status", e);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, user]);


  const handleApply = async () => {
    if (!user) return alert("Please sign in first.");

    // 🛡️ Email Verification Check
    if (!user.emailVerified) {
      alert("⚠️ Please verify your @wisc.edu email first via your inbox to apply.");
      return;
    }

    const token = await user.getIdToken();

    try {
      const res = await fetch(`http://localhost:3001/api/projects/${id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: "I am interested!" })
      });

      if (res.ok) {
        setHasApplied(true);
        alert("Successfully applied! 🚀");
      } else {
        const err = await res.json();
        if (err.error?.includes("Already applied")) {
          setHasApplied(true);
          alert("You have already applied.");
        } else {
          alert("Failed: " + err.error);
        }
      }
    } catch (e) {
      alert("Error applying");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#c5050c] border-t-transparent rounded-full"></div></div>;
  if (!project) return <div className="text-center py-20 text-slate-500">Project not found.</div>;

  const isCourse = project.isCourseProject;

  return (
    <main className="min-h-screen bg-slate-50 font-sans">

      {/* 🔴 Top Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

          <div className="flex flex-wrap gap-3 mb-4">
            {/* Status Badge */}
            {project.status === 'OPEN' ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Recruiting
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wide">
                Closed
              </span>
            )}

            {/* Course Badge (Cardinal Red) */}
            {isCourse && (
              <span className="px-3 py-1 bg-[#c5050c]/5 text-[#c5050c] border border-[#c5050c]/20 rounded-full text-xs font-extrabold uppercase tracking-wide">
                {project.courseCode || 'Course Project'}
              </span>
            )}

            {/* Semester Badge */}
            {project.semester && (
              <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" /> {project.semester}
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            {project.title}
          </h1>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              Posted by <span className="font-bold text-slate-800 underline decoration-slate-300 underline-offset-4">{project.owner?.name || "Unknown"}</span>
            </span>
            {project.deadline && (
              <span className="flex items-center gap-1 text-[#c5050c] font-medium">
                <ClockIcon className="w-4 h-4" /> Deadline: {new Date(project.deadline).toLocaleDateString()}
              </span>
            )}
            <span className="text-slate-400">Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>

        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-10">

          {/* Markdown Content */}
          <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-[#c5050c] prose-img:rounded-xl">
            <ReactMarkdown>{project.content || project.description}</ReactMarkdown>
          </div>

          {/* Roles Section */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BriefcaseIcon className="w-6 h-6 text-slate-400" /> Open Roles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {project.roles?.map((role: any) => (
                <div key={role.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-slate-800">{role.name}</h4>
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-bold">
                      {role.count} spot{role.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {role.skills?.map((skill: string) => (
                      <span key={skill} className="text-xs bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {(!project.roles || project.roles.length === 0) && (
                <p className="text-slate-500 italic">No specific roles listed.</p>
              )}
            </div>
          </div>

          {/* Owner: Applicants Section */}
          {isOwner && (
            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl ring-1 ring-white/10 mt-12">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <UserGroupIcon className="w-7 h-7 text-[#c5050c]" />
                Applicants <span className="text-slate-400 text-lg font-normal">({applicants.length})</span>
              </h3>

              <div className="space-y-4">
                {applicants.map((app: any) => (
                  <div key={app.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-lg text-white">{app.user.name}</p>
                      <p className="text-slate-400 text-sm">{app.user.major} • {app.user.year}</p>
                      {app.message && (
                        <div className="mt-2 text-sm text-slate-300 bg-slate-800 p-3 rounded-lg border border-slate-700/50">
                          "{app.message}"
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {app.resumeUrl && (
                        <a href={app.resumeUrl} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors">
                          View Resume
                        </a>
                      )}
                      <a href={`mailto:${app.user.email}`} className="px-4 py-2 bg-[#c5050c] hover:bg-red-700 rounded-lg text-sm font-bold text-white transition-colors">
                        Contact
                      </a>
                    </div>
                  </div>
                ))}
                {applicants.length === 0 && (
                  <div className="text-slate-500 py-4 text-center">No applicants yet.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-1 space-y-6">

          {/* Apply / Owner Actions */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 shadow-slate-200/50 sticky top-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Action</h3>

            {project.status === 'CLOSED' ? (
              <button disabled className="w-full bg-slate-300 text-white font-bold py-3 rounded-xl cursor-not-allowed">
                Applications Closed
              </button>
            ) : isOwner ? (
              <div className="space-y-3">
                <a
                  href={`/post/${id}/edit`}
                  className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-center"
                >
                  Edit Project
                </a>
                <div className="text-center text-xs text-slate-400">Owner Dashboard Active</div>
              </div>
            ) : !user ? (
              <button
                onClick={() => alert("Please Login to Apply")}
                className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl opacity-90 transition-opacity hover:opacity-100"
              >
                Login to Apply
              </button>
            ) : hasApplied ? (
              <button disabled className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-default">
                <CheckCircleIcon className="w-5 h-5" /> Applied
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="w-full bg-[#c5050c] text-white font-bold py-3 rounded-xl shadow-md hover:bg-red-700 hover:shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Apply Now
              </button>
            )}
          </div>

          {/* Project Details Sidebar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Project Details</h3>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase">Meeting</span>
                  <span className="font-semibold text-slate-800">{project.meetingType}</span>
                </div>
              </div>

              {project.location && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase">Location</span>
                    <span className="font-semibold text-slate-800">{project.location}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <ClockIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase">Duration</span>
                  <span className="font-semibold text-slate-800">{project.duration || "One Semester"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stacks Sidebar */}
          {project.techStacks && project.techStacks.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <ServerIcon className="w-4 h-4" /> Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.techStacks.map((tech: any) => (
                  <span key={tech.id} className="text-sm px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-100 font-medium">
                    {tech.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
