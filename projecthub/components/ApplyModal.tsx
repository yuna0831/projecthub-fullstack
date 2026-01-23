"use client";

import { useState } from "react";
import { addApplication, uploadResume } from "../lib/firestore";
import { useAuth } from "../context/UserContext";

interface ApplyModalProps {
  projectId: string;
  projectOwnerId: string; // ✨ Required for permissions
  onClose: () => void;
}

export default function ApplyModal({ projectId, projectOwnerId, onClose }: ApplyModalProps) {
  const { user } = useAuth();

  const [name, setName] = useState(user?.displayName || "");
  const [role, setRole] = useState("");
  const [intro, setIntro] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Resume Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.");
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in first!");
    setLoading(true);

    let resumeUrl = "";
    try {
      if (resumeFile) {
        resumeUrl = await uploadResume(resumeFile, user.uid);
      }

      await addApplication(projectId, {
        name,
        role,
        intro,
        resumeUrl,
        userId: user.uid,
        userEmail: user.email,
      });

      alert("✅ Application submitted successfully!");
      onClose();
    } catch (error) {
      console.error("Application failed:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 transform transition-all scale-100">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Apply for this Project</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desired Role</label>
              <input
                type="text"
                placeholder="e.g. Designer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Intro */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Introduction</label>
            <textarea
              placeholder="Briefly introduce yourself and why you'd be a great fit..."
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 h-24 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              required
            />
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Resume / Portfolio (PDF)</label>
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${resumeFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}>
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {resumeFile ? (
                  <>
                    <span className="text-2xl">📄</span>
                    <span className="text-sm font-semibold text-blue-700 truncate max-w-xs">{resumeFile.name}</span>
                    <span className="text-xs text-blue-500">Click to change</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl text-slate-300">📂</span>
                    <span className="text-sm text-slate-600 font-medium">Click to upload your Resume</span>
                    <span className="text-xs text-slate-400">PDF, DOC up to 5MB</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
