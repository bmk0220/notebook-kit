import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic, audience, raw_content } = await req.json();

    const model = "deepseek/deepseek-chat";

    const prompt = `
      You are the "Forge Engine", a specialized AI for creating professional NotebookLM-ready Kits.
      Your goal is to generate a comprehensive, structured Kit about: "${topic}" for an audience of "${audience}".
      ${raw_content ? `Use this additional context: ${raw_content}` : ''}

      You MUST return a JSON object with the following structure:
      {
        "title": "Clear Title of the Kit",
        "slug": "url-friendly-slug",
        "description": "One sentence punchy description",
        "content": {
          "overview": "Markdown content for Overview segment",
          "key_concepts": "Markdown content for Key Concepts segment",
          "step_by_step": "Markdown content for Step-by-Step segment",
          "resources": "Markdown content for Resources segment",
          "faq": "Markdown content for FAQ segment",
          "checklists": "Markdown content for Checklists segment",
          "tips": "Markdown content for Tips segment",
          "system_instructions": "Technical instructions for an AI agent to use this kit effectively"
        }
      }

      CRITICAL: Return ONLY valid JSON. Ensure markdown strings use proper escaping.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "You are a professional technical writer and data scientist specialized in NotebookLM optimizations." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Forge API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
