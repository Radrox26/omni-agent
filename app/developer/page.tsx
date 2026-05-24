"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function DeveloperDashboard() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const askOmniAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsLoading(true);
    setResponse(""); // Clear previous response

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResponse(data.data);
      } else {
        setResponse("Error: " + data.error);
      }
    } catch (error) {
      setResponse("Failed to connect to the Omni-Agent.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 md:p-12 bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30">
      
      {/* Top Navigation */}
      <nav className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Developer Command Center
          </h1>
          <p className="text-slate-400 mt-1">Role: The Executor</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
            ← Switch Role
          </Button>
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Context & Mock Tickets */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Active Sprint
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-md bg-slate-800/50 border border-slate-700">
                <p className="text-sm font-semibold text-slate-200">AUTH-102: Google SSO Integration</p>
                <p className="text-xs text-slate-400 mt-1">Priority: High | Status: In Progress</p>
              </div>
              <div className="p-3 rounded-md bg-slate-800/50 border border-slate-700">
                <p className="text-sm font-semibold text-slate-200">BUG-404: Payment Gateway Timeout</p>
                <p className="text-xs text-slate-400 mt-1">Priority: Critical | Status: Pending Triage</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Omni-Agent Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800 h-full min-h-[500px] flex flex-col shadow-2xl shadow-cyan-900/10">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-slate-100 text-xl">Omni-Agent Terminal</CardTitle>
              <CardDescription className="text-slate-400">
                Type "@Omni-Context-Agent I want to start working on user story AUTH-102" to test the AI.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 p-6 flex flex-col justify-end">
              
              {/* Output Area */}
              <div className="flex-1 overflow-y-auto mb-6 text-slate-300 whitespace-pre-wrap font-mono text-sm">
                {response ? (
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 shadow-inner">
                    <span className="text-cyan-400 font-bold mb-2 block">Agent Response:</span>
                    {response}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 italic">
                    Awaiting instructions...
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={askOmniAgent} className="flex gap-3">
                <Input 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Omni-Agent to analyze a ticket or create a branch..."
                  className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-500 h-12"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="h-12 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
                >
                  {isLoading ? "Processing..." : "Execute"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}