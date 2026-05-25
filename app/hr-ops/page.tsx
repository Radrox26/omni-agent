"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HRDashboard() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!prompt) return;
    setLoading(true);
    setResponse("Analyzing HR request and orchestrating onboarding workflows...");
    
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResponse(data.message || "Error generating response.");
    } catch (error) {
      setResponse("Failed to connect to Omni-Context-Agent.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400">
            HR & Operations Workspace
          </h1>
          <p className="text-slate-400">Omni-Context-Agent // The Coordinator Persona</p>
        </div>

        {/* HR Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-fuchsia-400">Active Onboardings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">3</p>
              <p className="text-sm text-slate-400 mt-1">Pending IT setup</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-pink-400">Open Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-slate-400 mt-1">Awaiting triage</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-rose-400">Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-slate-400 mt-1">Q3 Mandatory Training</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Terminal */}
        <Card className="bg-slate-900/80 border-slate-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span>🤝</span> Omni-Agent Concierge Terminal
            </CardTitle>
            <CardDescription className="text-slate-400">
              Trigger automated workflows. (e.g., "Onboard John Doe as a Senior Developer.")
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your HR or Operations request here..." 
                className="bg-slate-950 border-slate-700 text-slate-200 focus-visible:ring-fuchsia-500 h-12"
              />
              <Button 
                onClick={handleExecute}
                disabled={loading}
                className="bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:from-fuchsia-400 hover:to-rose-400 text-white font-bold h-12 px-8"
              >
                {loading ? "Coordinating..." : "Execute"}
              </Button>
            </div>
            
            {/* Terminal Output */}
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm min-h-[150px] border border-slate-800 whitespace-pre-wrap">
              <span className="text-fuchsia-500">{"> "}</span>
              <span className="text-slate-300">{response || "Awaiting input..."}</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}