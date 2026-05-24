import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userPrompt = body.prompt;

    if (!userPrompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    // --- 1. THE AGENT TOOL: Check for a Jira Ticket ID ---
    // This regex looks for standard Jira keys like SCRUM-1 or AUTH-102
    const ticketMatch = userPrompt.match(/[A-Z]+-\d+/i);
    let jiraContext = "";

    if (ticketMatch) {
      const issueKey = ticketMatch[0].toUpperCase();
      const domain = process.env.JIRA_DOMAIN;
      const email = process.env.JIRA_EMAIL;
      const token = process.env.JIRA_API_TOKEN;

      const authBuffer = Buffer.from(`${email}:${token}`).toString('base64');

      // The AI actively uses the tool to fetch the ticket
      const jiraRes = await fetch(`https://${domain}/rest/api/3/issue/${issueKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authBuffer}`,
          'Accept': 'application/json'
        }
      });

      if (jiraRes.ok) {
        const data = await jiraRes.json();
        const summary = data.fields?.summary || "No summary found";
        const status = data.fields?.status?.name || "Unknown status";
        
        // We inject this invisible context into the AI's brain
        jiraContext = `\n\n[SYSTEM CONTEXT: The user is asking about Jira ticket ${issueKey}. You checked Jira and found this live data - Title: "${summary}", Status: "${status}". Use this context to answer them intelligently.]`;
      } else {
        jiraContext = `\n\n[SYSTEM CONTEXT: The user mentioned ticket ${issueKey}, but you encountered an error fetching it from Jira.]`;
      }
    }

    // --- 2. THE AI SYNTHESIS ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Combine the user's prompt with the secret Jira context
    const finalPrompt = userPrompt + jiraContext;
    const result = await model.generateContent(finalPrompt);
    const responseText = await result.response.text();

    return NextResponse.json({ success: true, data: responseText });
    
  } catch (error) {
    console.error("Agent Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate response." }, { status: 500 });
  }
}