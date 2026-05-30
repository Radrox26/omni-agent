import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { rawPrompt } = await request.json();

    // 🧠 STEP 1: AGENTIC INTENT CLASSIFICATION
    const routingModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const routerPrompt = `
      You are the brain of a GitHub Pull Request analyzer. 
      Read the following user prompt and determine what they want to do.
      
      Classify the intent into one of two categories:
      - "LIST_PRS": The user wants to see all open/pending PRs.
      - "REVIEW_PR": The user wants you to analyze a specific PR. Extract the PR number if they provided one.

      User Prompt: "${rawPrompt}"

      Return ONLY a JSON object formatted exactly like this:
      {
        "intent": "LIST_PRS" | "REVIEW_PR" | "UNKNOWN",
        "prNumber": number or null
      }
    `;

    const routingResult = await routingModel.generateContent({
      contents: [{ role: "user", parts: [{ text: routerPrompt }] }],
      generationConfig: { responseMimeType: "application/json" } // Forces perfect JSON output
    });

    const aiDecision = JSON.parse(routingResult.response.text());

    // 🚀 STEP 2: EXECUTE BASED ON AI'S DECISION
    
    if (aiDecision.intent === "LIST_PRS") {
      // Execute GitHub API call to list all open PRs
      const githubResponse = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_PR_REPO}/pulls?state=open`,
        { headers: { Authorization: `Bearer ${process.env.GITHUB_PAT}` } }
      );
      const prs = await githubResponse.json();
      const prListSummary = prs.map((p: any) => `• [PR #${p.number}] ${p.title}`).join("\n");
      
      return NextResponse.json({ 
        success: true, 
        review: `Found ${prs.length} Open Pull Requests:\n\n${prListSummary || "No pending PRs found."}` 
      });
    }

    if (aiDecision.intent === "REVIEW_PR") {
      if (!aiDecision.prNumber) {
        return NextResponse.json({ 
          success: true, 
          review: "I understand you want to review a PR, but I couldn't detect the PR number in your message. Which PR should I analyze?" 
        });
      }

      // 1️⃣ FETCH THE PR DIFF FROM GITHUB
      const githubResponse = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_PR_REPO}/pulls/${aiDecision.prNumber}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_PAT}`,
            Accept: 'application/vnd.github.v3.diff', 
          },
        }
      );
      const prDiff = await githubResponse.text();
      console.log("Fetched PR Diff:", prDiff.substring(0, 500)); // Log the first 500 chars for debugging

      // 2️⃣ FETCH ARCHITECTURAL RULES FROM PINECONE
      // First, we convert our search intent into a vector using the exact same model you used in your sync script
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
      const embedResult = await embeddingModel.embedContent("engineering architecture security guidelines rules");
      const queryVector = embedResult.embedding.values;

      // Query Pinecone for the most relevant Confluence rules
      const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
      const index = pc.index(process.env.PINECONE_PR_INDEX!);
      
      const pineconeResponse = await index.query({
        vector: queryVector,
        topK: 2,
        includeMetadata: true,
      });

      // Extract the raw text from the Pinecone metadata
      const companyRules = pineconeResponse.matches
        .map(match => match.metadata?.text)
        .join('\n\n');

      // 3️⃣ THE REVIEW AGENT (GEMINI SYNTHESIZES RULES + CODE)
      const reviewerModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const reviewPrompt = `
        You are an elite Tech Lead and Security Architect.
        Review the following GitHub Pull Request diff against our internal company guidelines (fetched from Confluence).

        COMPANY GUIDELINES:
        ${companyRules || "No explicit guidelines found. Apply standard senior-level security and performance best practices."}

        PULL REQUEST DIFF:
        ${prDiff}

        TASK:
        Identify vulnerabilities, anti-patterns, and guideline violations. 
        Format your response in clean Markdown. Use headings for each violation, state the severity, and give a code suggestion to fix it.
      `;

      const finalReviewResult = await reviewerModel.generateContent(reviewPrompt);
      const formattedReview = finalReviewResult.response.text();

      return NextResponse.json({ 
        success: true, 
        review: formattedReview 
      });
    }

    // Fallback if AI gets confused
    return NextResponse.json({ success: true, review: "I didn't quite catch that. Do you want me to list active PRs or review a specific one?" });

  } catch (error) {
    console.error("Agentic Routing Error:", error);
    return NextResponse.json({ success: false, error: "Operation execution failed." }, { status: 500 });
  }
}