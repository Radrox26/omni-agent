import { NextResponse } from "next/server";

export async function GET() {
  const domain = process.env.JIRA_DOMAIN;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  // We are targeting the specific ticket from your screenshot!
  const issueKey = "SCRUM-1"; 

  if (!domain || !email || !token) {
    return NextResponse.json({ success: false, error: "Missing Jira credentials in .env.local" }, { status: 400 });
  }

  try {
    // Jira requires Basic Auth using your email and API token encoded in base64
    const authBuffer = Buffer.from(`${email}:${token}`).toString('base64');

    const response = await fetch(`https://${domain}/rest/api/3/issue/${issueKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authBuffer}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
       return NextResponse.json({ success: false, error: `Jira API responded with status: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Extracting just the useful bits for our test
    return NextResponse.json({
        success: true,
        ticket: data.key,
        summary: data.fields?.summary || "No summary found",
        status: data.fields?.status?.name || "Unknown status"
    });

  } catch (error) {
    console.error("Jira Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to connect to Jira." }, { status: 500 });
  }
}