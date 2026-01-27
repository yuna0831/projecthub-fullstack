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
  LinkIcon,
  XMarkIcon,
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
    techStacks: "", profileImage: "", coverImage: ""
  });

  const [newItem, setNewItem] = useState<any>({});

  useEffect(() => {
    if (user) fetchProfile();
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
        coverImage: userData.coverImage || ""
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
    <main className="min-h-screen bg-[#F3F2EF] py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Main Profile Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 relative">

          {/* Cover Photo */}
          <div className={`h-48 relative bg-[#1D2226]`}>
            {formData.coverImage ? (
              <Image src={formData.coverImage} alt="Cover" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-slate-700 to-slate-900"></div>
            )}

            {isEditing && (
              <label className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md text-[#c5050c] hover:bg-slate-50 transition cursor-pointer">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                <CameraIcon className="w-5 h-5" />
              </label>
            )}
          </div>

          <div className="px-8 pb-8 relative">

            {/* Avatar & Edit Button Row */}
            <div className="flex justify-between items-end -mt-16 mb-4">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-lg bg-white overflow-hidden relative z-10">
                  {formData.profileImage || user.photoURL ? (
                    <Image src={(formData.profileImage || user.photoURL) as string} alt="User" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl">👤</div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">Uploading...</div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-2 right-2 z-20 bg-white p-2 rounded-full shadow-md text-[#c5050c] hover:bg-slate-50 border border-slate-200 cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profileImage')} />
                    <CameraIcon className="w-5 h-5" />
                  </label>
                )}
              </div>

              {/* Header Action Button */}
              <div className="mb-2">
                {isEditing ? (
                  // Save/Cancel handled at bottom of form, but nice to have consistent header
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Editing Mode</span>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-600">
                    <PencilIcon className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="mb-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Full Name</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#c5050c] focus:border-transparent outline-none transition" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Header Headline</label>
                      {/* Can add a headline field later, using Major for now */}
                      <input type="text" placeholder="Headline (e.g. CS Student @ UW-Madison)" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#c5050c] focus:border-transparent outline-none transition" disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Major</label>
                      <input type="text" value={formData.major} onChange={e => setFormData({ ...formData, major: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#c5050c] focus:border-transparent outline-none transition" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Year</label>
                      <input type="text" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#c5050c] focus:border-transparent outline-none transition" />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">{profile.name}</h1>
                  <p className="text-lg text-slate-600 mb-3">{profile.major || "No Major"} Student</p>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <span className="flex items-center gap-1"><AcademicCapIcon className="w-4 h-4" /> {profile.year || "Year N/A"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> Madison, WI</span>
                  </p>
                </div>
              )}
            </div>

            {/* Social Buttons (Moved to top) */}
            {!isEditing && (
              <div className="flex gap-3 mb-6">
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" className="px-4 py-1.5 border border-[#c5050c] text-[#c5050c] font-bold text-sm rounded-full hover:bg-red-50 transition">
                    GitHub
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" className="px-4 py-1.5 border border-[#0077b5] text-[#0077b5] font-bold text-sm rounded-full hover:bg-blue-50 transition">
                    LinkedIn
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" className="px-4 py-1.5 border border-slate-600 text-slate-600 font-bold text-sm rounded-full hover:bg-slate-50 transition">
                    Portfolio
                  </a>
                )}
              </div>
            )}

            {/* Social Inputs (Editing) */}
            {isEditing && (
              <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Social Links</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-xs font-bold text-slate-500">GitHub</span>
                    <input type="text" value={formData.githubUrl} onChange={e => setFormData({ ...formData, githubUrl: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#c5050c] outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-xs font-bold text-slate-500">LinkedIn</span>
                    <input type="text" value={formData.linkedinUrl} onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#c5050c] outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-xs font-bold text-slate-500">Portfolio</span>
                    <input type="text" value={formData.portfolioUrl} onChange={e => setFormData({ ...formData, portfolioUrl: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#c5050c] outline-none" />
                  </div>
                </div>
              </div>
            )}


            {/* About Section */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">About</h2>
              {isEditing ? (
                <textarea rows={5} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#c5050c] outline-none leading-relaxed" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {profile.bio || "Write a summary to highlight your personality or work experience."}
                </p>
              )}
            </div>

            {/* Skills */}
            <div className="mb-2">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Skills</h2>
              {isEditing ? (
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" placeholder="React, Python, Design..." value={formData.techStacks} onChange={e => setFormData({ ...formData, techStacks: e.target.value })} />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.techStacks?.map((t: string) => (
                    <span key={t} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition cursor-default">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Experience Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Experience</h2>
            {isEditing && (
              <button onClick={() => setAddItemType('exp')} className="hover:bg-slate-100 p-2 rounded-full transition">
                <PlusIcon className="w-6 h-6 text-slate-600" />
              </button>
            )}
          </div>

          <div className="space-y-6">
            {experiences.length === 0 && <p className="text-slate-500 italic text-sm">No experience added.</p>}
            {experiences.map((exp: any, idx: number) => (
              <div key={exp.id} className={`flex gap-4 ${idx !== experiences.length - 1 ? 'border-b border-slate-100 pb-6' : ''}`}>
                <div className="mt-1">
                  <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                    <BriefcaseIcon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{exp.title}</h3>
                      <p className="text-sm text-slate-700">{exp.company}</p>
                      <p className="text-xs text-slate-500 mt-1">{exp.startDate} - {exp.endDate || "Present"}</p>
                    </div>
                    {isEditing && (
                      <button onClick={() => handleDeleteItem('exp', exp.id)} className="text-slate-400 hover:text-red-500 transition">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {exp.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{exp.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Education</h2>
            {isEditing && (
              <button onClick={() => setAddItemType('edu')} className="hover:bg-slate-100 p-2 rounded-full transition">
                <PlusIcon className="w-6 h-6 text-slate-600" />
              </button>
            )}
          </div>

          <div className="space-y-6">
            {educations.length === 0 && <p className="text-slate-500 italic text-sm">No education listed.</p>}
            {educations.map((edu: any, idx: number) => (
              <div key={edu.id} className={`flex gap-4 ${idx !== educations.length - 1 ? 'border-b border-slate-100 pb-6' : ''}`}>
                <div className="mt-1">
                  <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                    <AcademicCapIcon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{edu.school}</h3>
                      <p className="text-sm text-slate-700">{edu.degree ? `${edu.degree}, ` : ''}{edu.major}</p>
                      <p className="text-xs text-slate-500 mt-1">Class of {edu.graduationYear}</p>
                    </div>
                    {isEditing && (
                      <button onClick={() => handleDeleteItem('edu', edu.id)} className="text-slate-400 hover:text-red-500 transition">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Action Bar (Sticky Bottom) */}
        {isEditing && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-xl z-50 animate-slideUp">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <p className="text-sm font-bold text-slate-500">You are in Edit Configuration Mode</p>
              <div className="flex gap-4">
                <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition">
                  Cancel
                </button>
                <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2.5 rounded-full font-bold text-white bg-[#c5050c] hover:bg-red-700 transition shadow-lg flex items-center gap-2">
                  {saving ? "Saving..." : <><CheckIcon className="w-5 h-5" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Add Item Modal */}
      {addItemType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-900 border-b pb-3">New {addItemType === 'edu' ? 'Education' : 'Experience'}</h3>

            <div className="space-y-4">
              {addItemType === 'edu' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">School</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" placeholder="e.g. UW-Madison" onChange={e => setNewItem({ ...newItem, school: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Degree</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" placeholder="e.g. Bachelor of Science" onChange={e => setNewItem({ ...newItem, degree: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Major</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" placeholder="e.g. Computer Science" onChange={e => setNewItem({ ...newItem, major: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Graduation Year</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" placeholder="e.g. 2025" onChange={e => setNewItem({ ...newItem, graduationYear: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Company / Organization</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" placeholder="e.g. Google" onChange={e => setNewItem({ ...newItem, company: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Role / Title</label>
                    <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" placeholder="e.g. Software Engineer Intern" onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Start Date</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" placeholder="YYYY-MM" onChange={e => setNewItem({ ...newItem, startDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">End Date</label>
                      <input className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" placeholder="YYYY-MM (or empty)" onChange={e => setNewItem({ ...newItem, endDate: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded focus:ring-2 focus:ring-[#c5050c] outline-none" rows={3} placeholder="What did you achieve?" onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setAddItemType(null)} className="px-5 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-bold transition">Cancel</button>
              <button onClick={handleAddItem} className="px-5 py-2 bg-[#c5050c] text-white rounded-lg font-bold hover:bg-red-700 shadow-md transition">Add</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
