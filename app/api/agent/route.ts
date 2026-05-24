import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userPrompt = body.prompt;

    if (!userPrompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const ticketMatch = userPrompt.match(/[A-Z]+-\d+/i);
    let systemContext = "";

    if (ticketMatch) {
      const issueKey = ticketMatch[0].toUpperCase();
      
      // --- 1. JIRA FETCH ---
      const jiraDomain = process.env.JIRA_DOMAIN;
      const jiraEmail = process.env.JIRA_EMAIL;
      const jiraToken = process.env.JIRA_API_TOKEN;
      const authBuffer = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

      let summary = "Unknown Task";
      let status = "Unknown Status";

      const jiraRes = await fetch(`https://${jiraDomain}/rest/api/3/issue/${issueKey}`, {
        method: 'GET',
        headers: { 'Authorization': `Basic ${authBuffer}`, 'Accept': 'application/json' }
      });

      if (jiraRes.ok) {
        const data = await jiraRes.json();
        summary = data.fields?.summary || summary;
        status = data.fields?.status?.name || status;
        systemContext += `\n\n[SYSTEM: User asked about Jira ticket ${issueKey}. Live Data - Title: "${summary}", Status: "${status}".]`;
      }

      // --- 2. GITHUB EXECUTION ---
      const ghOwner = process.env.GITHUB_OWNER;
      const ghRepo = process.env.GITHUB_REPO;
      const ghToken = process.env.GITHUB_PAT;

      if (ghOwner && ghRepo && ghToken && jiraRes.ok) {
        // We auto-format a clean, standardized branch name
        const branchName = `feat/${issueKey.toLowerCase()}-auto-agent-setup`;

        try {
          // A. Get the current 'main' branch SHA
          const refRes = await fetch(`https://api.github.com/repos/${ghOwner}/${ghRepo}/git/refs/heads/main`, {
            headers: { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Omni-Context-Agent' }
          });

          if (refRes.ok) {
            const refData = await refRes.json();
            const sha = refData.object.sha;

            // B. Create the new branch using that SHA
            const createRes = await fetch(`https://api.github.com/repos/${ghOwner}/${ghRepo}/git/refs`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Omni-Context-Agent' },
              body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: sha })
            });

            if (createRes.ok || createRes.status === 422) { // 422 means it might already exist
              systemContext += `\n[SYSTEM: You successfully executed a GitHub command to create a branch named '${branchName}'. Inform the user their branch is ready, and give them a 3-step technical implementation plan for "${summary}".]`;
            }
          }
        } catch (error) {
          console.error("GitHub Error:", error);
        }
      }
    }

    // --- 3. AI SYNTHESIS ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const finalPrompt = userPrompt + systemContext;
    const result = await model.generateContent(finalPrompt);
    const responseText = await result.response.text();

    return NextResponse.json({ success: true, data: responseText });
    
  } catch (error) {
    console.error("Agent Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate response." }, { status: 500 });
  }
}