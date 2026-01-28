/* eslint-disable */
import Link from "next/link";
import {
  RocketLaunchIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  LightBulbIcon
} from "@heroicons/react/24/outline";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans selection:bg-[#c5050c] selection:text-white pb-20">

      {/* 1. Hero Section: Clean, Honest, Inspiring */}
      <section className="relative pt-32 pb-40 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">

          <div className="inline-flex items-center gap-2 bg-red-50 text-[#c5050c] px-4 py-1.5 rounded-full text-sm font-bold mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c5050c]"></span>
            </span>
            Now Live for UW-Madison
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight mb-8 leading-tight">
            Turn Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c5050c] to-red-600">Ideas</span> <br />
            Into Reality.
          </h1>

          <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
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

      {/* 2. Value Proposition (No Fake Stats) */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <RocketLaunchIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Not Just Research</h3>
              <p className="text-slate-600 leading-relaxed">
                From tech startups and side hustles to CS577 capstones and art collaborations.
                If you have an idea, this is the place to launch it.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-red-50 text-[#c5050c] rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <ShieldCheckIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Badgers Only</h3>
              <p className="text-slate-600 leading-relaxed">
                Safe and secure. We enforce <span className="font-semibold">@wisc.edu</span> authentication
                so you know you are collaborating with real students.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Founding Members</h3>
              <p className="text-slate-600 leading-relaxed">
                Be among the first to post. Gain visibility and help shape the future of
                student collaboration at UW-Madison.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Steps / How it works */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">How MadCollab Works</h2>
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

      {/* 4. Minimalist Footer CTA */}
      <section className="py-24 bg-slate-900 mx-4 rounded-3xl text-center text-white relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <LightBulbIcon className="w-16 h-16 mx-auto mb-8 text-yellow-400" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Have an idea?</h2>
          <p className="text-xl text-slate-400 mb-10">
            Don't let it sit in your notes app. There are hundreds of students looking for a project just like yours.
          </p>
          <Link
            href="/post"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#c5050c] text-white rounded-full font-bold text-xl hover:bg-white hover:text-[#c5050c] transition-all"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            Launch Your Project
          </Link>
        </div>
      </section>

    </main>
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
