/* eslint-disable */
import Link from "next/link";
import {
  RocketLaunchIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  LightBulbIcon,
  XMarkIcon,
  CheckIcon,
  ChatBubbleBottomCenterTextIcon
} from "@heroicons/react/24/outline";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans selection:bg-[#c5050c] selection:text-white pb-0">

      {/* 1. Hero Section: Clean, Honest, Inspiring */}
      <section className="relative pt-32 pb-40 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">

          <div className="inline-flex items-center gap-2 bg-red-50 text-[#c5050c] px-4 py-1.5 rounded-full text-sm font-bold mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c5050c]"></span>
            </span>
            Now Live for UW-Madison
          </div>

          <div className="mb-2">
            <span className="text-xl md:text-2xl font-bold text-slate-400 uppercase tracking-[0.2em]">Welcome to</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
            <span className="text-[#c5050c]">Mad</span>Collab
          </h1>

          <p className="text-2xl md:text-4xl font-bold text-slate-400 mb-10 leading-tight">
            Turn Your <span className="text-slate-900">Ideas</span> Into <span className="text-slate-900">Reality</span>
          </p>

          <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            The dedicated platform for Badgers to build startups, ace capstone projects,
            and find the perfect teammates. No noise, just collaboration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/find"
              className="w-full sm:w-auto px-8 py-4 bg-[#c5050c] text-white rounded-xl font-bold text-lg hover:bg-[#a0040a] transition-all shadow-xl shadow-red-900/20 hover:scale-105 flex items-center justify-center gap-2"
            >
              <MagnifyingGlassIcon className="w-6 h-6" /> Find a Team
            </Link>
            <Link
              href="/post"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 border-2 border-slate-200 rounded-xl font-bold text-lg hover:border-[#c5050c] hover:text-[#c5050c] transition-all flex items-center justify-center gap-2"
            >
              Start a Project
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Value Proposition */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <RocketLaunchIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Beyond the Classroom</h3>
              <p className="text-slate-600 leading-relaxed">
                From tech startups and indie apps to creative art collabs. If you have a vision, find the crew to make it a reality. We're building more than just grades here.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-red-50 text-[#c5050c] rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <ShieldCheckIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Strictly Badgers</h3>
              <p className="text-slate-600 leading-relaxed">
                No bots, no randoms. Your community is protected by <span className="font-semibold">@wisc.edu</span> authentication. Collaborate with real students you can grab a coffee with at Memorial Union.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Build Your Reputation</h3>
              <p className="text-slate-600 leading-relaxed">
                Every project you finish adds to your legacy. Earn 'Completed' badges and show the world what you're capable of. Be the OG of MadCollab.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Why MadCollab? (Cards) */}
      <section className="py-24 px-6 md:px-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Why MadCollab?</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Build with confidence, not guesswork.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Verified */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-red-100 transition-colors">
              <div className="w-12 h-12 bg-[#c5050c]/10 text-[#c5050c] rounded-xl flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified & Accountable</h3>
              <p className="text-slate-600 leading-relaxed">
                Every user is a verified UW-Madison student. Our unique 'Consensus Completion' system ensures everyone stays accountable until the project is finished.
              </p>
            </div>

            {/* Card 2: Trust */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-red-100 transition-colors">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Trust Beyond Words</h3>
              <p className="text-slate-600 leading-relaxed">
                Stop guessing based on a short bio. Check a user's 'Completed Projects' count and trust badges earned from real collaborations.
              </p>
            </div>

            {/* Card 3: Recruiting */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-red-100 transition-colors">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Recruitment</h3>
              <p className="text-slate-600 leading-relaxed">
                Use 'Screening Questions' to filter applicants who truly understand your project goals and tech stack. No more generic "I'm interested" messages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Steps / How it works */}
      <section className="py-24 px-6 md:px-12 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">How it Works</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Simple, fast, and exclusive to our campus.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10"></div>

            <StepCard
              number="01"
              title="One-Click Sign In"
              desc="Log in securely with your Google account. We verify your @wisc.edu domain automatically."
            />
            <StepCard
              number="02"
              title="Post or Browse"
              desc="Share your vision to recruit a team, or browse existing projects filtered by major and skills."
            />
            <StepCard
              number="03"
              title="Start Building"
              desc="Connect via Discord or Email. Form your squad and create something amazing."
            />
          </div>
        </div>
      </section>

      {/* 5. Legal Footer */}
      <footer className="bg-slate-950 py-10 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight flex items-center gap-2 justify-center md:justify-start">
              <span className="text-[#c5050c]">Mad</span>Collab
            </h3>
            <p className="text-slate-500 text-xs max-w-md leading-relaxed">
              MadCollab is an independent, student-led project and is <span className="text-slate-400 font-bold">not officially affiliated</span> with the University of Wisconsin-Madison.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3 text-slate-600 text-xs">
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <div>
              &copy; {new Date().getFullYear()} MadCollab. Built with ❤️ by Badgers.
            </div>
          </div>
        </div>
      </footer>

    </main >
  );
}

function StepCard({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
      <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-2xl mb-6 shadow-md group-hover:bg-[#c5050c] transition-colors">
        {number}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 font-medium">
        {desc}
      </p>
    </div>
  )
}
