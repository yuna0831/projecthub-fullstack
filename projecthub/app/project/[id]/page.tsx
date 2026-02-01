/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../context/UserContext";
import ReactMarkdown from "react-markdown";
import {
  BriefcaseIcon, MapPinIcon, ClockIcon,
  CheckCircleIcon, UserGroupIcon, CalendarIcon, ServerIcon, XCircleIcon
} from "@heroicons/react/24/outline";
import ReviewModal from "../../../components/ReviewModal";
import ApplyModal from "../../../components/ApplyModal";
import Avatar from "../../../components/Avatar"; // 🆕


export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [completionRequested, setCompletionRequested] = useState(false); // 🆕

  // Report State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportDesc, setReportDesc] = useState('');

  const handleReportSubmit = async () => {
    if (!reportReason) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch('http://localhost:3001/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: 'PROJECT',
          targetId: id,
          reason: reportReason,
          description: reportDesc
        })
      });

      if (res.ok) {
        alert("Report submitted successfully.");
        setReportModalOpen(false);
        setReportDesc('');
      } else {
        alert("Failed to submit report.");
      }
    } catch (e) { console.error(e); }
  };

  // Fetch Project Data
  const [userProfile, setUserProfile] = useState<any>(null); // 🆕

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`http://localhost:3001/api/projects/${id}`);
        if (!res.ok) throw new Error("Failed to fetch project");
        const data = await res.json();
        setProject(data);
        setCompletionRequested(data.completionRequested || false);

        if (user) {
          const token = await user.getIdToken();

          // 🆕 Fetch Current User Profile for Apply Modal Check
          try {
            const profileRes = await fetch(`http://localhost:3001/api/users/${user.uid}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (profileRes.ok) setUserProfile(await profileRes.json());
          } catch (e) { console.error("Failed to fetch profile", e); }

          // Check ownership
          const isOwnerCheck = data.owner?.email === user.email;
          setIsOwner(isOwnerCheck);

          if (isOwnerCheck) {
            // Fetch Applicants
            const appRes = await fetch(`http://localhost:3001/api/projects/${id}/applications`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (appRes.ok) setApplicants(await appRes.json());
          } else {
            // Check if user has already applied
            try {
              const statusRes = await fetch(`http://localhost:3001/api/projects/${id}/status`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.applied) {
                  setHasApplied(true);
                  setApplicationStatus(statusData.status);
                }
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


  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const handleApplyClick = () => {
    if (!user) return alert("Please sign in first.");
    setIsApplyModalOpen(true);
  };

  const handleConfirmApply = async (roleName: string, answers: Record<string, string>) => { // 🆕 answers
    if (!user) return;
    const token = await user.getIdToken();

    try {
      const res = await fetch(`http://localhost:3001/api/projects/${id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: "I am interested!",
          roleName, // Send selected role
          answers // 🆕 Send answers
        })
      });

      if (res.ok) {
        setHasApplied(true);
        alert(`Successfully applied as ${roleName}! 🚀`);
      } else {
        const err = await res.json();
        if (err.error?.includes("Already applied")) {
          setHasApplied(true);
          alert("You have already applied.");
        } else {
          alert("Failed: " + err.error);
        }
      }
    } catch {
      alert("Error applying");
    }
  };

  // ... (withdraw, completion handlers) ...
  // Keeping Withdraw/Completion handlers as is, reusing existing code by not replacing if not needed.
  // Wait, I need to be careful with replace_file_content range. 
  // I will skip replacing Withdraw/Completion handlers if I can target specific blocks. 
  // But I need to update the Applicants View which is further down.
  // I will split this into two edits or one large edit if contiguous.
  // The handlers are in the middle. The fetch is at the top. The render is at the bottom.
  // I'll do 3 edits for safety.

  // 1. Update useEffect and handleConfirmApply (fetching profile + adding answers arg)
  // This block covers lines ~63 to ~155.

  // 2. Update Render - Applicants Section (isOwner view)
  // This block covers lines ~330 to ~366.

  // 3. Update Render - ApplyModal (pass props)
  // This block covers lines ~612 to ~618.

  // NOTE: I am in the tool call generation. I cannot split into 3 calls in one `replace_file_content`.
  // I must use `multi_replace_file_content`.

  // Let's use `multi_replace_file_content`.

  // ... Wait, I'm defining the tool arguments right now.


  // 🆕 Withdraw Application
  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to withdraw?")) return;
    if (!user) return;
    const token = await user.getIdToken();
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${id}/application`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHasApplied(false);
        setApplicationStatus(null);
        alert("Application withdrawn.");
      } else {
        alert("Failed to withdraw.");
      }
    } catch (e) {
      console.error(e);
      alert("Error withdrawing.");
    }
  };

  // 🆕 Request Completion (Owner)
  const handleRequestCompletion = async () => {
    if (!confirm("Start Project Completion Vote? Members will need to confirm.")) return;
    if (!user) return;
    const token = await user.getIdToken();
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${id}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCompletionRequested(true);
        alert("Completion requested! Waiting for member confirmation.");
      } else {
        const err = await res.json();
        alert("Failed: " + err.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error requesting completion.");
    }
  };

  // 🆕 Confirm Completion (Member)
  const handleConfirmCompletion = async () => {
    if (!confirm("Confirm that this project is completed?")) return;
    if (!user) return;
    const token = await user.getIdToken();
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${id}/complete/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (data.project?.status === 'COMPLETED') {
          setProject(data.project); // Update UI to completed state
        }
      } else {
        alert("Failed: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error confirming completion.");
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
            {project.status === 'DRAFT' ? (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase tracking-wide border border-yellow-200">
                Draft
              </span>
            ) : project.status === 'OPEN' ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Recruiting
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wide">
                {project.status}
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
              Posted by <a href={`/profile/${project.owner?.id}`} className="font-bold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-[#c5050c] hover:decoration-[#c5050c] transition">{project.owner?.name || "Unknown"}</a>
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
                  <div key={app.id} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <Avatar name={app.user.name} id={app.user.id} size="lg" className="flex-shrink-0" />
                        <div>
                          <p className="font-bold text-lg text-white">{app.user.name}</p>
                          <p className="text-slate-400 text-sm mb-1">{app.user.major} • {app.user.year}</p>
                          <p className="text-[#c5050c] text-xs font-bold uppercase tracking-wider">{app.roleName || 'General Member'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {/* Social Links if available */}
                        {app.user.githubUrl && <a href={app.user.githubUrl} target="_blank" className="text-slate-400 hover:text-white">GitHub</a>}
                        {app.user.linkedinUrl && <a href={app.user.linkedinUrl} target="_blank" className="text-slate-400 hover:text-white">LinkedIn</a>}
                      </div>
                    </div>

                    {/* Answers Display */}
                    {app.answers && Object.keys(app.answers).length > 0 && (
                      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase">Screening Answers</p>
                        {Object.entries(app.answers).map(([q, a]) => (
                          <div key={q}>
                            <p className="text-xs text-slate-400 mb-0.5">{q}</p>
                            <p className="text-sm text-white">{a as string}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-slate-700/50">
                      {app.resumeUrl && (
                        <a href={app.resumeUrl} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors">
                          Resume
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
              <div className="space-y-3">
                <button disabled className="w-full bg-slate-300 text-white font-bold py-3 rounded-xl cursor-not-allowed">
                  Project Closed
                </button>
                {/* Allow reopening? */}
              </div>
            ) : project.status === 'COMPLETED' ? (
              <div className="space-y-3">
                <button disabled className="w-full bg-green-600 text-white font-bold py-3 rounded-xl cursor-default flex items-center justify-center gap-2">
                  <CheckCircleIcon className="w-6 h-6" /> Project Completed
                </button>
                {(isOwner || hasApplied) && (
                  <button onClick={() => setReviewModalOpen(true)} className="block w-full text-center py-2 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-bold text-slate-900 transition shadow-sm">
                    ⭐ Give Peer Review
                  </button>
                )}
              </div>
            ) : isOwner ? (
              <div className="space-y-3">
                <a
                  href={`/post/${id}/edit`}
                  className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-center"
                >
                  Edit Project
                </a>
                <div className="text-center text-xs text-slate-400">Owner Dashboard Active</div>

                {/* Owner Actions */}
                {project.status === 'DRAFT' ? (
                  <button
                    onClick={async () => {
                      if (!user) return;
                      if (!confirm("Are you sure you want to publish this project? It will become visible to everyone.")) return;
                      const token = await user.getIdToken();
                      const res = await fetch(`http://localhost:3001/api/projects/${id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ status: 'OPEN' })
                      });
                      if (res.ok) {
                        setProject({ ...project, status: 'OPEN' });
                        alert("Project Published! 🚀");
                      } else {
                        const err = await res.json();
                        alert(`Failed to publish: ${err.error || res.statusText}`);
                      }
                    }}
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-green-700 transition"
                  >
                    🚀 Publish Project
                  </button>
                ) : completionRequested ? (
                  <button disabled className="w-full bg-yellow-100 text-yellow-700 font-bold py-3 rounded-xl cursor-default border border-yellow-200">
                    Waiting for Confirmation...
                  </button>
                ) : (
                  <button
                    onClick={handleRequestCompletion}
                    className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl text-sm hover:bg-slate-900 transition"
                  >
                    Request Completion
                  </button>
                )}
              </div>
            ) : !user ? (
              <button
                onClick={() => alert("Please Login to Apply")}
                className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl opacity-90 transition-opacity hover:opacity-100"
              >
                Login to Apply
              </button>
            ) : hasApplied ? (
              <div className="space-y-3">
                {/* Status Display */}
                {applicationStatus === 'REJECTED' ? (
                  <button disabled className="w-full bg-red-50 text-red-700 border border-red-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-default">
                    <XCircleIcon className="w-5 h-5" /> Rejected
                  </button>
                ) : applicationStatus === 'ACCEPTED' ? (
                  <>
                    <button disabled className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-default">
                      <CheckCircleIcon className="w-5 h-5" /> Accepted Member
                    </button>

                    {/* Member Actions */}
                    {completionRequested && (
                      <button
                        onClick={handleConfirmCompletion}
                        className="w-full bg-[#c5050c] text-white font-bold py-3 rounded-xl hover:bg-red-700 transition animate-pulse"
                      >
                        Confirm Completion
                      </button>
                    )}

                    <a href={`/project/${id}/room`} className="block w-full text-center py-2 border-2 border-slate-200 hover:border-slate-800 rounded-xl font-bold text-slate-700 transition">
                      🔑 Enter Project Room
                    </a>
                  </>
                ) : (
                  <>
                    <button disabled className="w-full bg-slate-100 text-slate-600 border border-slate-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-default">
                      <CheckCircleIcon className="w-5 h-5" /> Pending Application
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="w-full text-red-500 text-sm hover:underline"
                    >
                      Withdraw Application
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
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

          {/* Stats / Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Connections</h3>
            <p className="text-sm text-slate-600">Join <strong>{applicants.length + 1}</strong> members in this project to build your network.</p>
          </div>

          {/* Report Button */}
          <div className="text-center">
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-xs font-bold text-slate-400 hover:text-red-500 transition flex items-center justify-center gap-1 mx-auto"
            >
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center">!</span> Report this Project
            </button>
          </div>

        </div>
      </div>
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        projectId={id as string}
        members={applicants.map(a => a.user)} // Pass applicants. Owner isn't in applicants list usually. Need to add owner? 
      /* Ideally we want to review anyone in the team. */
      />

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-900 border-b pb-3">Report Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Reason</label>
                <select
                  className="w-full p-2 border rounded-lg bg-slate-50"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="SPAM">Spam or Advertising</option>
                  <option value="INAPPROPRIATE">Inappropriate Content</option>
                  <option value="HARASSMENT">Harassment</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg bg-slate-50 h-24"
                  placeholder="Please provide known details..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setReportModalOpen(false)} className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleReportSubmit} className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md">Submit Report</button>
            </div>
          </div>
        </div>
      )}
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onConfirm={handleConfirmApply}
        roles={project?.roles || []}
        projectTitle={project?.title || ""}
        screeningQuestions={project?.screeningQuestions || []} // 🆕
        userProfile={userProfile} // 🆕
      />
    </main>
  );
}

