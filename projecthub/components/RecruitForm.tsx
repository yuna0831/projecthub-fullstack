"use client";

import { useState } from "react";
import { useAuth } from "../context/UserContext";
import {
  BriefcaseIcon, MapPinIcon, ClockIcon, GlobeAltIcon, LanguageIcon,
  SparklesIcon, XMarkIcon, BuildingOfficeIcon, UsersIcon, PlusIcon, TrashIcon, AcademicCapIcon, BookOpenIcon
} from "@heroicons/react/24/outline";

// Define Role Interface
interface RecruitmentRole {
  name: string;        // e.g. "Frontend Dev"
  count: number;       // e.g. 2
  skills: string[];    // e.g. ["React", "Typescript"]
  skillInput: string;  // Temp input for skills
}

interface RecruitFormProps {
  initialData?: any; // If provided, we are in Edit Mode
}

export default function RecruitForm({ initialData }: RecruitFormProps) {
  const { user } = useAuth();
  const isEditMode = !!initialData;

  // Basic Info -- Initialize with initialData or defaults
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  // Derive category if possible, or default. Backend doesn't store explicit "category" string in the main schema shown? 
  // Wait, schema has no 'category'. It was just frontend UI. 
  // I will leave it as default or try to guess? Or just default.
  // Actually, I can ignore it or just keep "IT/Development".
  const [category, setCategory] = useState("IT/Development");

  // Recruitment Roles (Dynamic Array)
  // Backend roles: { name, count, skills: string[] }
  const [roles, setRoles] = useState<RecruitmentRole[]>(
    initialData?.roles?.map((r: any) => ({
      name: r.name,
      count: r.count,
      skills: r.skills || [],
      skillInput: ""
    })) || [{ name: "", count: 1, skills: [], skillInput: "" }]
  );

  // Project Tech Stack (Global)
  // Backend techStacks: { id, name }[] -> map to string[]
  const [techStack, setTechStack] = useState<string[]>(
    initialData?.techStacks?.map((t: any) => t.name) || []
  );
  const [tagInput, setTagInput] = useState("");
  const [useApply, setUseApply] = useState(true); // Default true for edit?

  // Operation & Schedule
  const [meetingType, setMeetingType] = useState(initialData?.meetingType || "ONLINE");
  const [location, setLocation] = useState(initialData?.location || "");
  const [duration, setDuration] = useState(initialData?.duration || "One Semester");

  // Format Date for Input: YYYY-MM-DD
  const formatDate = (d: string | Date) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toISOString().split('T')[0];
  };
  const [deadline, setDeadline] = useState(initialData?.deadline ? formatDate(initialData.deadline) : "");
  const [contactUrl, setContactUrl] = useState(initialData?.contactUrl || "");

  // 🦡 BadgerMatch Specifics
  const [isCourseProject, setIsCourseProject] = useState(initialData?.isCourseProject || false);
  const [courseSubject, setCourseSubject] = useState(() => {
    if (!initialData?.courseCode) return "";
    const parts = initialData.courseCode.split(" ");

    // Check if known subject
    const knownSubjects = ["COMP SCI", "ECE", "MATH", "STAT", "DS", "IS", "PSYCH", "ECON", "GEN BUS", "LSC", "ART"];
    const potentialSubject = parts.slice(0, -1).join(" ");

    if (knownSubjects.includes(potentialSubject)) return potentialSubject;
    return "OTHER";
  });

  // 🏆 Hackathon Specifics
  const [hackathonName, setHackathonName] = useState(initialData?.hackathonName || "");
  const [hackathonDate, setHackathonDate] = useState(initialData?.hackathonDate ? formatDate(initialData.hackathonDate) : "");

  const [customSubject, setCustomSubject] = useState(() => {
    if (!initialData?.courseCode) return "";
    const parts = initialData.courseCode.split(" ");
    const potentialSubject = parts.slice(0, -1).join(" ");
    const knownSubjects = ["COMP SCI", "ECE", "MATH", "STAT", "DS", "IS", "PSYCH", "ECON", "GEN BUS", "LSC", "ART"];

    if (!knownSubjects.includes(potentialSubject)) return potentialSubject; // e.g. "ANTHRO"
    return "";
  });

  const [courseNumber, setCourseNumber] = useState(() => {
    if (!initialData?.courseCode) return "";
    const parts = initialData.courseCode.split(" ");
    if (parts.length > 1) return parts[parts.length - 1]; // "577"
    return initialData.courseCode; // Fallback
  });

  // 🗓️ Dynamic Semester Logic
  const getSemesterOptions = () => {
    const options = [];
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth(); // 0-11

    // User Rule: 1-5 (0-4) Spring, 6-8 (5-7) Summer, 9-12 (8-11) Fall
    let semIndex = 0; // 0: Spring, 1: Summer, 2: Fall
    if (month <= 4) semIndex = 0;
    else if (month <= 7) semIndex = 1;
    else semIndex = 2;

    const semNames = ["Spring", "Summer", "Fall"];

    for (let i = 0; i < 4; i++) {
      options.push(`${semNames[semIndex]} ${year}`);
      semIndex++;
      if (semIndex > 2) {
        semIndex = 0;
        year++;
      }
    }
    return options;
  };

  const semesters = getSemesterOptions();
  // Ensure default matches current if creating new
  const [semester, setSemester] = useState(initialData?.semester || semesters[0]);

  // Use Effect to set default if not in edit mode? 
  // useState(initial || semesters[0]) covers it.

  const categories = ["IT/Development", "Design/Creative", "Marketing/Business", "Content/Writing", "Sales", "Other"];
  const meetingTypes = [
    { id: "ONLINE", label: "Remote", icon: GlobeAltIcon },
    { id: "OFFLINE", label: "In-Person", icon: BuildingOfficeIcon },
    { id: "HYBRID", label: "Hybrid", icon: SparklesIcon }
  ];
  const durations = ["1 Month", "One Semester", "Two Semesters", "Long-term", "Undefined"];

  // ... (keeping other states)

  // (In the JSX return)
  // ...
  // <label>Target Semester</label> ...
  // <label>Recruitment Deadline</label> ...

  // Global Stack Handlers
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !techStack.includes(newTag)) setTechStack([...techStack, newTag]);
      setTagInput("");
    }
  };
  const removeTag = (tag: string) => setTechStack(techStack.filter((t) => t !== tag));

  // Role Handlers
  const addRole = () => {
    setRoles([...roles, { name: "", count: 1, skills: [], skillInput: "" }]);
  };

  const removeRole = (index: number) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== index));
    }
  };

  const updateRole = (index: number, field: keyof RecruitmentRole, value: any) => {
    const newRoles = [...roles];
    (newRoles[index] as any)[field] = value;
    setRoles(newRoles);
  };

  const addRoleSkill = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const role = roles[index];
      const newSkill = role.skillInput.trim();
      if (newSkill && !role.skills.includes(newSkill)) {
        const newRoles = [...roles];
        newRoles[index].skills.push(newSkill);
        newRoles[index].skillInput = "";
        setRoles(newRoles);
      }
    }
  };

  const removeRoleSkill = (roleIndex: number, skillToRemove: string) => {
    const newRoles = [...roles];
    newRoles[roleIndex].skills = newRoles[roleIndex].skills.filter(s => s !== skillToRemove);
    setRoles(newRoles);
  };

  // Handle Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in.");

    try {
      const token = await user.getIdToken();
      const cleanRoles = roles.map(r => ({
        name: r.name,
        count: r.count,
        skills: r.skills
      })).filter(r => r.name.trim() !== "");

      const payload = {
        title, description,
        category,
        role: cleanRoles,
        techStacks: techStack,
        meetingType, location: meetingType === "ONLINE" ? null : location,
        duration, deadline: deadline || null,
        contactUrl,
        isCourseProject,
        courseCode: isCourseProject
          ? `${courseSubject === "OTHER" ? customSubject : courseSubject} ${courseNumber}`.trim()
          : null,
        semester,
        // 🏆 Hackathon
        hackathonName: !isCourseProject && hackathonName ? hackathonName : null,
        hackathonDate: !isCourseProject && hackathonDate ? hackathonDate : null
      };

      let response;
      if (isEditMode) {
        // UPDATE
        response = await fetch(`http://localhost:3001/api/projects/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        // CREATE
        response = await fetch('http://localhost:3001/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) throw new Error('Failed');

      const resData = await response.json();
      alert(`🎉 Project ${isEditMode ? 'updated' : 'created'} successfully!`);

      // Redirect to Project Detail
      const projectId = isEditMode ? initialData.id : (resData.project?.id || resData.id); // Backend create returns { project: ... }
      // Wait, Check backend createProject response: { message, project: result }
      // Update project response: returns the project object directly (prisma.update returns object).
      // So for update: resData is project. For create: resData.project is project.
      const targetId = isEditMode ? initialData.id : resData.project?.id;

      window.location.href = `/project/${targetId}`;

    } catch (error: any) {
      console.error(error);
      alert("Failed to save project.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 font-sans">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-10">

        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-[#c5050c] tracking-tight">{isEditMode ? 'Edit Project' : 'Create a New Project'}</h1>
          <p className="text-slate-500 text-lg">{isEditMode ? 'Update your recruitment details.' : 'Connect with other Badgers for your next big idea.'}</p>
        </div>

        {/* 1. Project Basics */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-8 transition-shadow hover:shadow-md border-t-4 border-[#c5050c]">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
            <div className="p-2 bg-red-50 rounded-lg">
              <BriefcaseIcon className="w-6 h-6 text-[#c5050c]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Project Overview</h2>
          </div>

          <div className="space-y-6">
            {/* Context: Project Type Selection */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Project Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsCourseProject(true); setHackathonName(""); }}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${isCourseProject && !hackathonName
                      ? "bg-[#c5050c] text-white border-[#c5050c] shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    Academic Course
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsCourseProject(false); setHackathonName("New Hackathon"); }}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${!isCourseProject && hackathonName
                      ? "bg-[#c5050c] text-white border-[#c5050c] shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    Hackathon
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsCourseProject(false); setHackathonName(""); }}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${!isCourseProject && !hackathonName
                      ? "bg-[#c5050c] text-white border-[#c5050c] shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    Personal / Side
                  </button>
                </div>
              </div>

              {/* Course Project Fields */}
              {isCourseProject && (
                <div className="animate-fadeIn p-4 bg-white rounded-lg border border-slate-100 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                      <select
                        value={courseSubject}
                        onChange={(e) => setCourseSubject(e.target.value)}
                        className="block w-full rounded-lg border-slate-300 focus:border-[#c5050c] focus:ring-[#c5050c] sm:text-sm py-2.5 px-3"
                      >
                        <option value="">Select Subject</option>
                        {["COMP SCI", "ECE", "MATH", "STAT", "DS", "IS", "PSYCH", "ECON", "GEN BUS", "LSC", "ART", "OTHER"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Number</label>
                      <input
                        type="text"
                        value={courseNumber}
                        onChange={(e) => setCourseNumber(e.target.value)}
                        placeholder="e.g. 577"
                        className="block w-full rounded-lg border-slate-300 focus:border-[#c5050c] focus:ring-[#c5050c] sm:text-sm py-2.5 px-3"
                      />
                    </div>
                  </div>

                  {courseSubject === "OTHER" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Enter Subject Name</label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="e.g. ANTHRO"
                        className="block w-full rounded-lg border-slate-300 focus:border-[#c5050c] focus:ring-[#c5050c] sm:text-sm py-2.5 px-3"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Hackathon Fields */}
              {!isCourseProject && hackathonName && (
                <div className="animate-fadeIn p-4 bg-white rounded-lg border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hackathon Name</label>
                    <input
                      type="text"
                      value={hackathonName === "New Hackathon" ? "" : hackathonName}
                      onChange={(e) => setHackathonName(e.target.value)}
                      placeholder="e.g. MadHacks 2024"
                      className="block w-full rounded-lg border-slate-300 focus:border-[#c5050c] focus:ring-[#c5050c] sm:text-sm py-2.5 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hackathon Date</label>
                    <input
                      type="date"
                      value={hackathonDate}
                      onChange={(e) => setHackathonDate(e.target.value)}
                      className="block w-full rounded-lg border-slate-300 focus:border-[#c5050c] focus:ring-[#c5050c] sm:text-sm py-2.5 px-3"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${category === cat
                      ? "bg-[#c5050c] text-white border-[#c5050c] shadow-lg scale-105"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Project Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#c5050c] focus:ring-[#c5050c] sm:text-sm py-3 px-4 bg-slate-50/50 focus:bg-white transition-colors" placeholder="e.g. MadHacks 2024 Team" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-[#c5050c] focus:ring-[#c5050c] sm:text-sm py-3 px-4 bg-slate-50/50 focus:bg-white transition-colors resize-none" placeholder="Describe your project..." required />
              </div>

              {/* Global Project Tags */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Keywords & Topics</label>
                <div className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c5050c] transition-all flex flex-wrap gap-2">
                  {techStack.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 rounded bg-slate-200 text-xs font-bold text-slate-700">
                      {tag} <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-slate-400 hover:text-slate-600">×</button>
                    </span>
                  ))}
                  <input type="text" placeholder="e.g. AI, Biology, Finance..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} className="bg-transparent border-0 p-0 text-sm focus:ring-0 placeholder-slate-400 flex-grow min-w-[100px]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Open Positions */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-8 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <UsersIcon className="w-6 h-6 text-pink-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Open Positions</h2>
            </div>
            <button type="button" onClick={addRole} className="text-sm font-bold text-pink-600 hover:bg-pink-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <PlusIcon className="w-4 h-4" /> Add Role
            </button>
          </div>

          <div className="space-y-6">
            {roles.map((role, idx) => (
              <div key={idx} className="p-6 rounded-xl border border-slate-200 bg-slate-50/30 relative hover:border-pink-200 transition-colors">
                {roles.length > 1 && (
                  <button type="button" onClick={() => removeRole(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role Name</label>
                    <input
                      type="text"
                      value={role.name}
                      onChange={(e) => updateRole(idx, 'name', e.target.value)}
                      className="block w-full rounded-lg border-slate-200 focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-2 px-3"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Slots</label>
                    <input
                      type="number" min={1}
                      value={role.count}
                      onChange={(e) => updateRole(idx, 'count', Number(e.target.value))}
                      className="block w-full rounded-lg border-slate-200 focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-2 px-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Skills</label>
                  <div className="bg-white border border-slate-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-pink-500 transition-all flex flex-wrap gap-2">
                    {role.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center px-2 py-1 rounded bg-pink-50 text-pink-700 text-xs font-bold border border-pink-100">
                        {skill} <button type="button" onClick={() => removeRoleSkill(idx, skill)} className="ml-1 hover:text-pink-900">×</button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Type & enter..."
                      value={role.skillInput}
                      onChange={(e) => updateRole(idx, 'skillInput', e.target.value)}
                      onKeyDown={(e) => addRoleSkill(idx, e)}
                      className="bg-transparent border-0 p-0 text-sm focus:ring-0 placeholder-slate-400 flex-grow min-w-[120px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Logistics & Semester */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logistics */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ClockIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Logistics</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Meeting Type</label>
                <div className="flex gap-2">
                  {meetingTypes.map((type) => (
                    <button
                      type="button" key={type.id} onClick={() => setMeetingType(type.id)}
                      className={`flex-1 flex flex-col items-center py-2 rounded-lg border text-xs font-bold transition-all ${meetingType === type.id ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-slate-100 hover:bg-slate-50"
                        }`}
                    >
                      <type.icon className="w-5 h-5 mb-1" /> {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {meetingType !== "ONLINE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-emerald-500 outline-none" placeholder="e.g. College Library" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:ring-emerald-500 outline-none">
                  {durations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Semester & Contact */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Semester & Contact</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Semester</label>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:ring-blue-500 outline-none">
                  {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recruitment Deadline</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Link</label>
                <input type="text" value={contactUrl} onChange={(e) => setContactUrl(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-blue-500 outline-none" placeholder="e.g. Discord, Email, OpenChat" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 sm:px-8 z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="hidden sm:flex items-center gap-2">
            <input type="checkbox" id="useApply" checked={useApply} onChange={(e) => setUseApply(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#c5050c] focus:ring-[#c5050c]" />
            <label htmlFor="useApply" className="text-sm font-medium text-slate-700 cursor-pointer">Accept Applications via MadCollab</label>
          </div>

          <div className="w-full sm:w-auto flex gap-4">
            <button type="button" className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-white bg-[#c5050c] shadow-lg shadow-red-900/20 hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              {isEditMode ? 'Update Project 💾' : 'Launch Project 🚀'}
            </button>
          </div>
        </div>
        <div className="h-20" />
      </form>
    </div>
  );
}
