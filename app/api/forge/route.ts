import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic, audience, raw_content, mode, blueprint } = await req.json();

    const model = "deepseek/deepseek-chat";

    if (mode === 'blueprint') {
      const blueprintPrompt = `
        You are the "Master Strategist" for NotebookLM Knowledge Kits.
        Given a topic, audience, and research, propose a professional "Kit Blueprint".
        
        Topic: "${topic}"
        Audience: "${audience}"
        Research Content: ${raw_content}

        Your goal is to define the "Angle" and specific "Focus Points" for each of the 8 required sections of a Knowledge Kit.
        
        You MUST return a JSON object:
        {
          "angle": "The unique value proposition of this kit",
          "sections": {
            "overview": ["focus point 1", "focus point 2"],
            "key_concepts": ["focus point 1", "focus point 2"],
            "step_by_step": ["focus point 1", "focus point 2"],
            "resources": ["focus point 1", "focus point 2"],
            "faq": ["focus point 1", "focus point 2"],
            "checklists": ["focus point 1", "focus point 2"],
            "tips": ["focus point 1", "focus point 2"],
            "system_instructions": ["Technical focus 1", "Technical focus 2"]
          }
        }
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
            { role: "system", content: "You are a professional technical strategist specialized in high-performance knowledge systems." },
            { role: "user", content: blueprintPrompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]) {
        console.error('OpenRouter API Error - Invalid Response Structure:', JSON.stringify(data, null, 2));
        throw new Error('Received invalid response structure from AI provider.');
      }
      
      const result = JSON.parse(data.choices[0].message.content);
      return NextResponse.json(result);
    }

    // Default: Full Generation Mode using the Blueprint
    const forgePrompt = `
      You are the "Forge Engine", a specialized AI for creating professional NotebookLM-ready Kits.
      Your goal is to generate a comprehensive, structured Kit about: "${topic}" for an audience of "${audience}".
      
      CRITICAL: You MUST follow this approved Blueprint for the generation:
      Angle: ${blueprint.angle}
      
      Section Focus Points:
      ${Object.entries(blueprint.sections).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('\n')}

      Research Context:
      ${raw_content}

      You MUST return a JSON object with this EXACT structure:
      {
        "title": "Clear Title",
        "slug": "url-friendly-slug",
        "description": "One sentence punchy description",
        "content": {
          "overview": "Markdown content",
          "key_concepts": "Markdown content",
          "step_by_step": "Markdown content",
          "resources": "Markdown content",
          "faq": "Markdown content",
          "checklists": "Markdown content",
          "tips": "Markdown content",
          "system_instructions": "Technical AI instructions"
        }
      }
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
          { role: "system", content: "You are a professional technical writer and data scientist. Return ONLY valid JSON." },
          { role: "user", content: forgePrompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Forge API Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
