import { Character } from "@/types";

export interface ScriptScene {
  sceneNumber: number;
  timeOfDay: string;
  setting: string;
  action: string;
  dialogue: string;
  emotion: string;
}

export interface GeneratedScript {
  title: string;
  logline: string;
  scenes: ScriptScene[];
  totalDuration: string;
}

export async function generatePixarScript(
  events: any[],
  character: Character,
  userName: string,
  date: Date,
  apiKey: string
): Promise<GeneratedScript> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const eventsDescription = events
    .map((e, i) => {
      const time = new Date(e.startTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${i + 1}. ${time} - ${e.title}${e.location ? ` at ${e.location}` : ""}`;
    })
    .join("\n");

  const prompt = `You are a Pixar screenwriter. Create a heartwarming, cinematic script based on ${userName}'s day.

CHARACTER NARRATOR:
- Name: ${character.name}
- Personality: ${character.personality}
- Visual Style: ${character.visualStyle}
- Voice: ${character.voiceType}
- Pixar Reference: ${character.pixarReference}

DATE: ${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}

EVENTS:
${eventsDescription}

REQUIREMENTS:
1. Write in the style of ${character.pixarReference}
2. Use ${character.personality} narration throughout
3. Create exactly 3 scenes covering the day's highlights (no more, no less)
4. Each scene should have:
   - Scene number and time of day
   - Setting description (visual, Pixar-style)
   - Action description
   - Character dialogue/narration (first person from ${userName}'s perspective)
   - Emotional tone
5. Make it cinematic, heartwarming, and inspiring
6. Add small moments of humor or wonder
7. Connect events into a cohesive story arc
8. Total runtime should be around 2 minutes

Return ONLY a valid JSON object with this structure:
{
  "title": "The Day of [Creative Title]",
  "logline": "One sentence summary of the day's story",
  "scenes": [
    {
      "sceneNumber": 1,
      "timeOfDay": "Morning/Afternoon/Evening",
      "setting": "Detailed Pixar-style visual description",
      "action": "What happens in this scene",
      "dialogue": "First-person narration from ${userName}",
      "emotion": "The emotional tone"
    }
  ],
  "totalDuration": "2:30"
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a Pixar screenwriter who creates heartwarming, cinematic stories. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content: string | undefined = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("OpenAI response did not include any content");
    }

    let jsonPayload = content;

    const fencedMatch = jsonPayload.match(/```json\s*([\s\S]*?)```/i);
    if (fencedMatch) {
      jsonPayload = fencedMatch[1].trim();
    } else {
      jsonPayload = jsonPayload.replace(/^```|```$/g, "").trim();
    }

    try {
      const script = JSON.parse(jsonPayload);
      return script;
    } catch (parseError) {
      console.error("Failed to parse OpenAI JSON response:", jsonPayload);
      throw new Error("Received an invalid JSON response from OpenAI");
    }
  } catch (error) {
    console.error("Error generating script:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while generating the script");
  }
}
