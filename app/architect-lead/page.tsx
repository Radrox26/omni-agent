"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from 'react-markdown';

export default function ArchitectDashboard() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!prompt) return;
    setLoading(true);
    setResponse("Consulting Omni-Context-Agent to parse intent and execute command...");
    
    try {
      // 🧠 Passing raw text directly to our AI router. No frontend regex.
      const res = await fetch("/api/review-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawPrompt: prompt }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResponse(data.review || data.message);
      } else {
        setResponse(data.error || "Error generating automated report.");
      }
    } catch (error) {
      setResponse("Failed to establish link with Omni-Context-Agent.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400">
            Architect Workspace
          </h1>
          <p className="text-slate-400">Omni-Context-Agent // The Reviewer Persona</p>
        </div>

        {/* Architect Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-orange-400">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">99.9%</p>
              <p className="text-sm text-slate-400 mt-1">Uptime across all services</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-amber-400">Pending PRs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">4</p>
              <p className="text-sm text-slate-400 mt-1">Awaiting architecture review</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-yellow-400">Architecture Diagrams</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">V.2</p>
              <p className="text-sm text-slate-400 mt-1">Microservices map updated</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Terminal */}
        <Card className="bg-slate-900/80 border-slate-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span>🏗️</span> Omni-Agent Semantic Reviewer
            </CardTitle>
            <CardDescription className="text-slate-400">
              Trigger a semantic code review or fetch PRs. Try: "Show me all open PRs" or "Review PR #1"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your review command here..." 
                className="bg-slate-950 border-slate-700 text-slate-200 focus-visible:ring-orange-500 h-12"
              />
              <Button 
                onClick={handleExecute}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold h-12 px-8"
              >
                {loading ? "Analyzing..." : "Review PR"}
              </Button>
            </div>
            
            {/* Terminal Output */}
            <div className="bg-slate-950 rounded-lg p-6 font-sans text-sm min-h-[250px] border border-slate-800 overflow-y-auto max-h-[500px]">
              <div className="flex gap-3">
                <span className="text-orange-500 font-mono mt-1">{">"}</span>
                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 max-w-none w-full text-slate-300">
                  {response ? (
                    <ReactMarkdown>{response}</ReactMarkdown>
                  ) : (
                    <span className="font-mono">Awaiting input...</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}