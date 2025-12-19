/**
 * Jiva Auto-Reply Bot
 * Simple one-file setup
 * Only add your API key
 * Node.js 18+ required
 */

import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ================= CONFIG =================
const GEMINI_API_KEY = "AIzaSyDzaAU9hrAlpBfO-4uVlLFYrv9o74wCFA0"; // Add your API key here
const PORT = 3000;
const MODEL = "gemini-pro"; // Gemini AI model
// ==========================================

// Auto-reply endpoint
app.post("/message", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.json({ reply: "Message missing" });
    }

    // Call Gemini AI API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: [
            { text: userMessage }
          ]
        })
      }
    );

    const data = await response.json();

    // Extract reply
    const reply =
      data.candidates?.[0]?.content?.[0]?.text ||
      "Sorry, I couldn't reply.";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Error occurred while replying" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Jiva Auto-Reply Bot running on port ${PORT}`);
});