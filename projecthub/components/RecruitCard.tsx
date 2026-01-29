"use client";
import Link from "next/link";


interface RecruitCardProps {
  id: string;
  title: string;
  description: string;
  ownerName: string;
  roles: string[];
  techStacks: string[]; // Changed from techStack
  isCourseProject?: boolean;
  courseCode?: string;
  semester?: string;
  teamMembers?: string[]; // Optional, might be passed later
  hackathonName?: string;
  hackathonDate?: string;
  status: string; // 'OPEN' | 'CLOSED'
}

export default function RecruitCard({
  id,
  title,
  description,
  ownerName,
  roles = [],
  techStacks = [],
  isCourseProject,
  courseCode,
  semester,
  teamMembers = [],
  hackathonName,
  hackathonDate,
  status
}: RecruitCardProps) {

  // Derive card type visuals
  const isAcademic = isCourseProject;

  return (
    <Link href={`/project/${id}`} className={`group relative block h-full ${status === 'CLOSED' ? 'opacity-60 grayscale' : ''}`}>
      <div className={`h-full flex flex-col justify-between border rounded-xl p-6 bg-white transition-all duration-200 
        ${status === 'CLOSED' ? 'border-slate-100 bg-slate-50' :
          isAcademic ? 'border-red-100 hover:border-red-300 shadow-sm hover:shadow-red-100' : 'border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md'
        }
      `}>
        {status === 'CLOSED' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <span className="bg-slate-800 text-white font-bold text-xl px-4 py-2 rounded-lg shadow-lg -rotate-12 opacity-90 border-2 border-white">CLOSED</span>
          </div>
        )}

        <div>
          {/* Top Badge area */}
          <div className="flex justify-between items-start mb-3">
            {isAcademic ? (
              // Academic Badge: Course Code Emphasis
              <span className="text-xs font-extrabold uppercase tracking-wide text-[#c5050c] bg-red-50 px-3 py-1 rounded-md border border-red-100">
                {courseCode || 'Course Project'}
              </span>
            ) : hackathonName ? (
              // 🏆 Hackathon Badge
              <span className="text-xs font-bold uppercase tracking-wide text-purple-700 bg-purple-50 px-3 py-1 rounded-md border border-purple-100">
                🏆 {hackathonName}
              </span>
            ) : (
              // Personal Badge
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">
                Side Project
              </span>
            )}

            {/* CLOSED Badge (Overlay or separate) - Adding logic here for card visual */}


            {teamMembers.length > 0 && (
              <span className="bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded-full font-semibold">
                {teamMembers.length} joined
              </span>
            )}
          </div>

          {/* Hackathon Date (if applicable) */}
          {!isAcademic && hackathonName && hackathonDate && (
            <div className="mb-2 text-xs text-purple-600 font-bold flex items-center gap-1">
              📅 {new Date(hackathonDate).toLocaleDateString()}
            </div>
          )}

          <h3 className={`text-lg font-bold mb-2 transition-colors line-clamp-1
            ${isAcademic ? 'text-slate-900 group-hover:text-[#c5050c]' : 'text-slate-800 group-hover:text-blue-600'}
          `}>
            {title}
          </h3>

          <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed h-[40px]">{description}</p>

          {/* Tech Stack Area - Emphasize for Personal */}
          <div className="flex flex-wrap gap-2 mb-2">
            {(techStacks || []).slice(0, 3).map((tech, i) => (
              <span key={i} className={`text-xs px-2 py-1 rounded border transition-colors
                ${!isAcademic
                  ? 'bg-blue-50 text-blue-700 border-blue-100 font-medium' // Highlight for Personal
                  : 'bg-slate-50 text-slate-500 border-slate-100'        // Settle for Academic
                }
              `}>
                {tech}
              </span>
            ))}
            {(techStacks?.length || 0) > 3 && (
              <span className="text-xs text-slate-400 self-center">+{techStacks!.length - 3}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-2">
          <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded truncate max-w-[60%]">
            Looking for: {roles.length > 0 ? roles[0] + (roles.length > 1 ? ` +${roles.length - 1}` : "") : "Teammates"}
          </span>
          <span className="text-xs text-slate-400 font-medium truncate ml-2">
            {ownerName}
          </span>
        </div>

      </div>
    </Link>
  );
}