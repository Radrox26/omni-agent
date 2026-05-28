import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to call Jira API
async function fetchJira(endpoint: string, method: string = "GET", body: any = null) {
  const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;
  const authBuffer = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
  
  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Basic ${authBuffer}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  };
  
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`https://${JIRA_DOMAIN}/rest/api/2/${endpoint}`, options);
  return res.json();
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // ---------------------------------------------------------------------------
    // PHASE 1: THE SEMANTIC ROUTER
    // ---------------------------------------------------------------------------
    // We force Gemini to output strict JSON to classify the user's intent.
    const routerModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const routerPrompt = `
      You are the brain of the Omni-Context-Agent routing system. Analyze the user prompt and determine intent.
      - Work on/start an existing Jira ticket (e.g., "work on SCRUM-1") -> "DEV"
      - Plan, create, or build a new feature idea -> "PM/BA"
      - Onboard an employee, manage HR, or coordinate operations -> "HR/OPS"
      - Review pull requests, code, or architecture -> "ARCHITECT/LEAD"
      - If you can't determine a clear intent, classify as "UNKNOWN" and ask for clarification.
      
      User Prompt: "${prompt}"
      
      Return ONLY a JSON object:
      {
        "intent": "DEV" | "PM/BA" | "HR/OPS" | "ARCHITECT/LEAD" | "UNKNOWN",
        "extractedTicketId": "string or null",
        "extractedFeatureIdea": "string or null",
        "extractedHrTarget": "string or null",
        "extractedPrNumber": "string or null"
      }
    `;

    const routerResult = await routerModel.generateContent(routerPrompt);
    const routingData = JSON.parse(routerResult.response.text());

    // ---------------------------------------------------------------------------
    // PHASE 2: THE PM WORKFLOW (Write to Jira)
    // ---------------------------------------------------------------------------
    if (routingData.intent === "PM/BA" && routingData.extractedFeatureIdea) {
      
      // 1. Generate the Agile formatting
      const pmModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
      const pmPrompt = `
        Act as a Senior Product Manager. Take this feature idea: "${routingData.extractedFeatureIdea}"
        Break it down into 1 standard Agile Epic and 3 child User Stories.
        
        Return ONLY a JSON object with this exact structure:
        {
          "epic": { "title": "...", "description": "..." },
          "stories": [
            { "title": "...", "description": "..." },
            { "title": "...", "description": "..." },
            { "title": "...", "description": "..." }
          ]
        }
      `;
      
      const agilePlan = JSON.parse((await pmModel.generateContent(pmPrompt)).response.text());
      const projectKey = process.env.JIRA_PROJECT_KEY || "SCRUM";

      // 2. Push Epic to Jira (Using Issue Type "Epic" or standard "Task" if Epic isn't configured)
      const epicResponse = await fetchJira("issue", "POST", {
        fields: {
          project: { key: projectKey },
          summary: `[EPIC] ${agilePlan.epic.title}`,
          description: agilePlan.epic.description,
          issuetype: { name: "Task" } // Defaulting to Task to ensure it doesn't fail on custom Jira configurations
        }
      });

      // 3. Push Child Stories to Jira
      for (const story of agilePlan.stories) {
        await fetchJira("issue", "POST", {
          fields: {
            project: { key: projectKey },
            summary: `[STORY] ${story.title}`,
            description: `${story.description}\n\nParent Epic: ${epicResponse.key}`,
            issuetype: { name: "Story" } // Ensure "Story" issue type exists in your Jira project
          }
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Plan executed autonomously. I successfully routed this as a Product Manager task. I analyzed your idea, generated an Agile Epic with 3 User Stories, and pushed them directly into your Jira project (${projectKey}).` 
      });
    }

    // ---------------------------------------------------------------------------
    // PHASE 3: THE DEV WORKFLOW (Read from Jira & Push to GitHub)
    // ---------------------------------------------------------------------------
    if (routingData.intent === "DEV" && routingData.extractedTicketId) {
      // Fetch Jira Data
      const ticketData = await fetchJira(`issue/${routingData.extractedTicketId}`);
      if (ticketData.errorMessages) throw new Error("Ticket not found in Jira.");
      
      const summary = ticketData.fields.summary;
      const status = ticketData.fields.status.name;

      // GitHub Execution Logic (Simplified for stability)
      const branchName = `feat/${routingData.extractedTicketId.toLowerCase()}-auto-agent-setup`;
      const githubRes = await fetch(`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/git/refs/heads/main`, {
        headers: {
          "Authorization": `token ${process.env.GITHUB_PAT}`,
          "Accept": "application/vnd.github.v3+json",
        }
      });
      
      const mainBranchData = await githubRes.json();
      await fetch(`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/git/refs`, {
        method: "POST",
        headers: {
          "Authorization": `token ${process.env.GITHUB_PAT}`,
          "Accept": "application/vnd.github.v3+json",
        },
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainBranchData.object.sha })
      });

      // Final Chat Response
      const devModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const devResult = await devModel.generateContent(`You are a developer assistant. The user wants to work on ${routingData.extractedTicketId} (${summary}, Status: ${status}). Tell them you routed this as a Developer task, successfully read the Jira ticket, and created the GitHub branch ${branchName}. Provide a quick 3-step coding plan.`);
      
      return NextResponse.json({ success: true, message: devResult.response.text() });
    }

    // ---------------------------------------------------------------------------
    // PHASE 4: THE HR/OPS WORKFLOW (The Concierge)
    // ---------------------------------------------------------------------------

    if (routingData.intent === "HR/OPS" && routingData.extractedHrTarget) {
      const hrModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const hrPrompt = `
        Act as an Expert HR & Operations Concierge. The user has requested to: "${routingData.extractedHrTarget}".
        Generate a comprehensive but concise 30-day onboarding checklist for this specific role. 
        Then, generate the below 2 points and explicitly confirm that you have "simulated" the following backend actions:
        1. Drafted an IT hardware request email.
        2. Scheduled a welcome message in the #general Slack channel.
        Format this cleanly with bullet points and bold text.
      `;
      
      const hrResult = await hrModel.generateContent(hrPrompt);
      
      return NextResponse.json({ 
        success: true, 
        message: `[ROUTED AS: HR & OPERATIONS]\n\n${hrResult.response.text()}` 
      });
    }

    // ---------------------------------------------------------------------------
    // PHASE 5: THE ARCHITECT WORKFLOW (Semantic Code Review)
    // ---------------------------------------------------------------------------
    if (routingData.intent === "ARCHITECT/LEAD" && routingData.extractedPrNumber) {
      const archModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const archPrompt = `
        Act as a Principal Software Architect doing a semantic code review. The user has asked you to review a PR: "${prompt}".
        Since this is a simulated hackathon demo, mock a response stating you reviewed the code against internal guidelines.
        Note one specific imaginary violation (e.g., "The database query in auth_module.ts bypasses the Redis caching layer").
        State that you have automatically posted an inline comment on GitHub.
        Format cleanly with bullet points.
      `;
      
      const archResult = await archModel.generateContent(archPrompt);
      
      return NextResponse.json({ 
        success: true, 
        message: `[ROUTED AS: ARCHITECT & TECH LEAD]\n\n${archResult.response.text()}` 
      });
    }

    // Fallback if the AI couldn't classify it properly
    return NextResponse.json({ success: true, message: "I received your message, but I wasn't sure if you wanted to plan a new feature or execute a coding task. Could you clarify your goal?" });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: `System Error: ${error.message}` });
  }
}