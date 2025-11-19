import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, mainGoal, supportingGoal } = req.body;

    if (!type || (!mainGoal && !supportingGoal)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let prompt: string;
    let systemMessage: string;

    if (type === 'supporting') {
      // Get supporting goals for a main goal
      systemMessage = 'You are a goal-setting expert helping users break down their goals into actionable sub-goals.';
      prompt = `I have a main goal: "${mainGoal}"

Please suggest exactly 8 specific supporting goals that would help me achieve this main goal. These should be diverse areas I need to focus on.

Format your response as a numbered list from 1-8, with each item being concise (3-8 words max). Make them specific and actionable categories.

Example format:
1. Build physical strength
2. Improve mental toughness
3. Master technical skills
4. etc...`;
    } else if (type === 'actionable') {
      // Get actionable tasks for a supporting goal
      systemMessage = 'You are a goal-setting expert helping users create specific, actionable tasks.';
      prompt = `I have a supporting goal: "${supportingGoal}"
${mainGoal ? `This supports my main goal: "${mainGoal}"` : ''}

Please suggest exactly 8 specific, concrete, actionable tasks that would help me achieve this supporting goal. These should be things I can actually do.

Format your response as a numbered list from 1-8, with each item being concise (3-8 words max). Make them specific actions, not general advice.

Example format:
1. Meditate for 10 minutes daily
2. Practice visualization techniques
3. Read books on mindset
4. etc...`;
    } else {
      return res.status(400).json({ error: 'Invalid type' });
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
    if (!response) {
      throw new Error('No response from OpenAI');
    }

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

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return res.status(500).json({ error: 'Failed to get AI suggestions' });
  }
}
