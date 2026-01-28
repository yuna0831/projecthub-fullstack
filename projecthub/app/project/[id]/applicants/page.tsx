/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import {
  getApplications,
  approveApplication,
  rejectApplication,
} from "../../../../lib/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Applicant {
  id: string;
  name: string;
  role: string;
  intro: string;
  resumeUrl?: string;
  userId: string;
  userEmail: string;
  status?: string;
}

export default function ApplicantsPage() {
  const { id: projectId } = useParams();
  const [apps, setApps] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const data = await getApplications(projectId as string);
      setApps(data);
      setLoading(false);
    }
    fetch();
  }, [projectId]);

  const handleApprove = async (appId: string, userId: string) => {
    if (!confirm("Approve this applicant? They will be added to the team.")) return;
    setProcessingId(appId);
    try {
      await approveApplication(projectId as string, appId, userId);
      alert("🎉 Applicant approved successfully!");
      // Optimistic update
      setApps(apps.map(a => a.id === appId ? { ...a, status: "approved" } : a));
    } catch (error) {
      console.error(error);
      alert("Error approving applicant");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (appId: string) => {
    if (!confirm("Reject this applicant? This cannot be undone.")) return;
    setProcessingId(appId);
    try {
      await rejectApplication(projectId as string, appId);
      alert("Applicant has been rejected.");
      // Optimistic remove
      setApps(apps.filter(a => a.id !== appId));
    } catch (error) {
      console.error(error);
      alert("Error rejecting applicant");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Applicants</h1>
            <p className="text-slate-500">Manage your team requests efficiently.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide mr-2">Total</span>
            <span className="text-2xl font-extrabold text-blue-600">{apps.length}</span>
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400 text-lg">No applicants yet.</p>
            <p className="text-slate-400 text-sm mt-1">Share your project to get more attention!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apps.map((a) => (
              <div
                key={a.id}
                className={`relative bg-white rounded-xl p-6 border transition-all duration-200 ${a.status === 'approved'
                  ? "border-green-200 shadow-sm bg-green-50/30"
                  : "border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300"
                  }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                      {a.name}
                      {a.status === 'approved' && (
                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">Approved</span>
                      )}
                    </h3>
                    <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">
                      {a.role}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-mono">{a.userEmail}</p>
                  </div>
                </div>

                {/* Intro */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line line-clamp-4 italic">
                    "{a.intro}"
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  {a.resumeUrl ? (
                    <a
                      href={a.resumeUrl}
                      target="_blank"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      📄 View Resume / Portfolio
                    </a>
                  ) : (
                    <div className="w-full py-2 bg-slate-50 border border-slate-100 text-slate-400 rounded-lg text-sm font-semibold text-center italic cursor-not-allowed">
                      No Resume Uploaded
                    </div>
                  )}

                  {a.status !== 'approved' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleReject(a.id)}
                        disabled={processingId === a.id}
                        className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(a.id, a.userId)}
                        disabled={processingId === a.id}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                        {processingId === a.id ? (
                          <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                        ) : "Approve"}
                      </button>
                    </div>
                  )}

                  {a.status === 'approved' && (
                    <div className="mt-2 py-2 text-center text-sm font-medium text-green-600 bg-green-50 rounded-lg border border-green-100">
                      ✅ Already Approved
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
