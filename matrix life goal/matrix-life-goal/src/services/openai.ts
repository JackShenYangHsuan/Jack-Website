import OpenAI from 'openai';

export interface SuggestionResponse {
  suggestions: string[];
}

// Initialize OpenAI client for development only
const openai = import.meta.env.VITE_OPENAI_API_KEY
  ? new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    })
  : null;

// Helper function to call the secure API endpoint (production)
async function callAIAPI(type: 'supporting' | 'actionable', mainGoal?: string, supportingGoal?: string): Promise<string[]> {
  const response = await fetch('/api/ai-suggestions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      mainGoal,
      supportingGoal,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.suggestions;
}

// Helper function to call OpenAI directly (development only)
async function callOpenAIDirect(
  systemMessage: string,
  prompt: string
): Promise<string[]> {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: systemMessage,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) throw new Error('No response from OpenAI');

  // Parse the response - expecting 8 numbered items
  const suggestions = response
    .split('\n')
    .filter((line) => line.trim().match(/^\d+\./))
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .slice(0, 8);

  // Pad with empty strings if we got fewer than 8
  while (suggestions.length < 8) {
    suggestions.push('');
  }

  return suggestions;
}

/**
 * Get AI suggestions for supporting goals (cells 1-8) based on a main goal
 * @param mainGoal The center goal text
 * @returns Array of 8 suggested supporting goals
 */
export async function getSupportingGoals(mainGoal: string): Promise<string[]> {
  try {
    // Use API endpoint in production, direct OpenAI in development
    if (openai) {
      const prompt = `I have a main goal: "${mainGoal}"

Please suggest exactly 8 specific supporting goals that would help me achieve this main goal. These should be diverse areas I need to focus on.

Format your response as a numbered list from 1-8, with each item being concise (3-8 words max). Make them specific and actionable categories.

Example format:
1. Build physical strength
2. Improve mental toughness
3. Master technical skills
4. etc...`;

      return await callOpenAIDirect(
        'You are a goal-setting expert helping users break down their goals into actionable sub-goals.',
        prompt
      );
    } else {
      return await callAIAPI('supporting', mainGoal);
    }
  } catch (error) {
    console.error('Error getting supporting goals:', error);
    throw error;
  }
}

/**
 * Get AI suggestions for actionable tasks (cells 1-8) based on a supporting goal
 * @param supportingGoal The goal text from cells 1-8 of the main grid
 * @param mainGoal The parent/main goal for context
 * @returns Array of 8 suggested actionable tasks
 */
export async function getActionableTasks(
  supportingGoal: string,
  mainGoal?: string
): Promise<string[]> {
  try {
    // Use API endpoint in production, direct OpenAI in development
    if (openai) {
      const prompt = `I have a supporting goal: "${supportingGoal}"
${mainGoal ? `This supports my main goal: "${mainGoal}"` : ''}

Please suggest exactly 8 specific, concrete, actionable tasks that would help me achieve this supporting goal. These should be things I can actually do.

Format your response as a numbered list from 1-8, with each item being concise (3-8 words max). Make them specific actions, not general advice.

Example format:
1. Meditate for 10 minutes daily
2. Practice visualization techniques
3. Read books on mindset
4. etc...`;

      return await callOpenAIDirect(
        'You are a goal-setting expert helping users create specific, actionable tasks.',
        prompt
      );
    } else {
      return await callAIAPI('actionable', mainGoal, supportingGoal);
    }
  } catch (error) {
    console.error('Error getting actionable tasks:', error);
    throw error;
  }
}
