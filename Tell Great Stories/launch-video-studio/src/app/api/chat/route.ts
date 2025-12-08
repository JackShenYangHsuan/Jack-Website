import { loadSettings, loadProject, saveProject } from '@/lib/storage';
import { OpenRouterClient } from '@/lib/openrouter';
import { getDiscoveryPrompt, buildOpeningMessage } from '@/lib/prompts';
import { createMessage } from '@/types/chat';

/**
 * POST /api/chat
 * Handle chat messages with streaming response
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, projectId, companyName, tagline, generateOpening } = body;

    // Load settings to get API key
    const settings = await loadSettings();

    if (!settings.openRouterApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured. Please add it in Settings.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If this is a request to generate the opening message
    if (generateOpening) {
      const openingContent = buildOpeningMessage(companyName, tagline);
      const openingMessage = createMessage('assistant', openingContent);

      // Save to project
      if (projectId) {
        const project = await loadProject(projectId);
        if (project) {
          project.chatHistory.push(openingMessage);
          if (project.storyBrief) {
            project.storyBrief.interviewTranscript = project.chatHistory;
          }
          await saveProject(project);
        }
      }

      return new Response(JSON.stringify({ message: openingMessage }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create OpenRouter client
    const client = new OpenRouterClient(settings.openRouterApiKey, settings.defaultModel);

    // Get the discovery system prompt
    const systemPrompt = getDiscoveryPrompt(settings.prompts.discovery);

    // Add context about the company
    const contextualizedPrompt = `${systemPrompt}

Current context:
- Company: ${companyName}
- Tagline: "${tagline}"

Remember to ask one question at a time and dig deeper when answers are generic.`;

    // Create streaming completion
    const stream = await client.createStreamingCompletion(
      contextualizedPrompt,
      messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }))
    );

    // Return a streaming response
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Send done signal
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            // Send the chunk as SSE
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: value })}\n\n`));
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
