import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">

      {/* Badge / Pill */}
      <div className="mb-6 px-4 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-sm font-medium animate-fade-in-up">
        🚀 The #1 Platform for Side Projects
      </div>

      <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight max-w-4xl leading-tight">
        Build your dream team, <br />
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Launch your idea.
        </span>
      </h1>

      <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed">
        Connect with talented developers, designers, and creators.
        Start a project today or find the perfect team to join.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          href="/post"
          className="bg-blue-600 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-95"
        >
          Start Recruiting
        </Link>

        <Link
          href="/find"
          className="bg-white text-slate-700 border border-slate-200 px-8 py-3.5 rounded-full font-semibold hover:bg-slate-50 transition shadow-sm active:scale-95"
        >
          Find a Team
        </Link>
      </div>

      {/* Social Proof Mockup */}
      <div className="mt-16 text-slate-400 text-sm font-medium">
        TRUSTED BY DEVELOPERS FROM
        <div className="flex justify-center gap-6 mt-4 opacity-50 grayscale">
          {/* Simple text logos for now */}
          <span className="font-bold text-xl">GitHub</span>
          <span className="font-bold text-xl">Vercel</span>
          <span className="font-bold text-xl">Firebase</span>
        </div>
      </div>
    </main>
  );
}
