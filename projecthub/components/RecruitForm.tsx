"use client";

import { useState } from "react";
import { addProject } from "../lib/firestore";
import { useAuth } from "../context/UserContext";

export default function RecruitForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("IT/Development"); // Default category
  const [useApply, setUseApply] = useState(false);

  // Categories list
  const categories = ["IT/Development", "Design/Creative", "Business/Startup", "Marketing", "Data/Research", "Other"];

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !techStack.includes(newTag)) {
        setTechStack([...techStack, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTechStack(techStack.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("You need to sign in first!");

    await addProject({
      title,
      description,
      role,
      techStack,
      category, // ✨ Add category
      createdBy: user.displayName,
      createdByEmail: user.email,
      userId: user.uid,
      useApply,
    });

    alert("Recruitment post created successfully!");
    setTitle("");
    setDescription("");
    setRole("");
    setTechStack([]);
    setCategory("IT/Development");
    setUseApply(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100"
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Create a New Project</h2>
        <p className="text-slate-500 text-sm">Find the perfect team members for your vision.</p>
      </div>

      <div className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${category === cat
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Project Name */}
        <div>
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Project Name
          </label>
          <input
            type="text"
            placeholder="e.g. Eco-friendly Cafe Brand, AI Travel Planner"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all outline-none text-slate-800 placeholder-slate-400"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Describe your project, goals, and who you are looking for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all outline-none text-slate-800 placeholder-slate-400 resize-none"
            required
          />
        </div>

        {/* Role Needed */}
        <div>
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Role Needed
          </label>
          <input
            type="text"
            placeholder="e.g. UX Designer, Marketing Lead, Frontend Dev"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all outline-none text-slate-800 placeholder-slate-400"
            required
          />
        </div>

        {/* Skills & Tools Input */}
        <div>
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
            Required Skills & Tools (Tags)
          </label>
          <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
            {techStack.map((tag) => (
              <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm font-semibold flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">×</button>
              </span>
            ))}
            <input
              type="text"
              placeholder={techStack.length === 0 ? "Type e.g. Figma, Python + Enter" : ""}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="bg-transparent outline-none flex-grow min-w-[120px] text-slate-800 placeholder-slate-400 py-1 px-1"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Press Enter or comma to add tags.</p>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <input
            type="checkbox"
            id="useApply"
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            checked={useApply}
            onChange={(e) => setUseApply(e.target.checked)}
          />
          <label htmlFor="useApply" className="text-slate-700 text-sm font-medium cursor-pointer select-none">
            Enable <b>Apply Button</b> (Allow users to submit applications)
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200"
        >
          🚀 Publish Project
        </button>
      </div>
    </form>
  );
}
