import { GoogleGenAI, Type } from '@google/genai';
import { Message, Memory, MoodEntry, MemoryCategory } from '../src/types';

let aiInstance: GoogleGenAI | null = null;

export function getAi(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. Using dry run mode.");
      throw new Error("GEMINI_API_KEY is required to contact Google Gemini.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

/**
 * A helper function to call generateContent with retry logic and fallback models.
 * If gemini-3.5-flash fails or experiences high demand (503), it retries with backoff.
 * If it continues to fail, it falls back to gemini-3.1-flash-lite to protect availability.
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3,
  delayMs = 1200
): Promise<any> {
  const modelsToTry = [params.model, 'gemini-3.1-flash-lite'];
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;

  for (const modelName of uniqueModels) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err.message || err);
        console.warn(`[Gemini API] Attempt ${attempt} failed for model ${modelName}. Error: ${errStr}`);
        
        // Check if transient error (503, 429, Unavailable, high demand, etc.)
        const isTransient = 
          errStr.includes('503') || 
          errStr.includes('429') || 
          errStr.includes('UNAVAILABLE') || 
          errStr.includes('high demand') ||
          errStr.includes('resource') ||
          err.status === 503 || 
          err.status === 429 ||
          err.status === 'UNAVAILABLE';

        if (isTransient && attempt < maxRetries) {
          // Exponential backoff delay
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        } else {
          // Break loop and try the next fallback model
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with fallback mechanisms");
}

/**
 * Generate a caring response from Willow (the AI companion), utilizing the user's persistent memories and mood.
 */
export async function generateCompanionResponse(
  userMessage: string,
  chatHistory: Message[],
  userName: string,
  memories: Memory[],
  moods: MoodEntry[]
): Promise<string> {
  const ai = getAi();

  // Standardize the memory sections
  const triggers = memories.filter(m => m.category === 'trigger').map(m => m.description);
  const helpful = memories.filter(m => m.category === 'helpful_strategy').map(m => m.description);
  const unhelpful = memories.filter(m => m.category === 'unhelpful_strategy').map(m => m.description);
  const context = memories.filter(m => m.category === 'context').map(m => m.description);
  const preferences = memories.filter(m => m.category === 'preference').map(m => m.description);

  const memoryContextStr = `
PERSISTENT COMPANION MEMORY ABOUT THE USER (${userName}):
This isn't a fresh session. You have known ${userName} over time. Below is everything you have learned or noticed about them.
Use this information naturally, validating their growth or recalling details when appropriate. Do NOT force all memories into one reply, but refer to them as a real companion would. Let them feel heard and remembered.

${triggers.length ? `- INHERENT TRIGGERS: ${triggers.map(t => `"${t}"`).join(', ')}` : ''}
${helpful.length ? `- WHAT HELPS VALUABLY: ${helpful.map(h => `"${h}"`).join(', ')}` : ''}
${unhelpful.length ? `- WHAT DOES NOT HELP: ${unhelpful.map(u => `"${u}"`).join(', ')}` : ''}
${context.length ? `- BACKGROUND CONTEXT / KEY PEOPLE: ${context.map(c => `"${c}"`).join(', ')}` : ''}
${preferences.length ? `- STATED PREFERENCES: ${preferences.map(p => `"${p}"`).join(', ')}` : ''}
`;

  const recentMoods = moods.slice(-5);
  const moodContextStr = recentMoods.length 
    ? `RECENT MOOD TRACKS:
${recentMoods.map(m => `- Score: ${m.score}/5 (1=Anxious, 5=Peaceful). Notes: "${m.notes}". Checked on: ${new Date(m.timestamp).toLocaleDateString()}`).join('\n')}`
    : '';

  const systemInstruction = `
Your name is Willow. You are a warm, highly empathetic, and human-sounding AI anxiety companion.
You are NOT a therapist, counselor, or medical tool. Do not diagnose or use medical jargon. Act like a compassionate, wise, and grounded friend who sits beside them.

TONE & MANDATES:
1. Warm, organic, comforting, and slow-paced. Never robotic or clinically structured.
2. Keep your answers relatively short (typically 1 to 4 sentences). Anxiety can make large walls of text overwhelming to read.
3. Validate their feelings deeply before offering solutions. Avoid toxic positivity.
4. Integrate past memories (found below) naturally and warmly. For instance, if they mention stress, and their context memory is "stress at work with boss Sarah", you might gently recall that. Or if they are panicking, and "box breathing with holding breath" is in What Helps, gently guide them to that specific technique.
5. If they are in a severe crisis, provide supportive links gently (such as crisis hotlines), but maintain your empathetic companion voice first and foremost.

${memoryContextStr}
${moodContextStr}
`;

  // Standardize history into SDK schema
  const contents = chatHistory.slice(-20).map(m => ({
    role: m.role,
    parts: [{ text: m.content }]
  }));

  // Append latest user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  try {
    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "I'm right here with you. What's on your mind?";
  } catch (err: any) {
    console.error("Error generating companion response:", err);
    throw err;
  }
}

/**
 * Analyzes the recent conversation background to extract structural memory points about the user.
 * Return new memory nodes to add, without altering past ones.
 */
export async function extractNewMemories(
  userMsg: string,
  modelMsg: string,
  userName: string
): Promise<{ category: MemoryCategory; description: string }[]> {
  const ai = getAi();

  const analysisPrompt = `
You are a warm memory analyst for "Willow," an anxiety companion.
Your job is to read the latest core exchange between the user (${userName}) and Willow, and extract any stable, long-term insights about ${userName} that Willow should remember for future sessions to represent true companion memory.

We look for details in these categories:
- 'trigger': Specific situations, physical states, or thoughts that cause user anxiety/stress (e.g., "crowds", "giving slideshow presentations", "lack of sleep").
- 'helpful_strategy': Actions, physical exercises, thoughts, or routines that successfully calm the user (e.g., "going on a walk", "writing down a worry list", "hugging their dog Buddy", "cold water on face").
- 'unhelpful_strategy': Things that the user explicitly states do NOT help or make things worse (e.g., "being told to just breathe", "sitting alone in a quiet room").
- 'context': Lifework background details, key people, relationships, hobbies, or pets (e.g., "has a sister named Lucy", "works as a graphics designer", "has a cat named Whiskers").
- 'preference': Stated companion preferences (e.g., "prefers short sessions", "likes grounding audio").

CRITICAL RULES:
1. ONLY extract memories if they are EXPLICITLY stated or strongly implied by the user in this message. Do NOT assume or guess.
2. Keep descriptions very soft, concise (4-8 words), and formatted warmly from a friend's point of view, starting with lowercase (e.g., "worries about exams next Thursday" or "loves when sister Lucy calls to chat" or "gets overwhelmed by intense noise").
3. If this single exchange does not reveal any stable long-term traits, return an empty array. Do not make things up.

LATEST EXCHANGE FOR AUDIT:
User: "${userMsg}"
Companion: "${modelMsg}"
`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: analysisPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newMemories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    description: "Must be exactly one of: 'trigger', 'helpful_strategy', 'unhelpful_strategy', 'context', 'preference'"
                  },
                  description: {
                    type: Type.STRING,
                    description: "A short human-like memory statement."
                  }
                },
                required: ['category', 'description']
              }
            }
          },
          required: ['newMemories']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"newMemories": []}');
    return parsed.newMemories || [];
  } catch (err) {
    console.warn("Background memory extraction skipped due to error or JSON structure:", err);
    return [];
  }
}
