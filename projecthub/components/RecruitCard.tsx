"use client";
import Link from "next/link";


interface RecruitCardProps {
  id: string;
  title: string;
  description: string;
  role: string;
  createdBy: string;
  teamMembers?: string[];
  techStack?: string[];
  category?: string; // ✨ Category
}

export default function RecruitCard({
  id,
  title,
  description,
  role,
  createdBy,
  teamMembers = [],
  techStack = [],
  category = "Project", // Default
}: RecruitCardProps) {
  return (
    <Link href={`/project/${id}`} className="group">
      <div className="h-full flex flex-col justify-between border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200">

        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded mb-1 inline-block border border-slate-100">
              {category}
            </span>
            {teamMembers.length > 0 && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {teamMembers.length} joined
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">{title}</h3>

          <p className="text-slate-500 text-sm mb-3 line-clamp-2 leading-relaxed">{description}</p>

          {/* Tech Stack Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(techStack || []).slice(0, 3).map((tech, i) => (
              <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded border border-slate-200">
                {tech}
              </span>
            ))}
            {(techStack?.length || 0) > 3 && (
              <span className="text-xs text-slate-400 self-center">+{techStack!.length - 3}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
            Looking for: {role}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            by {createdBy}
          </span>
        </div>

      </div>
    </Link>
  );
}