import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { generateCompanionResponse, extractNewMemories } from './server/gemini';
import { Message } from './src/types';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB on cold start
  await db.init();

  app.use(express.json());

  // API routes
  app.get('/api/companion/state', async (req, res) => {
    try {
      const state = await db.getState();
      res.json(state);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/companion/onboard', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }
      const profile = await db.updateProfile({
        name: name.trim(),
        onboardingCompleted: true,
      });

      // Insert a warm introductory message from Willow
      const initialMessage: Message = {
        id: 'msg_init_' + Date.now(),
        role: 'model',
        content: `Hi ${name.trim()}, it's so comforting to meet you. I'm Willow. I'm right here beside you. Here, you don't have to carry your stress or anxieties on your own. Whatever you choose to tell me, I'll hold onto it so we can talk through things at your pace. How is your heart doing today?`,
        timestamp: new Date().toISOString()
      };
      await db.addMessage(initialMessage);

      res.json({ success: true, profile });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/companion/chat', async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Content is required' });
      }

      const state = await db.getState();
      const userName = state.profile.name;

      // 1. Save user's message
      const userMsg: Message = {
        id: 'msg_u_' + Date.now(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString()
      };
      await db.addMessage(userMsg);

      // 2. Query Gemini Companion Response
      let replyText = '';
      try {
        const history = await db.getMessages();
        replyText = await generateCompanionResponse(
          content,
          history.slice(0, -1), // Exclude the newly added user message to avoid duplicate inside model generator
          userName,
          state.memories,
          state.moodHistory
        );
      } catch (gemError: any) {
        console.error("Gemini Response Generation Error:", gemError);
        replyText = "I'm so sorry, my thoughts got a bit clouded. But I'm still right here, breathing with you. Let's take a slow breath together.";
      }

      // 3. Save model reply message
      const modelMsg: Message = {
        id: 'msg_m_' + Date.now(),
        role: 'model',
        content: replyText,
        timestamp: new Date().toISOString()
      };
      await db.addMessage(modelMsg);

      // 4. Background Memory extraction and persistence
      let newlyExtracted: any[] = [];
      try {
        newlyExtracted = await extractNewMemories(content, replyText, userName);
        for (const nm of newlyExtracted) {
          await db.addMemory({
            category: nm.category,
            description: nm.description,
          });
        }
      } catch (memError) {
        console.warn("Skipped memory extraction background loop:", memError);
      }

      // Fetch refreshed full state to return
      const updatedState = await db.getState();
      res.json({
        success: true,
        reply: modelMsg,
        newMemoriesCount: newlyExtracted.length,
        newMemories: newlyExtracted,
        state: updatedState
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/companion/mood', async (req, res) => {
    try {
      const { score, notes, triggers } = req.body;
      if (typeof score !== 'number' || score < 1 || score > 5) {
        return res.status(400).json({ error: 'Valid mood score (1-5) is required' });
      }

      const moodEntry = await db.addMood(score, notes || '', triggers || []);
      
      // Auto-add triggers to user memories if described in notes
      if (notes && notes.trim() !== '') {
        const state = await db.getState();
        try {
          const extracted = await extractNewMemories(`I checked in my mood with score ${score}. Notes: ${notes}`, `I see. Checking in details`, state.profile.name);
          for (const nm of extracted) {
            await db.addMemory({
              category: nm.category,
              description: nm.description,
            });
          }
        } catch (err) {
          console.warn("Could not auto-extract memories from mood notes", err);
        }
      }

      const updatedState = await db.getState();
      res.json({ success: true, moodEntry, state: updatedState });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/companion/memories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await db.deleteMemory(id);
      if (!success) {
        return res.status(404).json({ error: 'Memory node not found' });
      }
      const updatedState = await db.getState();
      res.json({ success: true, state: updatedState });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/companion/reset', async (req, res) => {
    try {
      await db.resetAll();
      const state = await db.getState();
      res.json({ success: true, state });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration for Assets and Dev Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Dev Server listending on http://localhost:${PORT}`);
  });
}

startServer();
