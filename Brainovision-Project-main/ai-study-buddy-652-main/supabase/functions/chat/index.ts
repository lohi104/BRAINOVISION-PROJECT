import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode, image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "You are a helpful AI tutor. Explain concepts clearly with step-by-step answers. Use markdown formatting.";

    if (mode === "notes") {
      systemPrompt = `You are a notes simplifier. Given study notes, produce:
## Summary
A concise 2-3 sentence summary.

## Key Points
- Bullet points of the most important concepts

## Key Terms
- **Term**: Definition

Keep it concise and easy to study from. Use markdown.`;
    }

    if (mode === "timetable") {
      const timetableMessages: any[] = [
        {
          role: "system",
          content: "You are a study planner. Return ONLY valid JSON, no markdown, no code blocks.",
        },
        ...messages,
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: timetableMessages,
          tools: [
            {
              type: "function",
              function: {
                name: "create_timetable",
                description: "Create a structured daily study timetable",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Title like 'Daily Study Schedule'" },
                    rows: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          time: { type: "string", description: "Time range e.g. '6:00 AM – 7:00 AM'" },
                          activity: { type: "string", description: "Short activity description" },
                          type: {
                            type: "string",
                            enum: ["study", "break", "revision", "practice", "other"],
                            description: "Type of activity for color coding",
                          },
                        },
                        required: ["time", "activity", "type"],
                        additionalProperties: false,
                      },
                    },
                    tips: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-4 study tips",
                    },
                  },
                  required: ["title", "rows", "tips"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "create_timetable" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI error");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call returned");
      const parsed = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify({ timetable: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "doubt") {
      systemPrompt = `You are a doubt solver for students. When given a question (possibly from an image):
1. Identify the subject and topic
2. Solve the problem step-by-step
3. Explain the underlying concept
4. Give a similar practice question at the end

Use markdown formatting. Be thorough but clear.`;
    }

    if (mode === "quiz") {
      const topic = messages[messages.length - 1]?.content || "";
      const quizPrompt = `Generate exactly 5 multiple choice questions about "${topic}". 
Return ONLY valid JSON in this exact format, no other text:
{"questions":[{"question":"...","options":["A","B","C","D"],"correct":0}]}
where "correct" is the 0-based index of the correct option.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a quiz generator. Return ONLY valid JSON, no markdown, no code blocks." },
            { role: "user", content: quizPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI error");
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || "{}";
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(content);

      return new Response(JSON.stringify({ questions: parsed.questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages array - support image for doubt solver
    const aiMessages: any[] = [{ role: "system", content: systemPrompt }];

    if (image && mode === "doubt") {
      // For image-based doubts, use multimodal content
      const lastMsg = messages[messages.length - 1];
      const textContent = lastMsg?.content || "Solve this question step by step.";
      
      aiMessages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: image } },
          { type: "text", text: textContent },
        ],
      });
    } else {
      aiMessages.push(...messages);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: image ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
