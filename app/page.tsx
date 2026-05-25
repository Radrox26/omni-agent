import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  const roles = [
    { 
      title: "💻 Developer", 
      description: "View active PRs, assigned bugs, and trigger AI coding workflows.",
      gradient: "from-blue-500 to-cyan-400",
      glow: "group-hover:shadow-cyan-500/20"
    },
    { 
      title: "📊 Product Manager / Business Analyst", 
      description: "Track sprint velocity, feature requests, and generate Agile tickets.",
      gradient: "from-purple-500 to-pink-400",
      glow: "group-hover:shadow-purple-500/20"
    },
    { 
      title: "🏗️ Architect / Tech Lead", 
      description: "Review system health and run semantic architecture reviews.",
      gradient: "from-orange-500 to-red-400",
      glow: "group-hover:shadow-orange-500/20"
    },
    { 
      title: "👥 HR / Operations", 
      description: "Manage employee onboarding and automate internal ticketing.",
      gradient: "from-emerald-500 to-teal-400",
      glow: "group-hover:shadow-emerald-500/20"
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-slate-950 text-slate-50 overflow-hidden relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl w-full text-center mb-16 relative z-10">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
          Omni-Context-Agent
        </h1>
        <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
          Select your role to access your personalized, AI-driven dashboard.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {roles.map((role) => (
          <Link href={
              role.title.includes("Developer") ? "/developer" : 
              role.title.includes("Product Manager") || role.title.includes("Business Analyst") ? "/pm-ba" : 
              role.title.includes("HR") || role.title.includes("Operations") ? "/hr-ops" : 
              "#"
            } key={role.title} className="block">
            <Card 
              className={`group cursor-pointer border-slate-800 bg-slate-900/50 backdrop-blur-md hover:-translate-y-2 hover:border-slate-700 hover:shadow-2xl transition-all duration-300 ${role.glow} h-full`}
            >
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2 text-slate-100">
                  {role.title}
                </CardTitle>
                <CardDescription className="text-base mt-2 text-slate-400 leading-relaxed">
                  {role.description}
                </CardDescription>
                
                {/* Animated underline effect that appears on hover */}
                <div className={`h-1.5 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r ${role.gradient} rounded-full mt-5 opacity-0 group-hover:opacity-100`}></div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      
      {/* Subtle bottom grid pattern for depth */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)] pointer-events-none opacity-20"></div>

    </main>
  );
}