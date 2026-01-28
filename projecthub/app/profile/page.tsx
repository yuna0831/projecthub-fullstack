/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useAuth } from "../../context/UserContext";
import { useEffect, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  PlusIcon,
  CameraIcon,

  CheckIcon
} from "@heroicons/react/24/outline";

import { storage } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Advanced Sections State
  const [educations, setEducations] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);

  // Add Item Modal State
  const [addItemType, setAddItemType] = useState<'edu' | 'exp' | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "", major: "", year: "", bio: "",
    githubUrl: "", linkedinUrl: "", portfolioUrl: "",
    techStacks: "", profileImage: "", coverImage: "",
    workStyles: [] as string[], futureRole: ""
  });

  const [newItem, setNewItem] = useState<any>({});
  const [badges, setBadges] = useState<any>({});

  useEffect(() => {
    if (user) {
      fetchProfile();

    }
  }, [user]);



  async function fetchProfile() {
    try {
      const token = await user?.getIdToken();
      const res = await fetch('http://localhost:3001/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: user?.uid,
          email: user?.email,
          name: user?.displayName,
          picture: user?.photoURL
        })
      });

      const data = await res.json();
      const userData = data.user;
      setProfile(userData);
      setEducations(userData.educations || []);
      setExperiences(userData.experiences || []);

      // Fetch Badges
      if (userData.id) {
        fetch(`http://localhost:3001/api/reviews/user/${userData.id}/badges`)
          .then(r => r.json())
          .then(data => setBadges(data))
          .catch(e => console.error("Badge fetch error", e));
      }

      setFormData({
        name: userData.name || "",
        major: userData.major || "",
        year: userData.year || "",
        bio: userData.bio || "",
        githubUrl: userData.githubUrl || "",
        linkedinUrl: userData.linkedinUrl || "",
        portfolioUrl: userData.portfolioUrl || "",
        techStacks: userData.techStacks ? userData.techStacks.join(", ") : "",
        profileImage: userData.profileImage || "",
        coverImage: userData.coverImage || "",
        workStyles: userData.workStyles || [],
        futureRole: userData.futureRole || ""
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImage' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const fileRef = ref(storage, `users/${user.uid}/${field}_${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = await user?.getIdToken();
      const cleanTechStacks = formData.techStacks.split(',').map(s => s.trim()).filter(Boolean);

      const res = await fetch('http://localhost:3001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          techStacks: cleanTechStacks
        })
      });

      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setProfile(updated.user);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!addItemType) return;
    try {
      const token = await user?.getIdToken();
      const endpoint = addItemType === 'edu' ? 'education' : 'experience';

      const res = await fetch(`http://localhost:3001/api/users/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newItem)
      });

      if (!res.ok) throw new Error("Failed to add item");

      const added = await res.json();
      if (addItemType === 'edu') setEducations([...educations, added]);
      else setExperiences([...experiences, added]);

      setAddItemType(null);
      setNewItem({});
    } catch (e) {
      console.error(e);
      alert("Failed to add item.");
    }
  };

  const handleDeleteItem = async (type: 'edu' | 'exp', id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`http://localhost:3001/api/users/profile-item/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");

      if (type === 'edu') setEducations(educations.filter(e => e.id !== id));
      else setExperiences(experiences.filter(e => e.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Please log in</div>;



  return (
    <main className="min-h-screen bg-[#F3F2EF] py-8 px-4 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. Header Section (LinkedIn Style) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
          {/* Cover Image */}
          <div className="h-52 relative bg-[#1D2226]">
            {formData.coverImage ? (
              <Image src={formData.coverImage} alt="Cover" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#c5050c] to-[#9b0000]"></div>
            )}
            {isEditing && (
              <label className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg text-[#c5050c] hover:bg-white transition cursor-pointer z-20">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                <CameraIcon className="w-5 h-5" />
              </label>
            )}
          </div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start justify-between">

              {/* Profile Info */}
              <div className="flex flex-col md:flex-row gap-6 -mt-20 relative z-10">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-xl bg-white overflow-hidden relative">
                    {formData.profileImage || user?.photoURL ? (
                      <Image src={(formData.profileImage || user?.photoURL) as string} alt="User" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-6xl">🦡</div>
                    )}
                    {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">Uploading...</div>}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md text-[#c5050c] hover:bg-slate-50 border border-slate-200 cursor-pointer z-20">
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profileImage')} />
                      <CameraIcon className="w-5 h-5" />
                    </label>
                  )}
                </div>

                {/* Text Info */}
                <div className="mt-20 md:mt-24 space-y-2">
                  {isEditing ? (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <input className="text-2xl font-bold p-1 w-full border rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Name" />
                      <input className="text-sm font-medium text-[#c5050c] p-1 w-full border rounded" value={formData.futureRole} onChange={e => setFormData({ ...formData, futureRole: e.target.value })} placeholder="Future Role (e.g. Fullstack Dev)" />
                      <div className="flex gap-2">
                        <input className="text-sm p-1 border rounded w-1/2" value={formData.major} onChange={e => setFormData({ ...formData, major: e.target.value })} placeholder="Major" />
                        <input className="text-sm p-1 border rounded w-1/2" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} placeholder="Year" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-3xl font-bold flex items-center gap-3">
                        {profile?.name}
                        {profile?.futureRole && (
                          <span className="px-3 py-1 bg-red-50 text-[#c5050c] text-xs font-bold uppercase tracking-wide rounded-full border border-red-100 shadow-sm">
                            {profile.futureRole}
                          </span>
                        )}
                      </h1>
                      <div className="text-slate-600 flex items-center gap-4 mt-1 text-sm font-medium">
                        <span className="flex items-center gap-1.5"><AcademicCapIcon className="w-5 h-5 text-slate-400" /> {profile?.major || "Undecided"} • {profile?.year || "Freshman"}</span>
                        <span className="flex items-center gap-1.5"><MapPinIcon className="w-5 h-5 text-slate-400" /> Madison, WI</span>
                      </div>

                      {/* Work Style Chips */}
                      {profile?.workStyles?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {profile.workStyles.map((ws: string) => (
                            <span key={ws} className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm border border-slate-700">
                              {ws}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 md:mt-6 flex flex-col items-end gap-3">
                <div className="flex gap-3">
                  {!isEditing && (
                    <>
                      {profile?.githubUrl && (
                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#c5050c] hover:border-[#c5050c] rounded-full transition shadow-sm group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://simpleicons.org/icons/github.svg" width={20} height={20} alt="GitHub" className="opacity-70 group-hover:opacity-100" />
                        </a>
                      )}
                      {profile?.linkedinUrl && (
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0077b5] hover:border-[#0077b5] rounded-full transition shadow-sm group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://simpleicons.org/icons/linkedin.svg" width={20} height={20} alt="LinkedIn" className="opacity-70 group-hover:opacity-100" />
                        </a>
                      )}
                      {profile?.portfolioUrl && (
                        <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-900 rounded-full transition shadow-sm group">
                          <BriefcaseIcon className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                        </a>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    className={`px-6 py-2 rounded-full font-bold shadow-md transition flex items-center gap-2 ${isEditing ? 'bg-[#c5050c] text-white hover:bg-red-700' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                  >
                    {isEditing ? <><CheckIcon className="w-5 h-5" /> Save Profile</> : <><PencilIcon className="w-4 h-4" /> Edit Profile</>}
                  </button>
                  {isEditing && <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-full">Cancel</button>}
                </div>
              </div>
            </div>

            {/* Editing: Work Styles & Links */}
            {isEditing && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Work Styles (Max 3)</label>
                  <div className="flex flex-wrap gap-2">
                    {["#NightOwl", "#EarlyBird", "#Remote", "#InPerson", "#Leader", "#Follower", "#Planner", "#Improviser", "#Creative", "#Logical"].map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const styles = formData.workStyles.includes(tag)
                            ? formData.workStyles.filter(t => t !== tag)
                            : formData.workStyles.length < 3 ? [...formData.workStyles, tag] : formData.workStyles;
                          setFormData({ ...formData, workStyles: styles });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${formData.workStyles.includes(tag) ? "bg-[#c5050c] text-white border-[#c5050c]" : "bg-white text-slate-500 hover:border-slate-400"}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Social Links</label>
                  <input className="w-full text-sm p-2 border rounded" placeholder="GitHub URL" value={formData.githubUrl} onChange={e => setFormData({ ...formData, githubUrl: e.target.value })} />
                  <input className="w-full text-sm p-2 border rounded" placeholder="LinkedIn URL" value={formData.linkedinUrl} onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })} />
                  <input className="w-full text-sm p-2 border rounded" placeholder="Portfolio URL" value={formData.portfolioUrl} onChange={e => setFormData({ ...formData, portfolioUrl: e.target.value })} />
                </div>
              </div>
            )}

            {/* About (Summary) */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-2">About Me</h3>
              {isEditing ? (
                <textarea className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#c5050c] outline-none" rows={4} value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
              ) : (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line max-w-4xl">{profile?.bio || "No description provided."}</p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column (Stats, Badges, Skills) */}
          <div className="space-y-6">



            {/* 🏆 Badges */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🏆</div>
              <h3 className="text-lg font-bold mb-4 relative z-10">Reputation & Badges</h3>

              {Object.keys(badges).length === 0 ? (
                <div className="text-slate-400 text-sm italic relative z-10">
                  No badges yet. Join projects to earn them!
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 relative z-10">
                  {/* Badge Rendering */}
                  {['CODE_WIZARD', 'DEADLINE_FAIRY', 'COMMUNICATION_KING'].map(type => badges[type] && (
                    <div key={type} className="bg-white/10 p-2 rounded-lg text-center backdrop-blur-sm border border-white/10 hover:bg-white/20 transition cursor-help" title={type}>
                      <div className="text-2xl mb-1">{type === 'CODE_WIZARD' ? '💻' : type === 'DEADLINE_FAIRY' ? '🧚' : '🗣️'}</div>
                      <div className="text-xs font-bold opacity-80">{badges[type]}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🛠 Skills */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Top Skills</h3>
              {isEditing ? (
                <input className="w-full p-2 border rounded" value={formData.techStacks} onChange={e => setFormData({ ...formData, techStacks: e.target.value })} placeholder="React, Node, etc..." />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {profile?.techStacks?.map((tech: string) => (
                    <div key={tech} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 hover:shadow-md hover:border-[#c5050c]/30 transition group">
                      {/* Placeholder Icon */}
                      <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm group-hover:text-[#c5050c]">{tech.substring(0, 2).toUpperCase()}</div>
                      <span className="text-sm font-semibold text-slate-700">{tech}</span>
                    </div>
                  ))}
                  {(!profile?.techStacks || profile.techStacks.length === 0) && <p className="text-slate-400 text-sm">No skills added.</p>}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (Timeline: Exp & Edu) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Experience Timeline */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <BriefcaseIcon className="w-6 h-6 text-[#c5050c]" /> Professional Experience
                </h2>
                {isEditing && <button onClick={() => setAddItemType('exp')}><PlusIcon className="w-6 h-6 text-slate-400 hover:text-[#c5050c]" /></button>}
              </div>

              <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
                {experiences.map((exp: any) => (
                  <div key={exp.id} className="relative pl-10 group">
                    {/* Dot */}
                    <div className="absolute left-[13px] top-1.5 w-3.5 h-3.5 bg-white border-[3px] border-[#c5050c] rounded-full group-hover:scale-125 transition-transform z-10" />

                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{exp.title}</h3>
                        <div className="text-slate-600 font-medium">{exp.company}</div>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide font-bold">{exp.startDate} — {exp.endDate || "Present"}</p>
                        {exp.description && <p className="mt-3 text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{exp.description}</p>}
                      </div>
                      {isEditing && <button onClick={() => handleDeleteItem('exp', exp.id)} className="text-slate-300 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>}
                    </div>
                  </div>
                ))}
                {experiences.length === 0 && <p className="pl-10 text-slate-400 italic">No experience entries.</p>}
              </div>
            </div>

            {/* Education Timeline */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <AcademicCapIcon className="w-6 h-6 text-[#c5050c]" /> Education History
                </h2>
                {isEditing && <button onClick={() => setAddItemType('edu')}><PlusIcon className="w-6 h-6 text-slate-400 hover:text-[#c5050c]" /></button>}
              </div>

              <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
                {educations.map((edu: any) => (
                  <div key={edu.id} className="relative pl-10 group">
                    <div className="absolute left-[13px] top-1.5 w-3.5 h-3.5 bg-white border-[3px] border-slate-400 group-hover:border-[#c5050c] rounded-full transition-colors z-10" />

                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{edu.school}</h3>
                        <div className="text-slate-600">{edu.degree ? `${edu.degree} in ` : ''}{edu.major}</div>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide font-bold">Class of {edu.graduationYear}</p>
                      </div>
                      {isEditing && <button onClick={() => handleDeleteItem('edu', edu.id)} className="text-slate-300 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>}
                    </div>
                  </div>
                ))}
                {educations.length === 0 && <p className="pl-10 text-slate-400 italic">No education entries.</p>}
              </div>
            </div>

          </div>
        </div>

        {/* Modal for Adding Items (Reused) */}
        {addItemType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-slate-900 border-b pb-3">
                New {addItemType === 'edu' ? 'Education' : 'Experience'}
              </h3>
              {/* Form Fields (Simplified re-use of previous logic) */}
              <div className="space-y-4">
                {addItemType === 'edu' ? (
                  <>
                    <input className="w-full bg-slate-50 border p-2 rounded" placeholder="School" onChange={e => setNewItem({ ...newItem, school: e.target.value })} />
                    <input className="w-full bg-slate-50 border p-2 rounded" placeholder="Degree" onChange={e => setNewItem({ ...newItem, degree: e.target.value })} />
                    <input className="w-full bg-slate-50 border p-2 rounded" placeholder="Major" onChange={e => setNewItem({ ...newItem, major: e.target.value })} />
                    <input className="w-full bg-slate-50 border p-2 rounded" placeholder="Grad Year" onChange={e => setNewItem({ ...newItem, graduationYear: e.target.value })} />
                  </>
                ) : (
                  <>
                    <input className="w-full bg-slate-50 border p-2 rounded" placeholder="Company" onChange={e => setNewItem({ ...newItem, company: e.target.value })} />
                    <input className="w-full bg-slate-50 border p-2 rounded" placeholder="Role" onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                    <div className="flex gap-2">
                      <input className="w-full bg-slate-50 border p-2 rounded" placeholder="Start Date" onChange={e => setNewItem({ ...newItem, startDate: e.target.value })} />
                      <input className="w-full bg-slate-50 border p-2 rounded" placeholder="End Date" onChange={e => setNewItem({ ...newItem, endDate: e.target.value })} />
                    </div>
                    <textarea className="w-full bg-slate-50 border p-2 rounded" placeholder="Description" rows={3} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                  </>
                )}
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button onClick={() => setAddItemType(null)} className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                <button onClick={handleAddItem} className="px-5 py-2 bg-[#c5050c] text-white font-bold rounded-lg hover:bg-red-700 shadow-md">Add</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
