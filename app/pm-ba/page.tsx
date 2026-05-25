"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PMDashboard() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!prompt) return;
    setLoading(true);
    setResponse("Analyzing feature request and generating Agile Epic & User Stories...");
    
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
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
            Product Manager Workspace
          </h1>
          <p className="text-slate-400">Omni-Context-Agent // The Planner Persona</p>
        </div>

        {/* PM Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-emerald-400">Roadmap Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">68%</p>
              <p className="text-sm text-slate-400 mt-1">Q3 Deliverables</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-teal-400">Sprint Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">42 pts</p>
              <p className="text-sm text-slate-400 mt-1">Avg over last 3 sprints</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-cyan-400">Feature Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">14</p>
              <p className="text-sm text-slate-400 mt-1">Pending Triage</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Terminal */}
        <Card className="bg-slate-900/80 border-slate-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span>🧠</span> Omni-Agent Agile Terminal
            </CardTitle>
            <CardDescription className="text-slate-400">
              Drop your raw feature idea below (e.g., "We need a Google SSO login for the enterprise tier"). The AI will automatically generate an Epic and push the child User Stories to Jira.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your feature idea here..." 
                className="bg-slate-950 border-slate-700 text-slate-200 focus-visible:ring-emerald-500 h-12"
              />
              <Button 
                onClick={handleExecute}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold h-12 px-8"
              >
                {loading ? "Planning..." : "Execute"}
              </Button>
            </div>
            
            {/* Terminal Output */}
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm min-h-[150px] border border-slate-800 whitespace-pre-wrap">
              <span className="text-emerald-500">{"> "}</span>
              <span className="text-slate-300">{response || "Awaiting input..."}</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}