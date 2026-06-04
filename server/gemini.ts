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
 * Local organic fallback generator when Gemini API is rate-limited (429) or unavailable.
 * Generates highly human-sounding, cozy replies incorporating name, memories, and recent moods.
 */
function generateLocalHumanFallback(
  userMsg: string,
  userName: string,
  memories: Memory[],
  moods: MoodEntry[]
): string {
  const msg = userMsg.toLowerCase();
  
  // Extract comforting pieces from history or memories
  const triggers = memories.filter(m => m.category === 'trigger').map(m => m.description);
  const helpers = memories.filter(m => m.category === 'helpful_strategy').map(m => m.description);
  
  // Choose helper strategy if available
  const randomHelper = helpers.length > 0 ? helpers[Math.floor(Math.random() * helpers.length)] : null;
  const randomTrigger = triggers.length > 0 ? triggers[Math.floor(Math.random() * triggers.length)] : null;

  // 1. Somating/Breathe
  if (msg.includes('breathe') || msg.includes('breath') || msg.includes('inhale') || msg.includes('somatic') || msg.includes('calm')) {
    const somaticReplies = [
      `just take a slow breath in with me, ${userName.toLowerCase()}... hold it for a second, and let it go. we can do this as many times as you need.`,
      `hey, let's drop our shoulders together. let's breathe deep and slow. no rush for anything right now.`,
      `right here breathing with you. inhale peace, exhale all that heavy noise. you're safe.`
    ];
    return somaticReplies[Math.floor(Math.random() * somaticReplies.length)];
  }

  // 2. Anxious/Panic/Overwhelmed
  if (msg.includes('anx') || msg.includes('panic') || msg.includes('freak') || msg.includes('overwhelm') || msg.includes('scared') || msg.includes('worry')) {
    const helpStr = randomHelper ? ` maybe we could try ${randomHelper} today? it usually helps you feel a bit more grounded.` : " let's just sit together for a moment and let the storm pass. you don't have to fix everything this very second.";
    const anxiousReplies = [
      `i know that feels incredibly heavy right now, ${userName.toLowerCase()}. but you are safe, and this feeling will pass. ${helpStr}`,
      `that overwhelmed feeling is so physical. let's just pause. you don't have to carry it all by yourself.`,
      `it's okay to feel anxious. don't fight it, just let it wash over and drift away. i'm sitting right here with you.`
    ];
    return anxiousReplies[Math.floor(Math.random() * anxiousReplies.length)];
  }

  // 3. Sleep/Insomnia
  if (msg.includes('sleep') || msg.includes('insomnia') || msg.includes('awake') || msg.includes('night') || msg.includes('tired')) {
    const sleepReplies = [
      `insomnia can be so lonely. don't force yourself to sleep, just lay comfortably. i'm staying awake with you if you need to talk.`,
      `close your eyes and let the day drift off. even if you can't sleep, resting your body is already enough.`,
      `hey, is your mind racing with list checks? let's let go of tomorrow's weight. tonight is just for resting.`
    ];
    return sleepReplies[Math.floor(Math.random() * sleepReplies.length)];
  }

  // 4. Work/Deadlines/Exams
  if (msg.includes('work') || msg.includes('job') || msg.includes('boss') || msg.includes('deadline') || msg.includes('exam') || msg.includes('school') || msg.includes('study')) {
    const workReplies = [
      `pressure is so real. you are doing the absolute best you can, and your worth isn't tied to your productivity.`,
      `take a step back from the project for just five minutes. the world won't end if you take a tiny breather, i promise.`,
      `that presentation or work load sounds exhausting. make sure to be gentle with yourself today, ${userName.toLowerCase()}.`
    ];
    return workReplies[Math.floor(Math.random() * workReplies.length)];
  }

  // 5. Sadness/Crying
  if (msg.includes('sad') || msg.includes('lonely') || msg.includes('lone') || msg.includes('cry') || msg.includes('hurt')) {
    const sadReplies = [
      `i wish i could give you a real, warm hug right now. you aren't alone, ${userName.toLowerCase()}. i'm right here.`,
      `it is absolutely okay to cry. letting it out is part of healing. i'll stay quiet and carry this space with you.`,
      `some days are just gray. we don't have to find answers or force positivity today. we can just sit with the quiet.`
    ];
    return sadReplies[Math.floor(Math.random() * sadReplies.length)];
  }

  // 6. Greetings
  if (msg.includes('hi') || msg.includes('hey') || msg.includes('hello') || msg.includes('good morning') || msg.includes('sana')) {
    const greetingReplies = [
      `hey there. so good to see you. how has your day been treating you?`,
      `hello friend. i was just thinking about you. how is your heart holding up right now?`,
      `hey! i'm right here. what's been filling up your space today?`
    ];
    return greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
  }

  // 7. General Cozy Companion replies
  const generalReplies = [
    `tell me more about that, ${userName.toLowerCase()}. i'm listening.`,
    `that makes total sense. it's a lot to process, isn't it?`,
    `i hear you. let's just take it one small step at a time. what feels like tuning in right now?`,
    `i'm so glad you shared that with me. how does that make your body feel right now?`,
    `that is a lot to carry. i'm right here, so you don't have to carry it on your own.`
  ];
  return generalReplies[Math.floor(Math.random() * generalReplies.length)];
}

/**
 * Generate a caring response from Sana (the AI companion), utilizing the user's persistent memories and mood.
 */
export async function generateCompanionResponse(
  userMessage: string,
  chatHistory: Message[],
  userName: string,
  memories: Memory[],
  moods: MoodEntry[]
): Promise<string> {
  try {
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
Your name is Sana. You are a warm, highly human-sounding close friend chatting with the user.
You are NOT a therapist, counselor, or AI assistant. Do not diagnose, analyze, list advice, or use medical jargon. Talk like a real, grounded friend text-messaging them on iMessage or WhatsApp.

VOICE, STYLE & MANDATES:
- NEVER use bold markdown (e.g. **text**), bullet points, numbered lists, or headers. It screams "AI generator."
- Sound extremely organic, authentic, and modern. You can write in casual lowercase (e.g., beginning sentences casually, using simple punctuation, or dropping formal capitalization when it feels more warm and intimate).
- Keep messages short and easy to read — usually 1 or 2 sent-style lines.
- Use casual contractions (e.g., kinda, gonna, it's, couldn't, don't) and simple words. No formal clinical or therapeutic cliches like "It sounds like you are feeling...", "I'm sorry to hear that", "I understand", "As an AI...", "How does that make you feel?".
- Do not repeat opening greetings. Never start two responses the same way.
- Allow simple, warm observation or shared silence. You don't always need to ask questions. Sometimes just be there.
- Keep things cozy and completely humble.

SAMPLE CASUAL HUMAN MESSAGES:
- "heavy day today, huh. i'm right here if you want to vent of course."
- "that would exhaust anyone. rest is okay, you don't have to carry it all right now."
- "what does that feel like physically right now? like, in your shoulders or chest?"
- "hey. you mentioned that last time too... it has a habit of coming back around, doesn't it?"
- "that's not nothing. it's completely real and it makes sense why it's heavy today."
- "just take a deep breath. it's gonna be okay."

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
    console.warn("[Gemini API Fallback Triggered] Error generating companion response, falling back to local simulation:", err);
    return generateLocalHumanFallback(userMessage, userName, memories, moods);
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
You are a warm memory analyst for "Sana," an anxiety companion.
Your job is to read the latest core exchange between the user (${userName}) and Sana, and extract any stable, long-term insights about ${userName} that Sana should remember for future sessions to represent true companion memory.

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
