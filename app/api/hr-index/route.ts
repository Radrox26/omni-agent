import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    // 1. Initialize Clients
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.index(process.env.PINECONE_INDEX!);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

    // 2. Jira/Confluence Credentials
    const domain = process.env.JIRA_DOMAIN;
    const email = process.env.JIRA_EMAIL;
    const token = process.env.CONFLUENCE_API_TOKEN;
    
    if (!domain || !email || !token) {
        return NextResponse.json({ success: false, error: "Missing Atlassian credentials." }, { status: 401 });
    }

    // Create the Base64 Encoded Auth Header
    const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

    const PAGE_IDS = ["491521", "131074", "65839"]; 
    const documents = [];

    // 3. Fetch Live Data from Confluence
    for (const pageId of PAGE_IDS) {
        const pageUrl = `https://${domain}/wiki/rest/api/content/${pageId}?expand=body.storage`;
        console.log(`Fetching Confluence page: ${pageUrl}`);
        const response = await fetch(pageUrl, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const title = data.title;
            // Strip the messy HTML tags to get raw text for the AI
            const rawHtml = data.body.storage.value;
            const cleanText = rawHtml.replace(/<[^>]*>?/gm, ''); 

            documents.push({
                id: `doc-${pageId}`,
                title: title,
                text: cleanText
            });
        }
    }

    // 4. Generate Vectors and Prepare for Pinecone
    const vectors = await Promise.all(documents.map(async (doc) => {
      const result = await embeddingModel.embedContent(doc.text);
      const embedding = result.embedding.values;

      return {
        id: doc.id,
        values: embedding, 
        metadata: {
          title: doc.title,
          text: doc.text 
        }
      };
    }));

    // 5. Inject into Pinecone
    await index.upsert({ records: vectors });
    
    return NextResponse.json({ 
        success: true, 
        message: `Successfully fetched and embedded ${vectors.length} live Confluence documents into Pinecone!` 
    });

  } catch (error) {
    console.error("Indexing Error:", error);
    return NextResponse.json({ success: false, error: "Failed to inject data into Pinecone" }, { status: 500 });
  }
}