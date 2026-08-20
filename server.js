import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY;
const BASE_URL = "https://gen.pollinations.ai";

if (!POLLINATIONS_KEY) {
  console.warn("⚠️  POLLINATIONS_API_KEY is not set in .env — requests may fail or be rate-limited.");
}

// ---------- CHAT ----------
// Uses the simple GET endpoint (text.pollinations.ai/{prompt}) — a different
// route from the OpenAI-style POST endpoint, avoids account/key association issues.
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = "openai" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Build a single prompt string from the conversation history
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = conversationText || lastUserMessage?.content || "";
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://text.pollinations.ai/${encodedPrompt}?model=${model}`;

    const response = await fetch(url);
    const rawText = await response.text();
    console.log("Pollinations raw response:", rawText);

    if (!response.ok) {
      console.error("Pollinations chat API error:", response.status, rawText);
      return res.status(response.status).json({ error: rawText });
    }

    // This endpoint returns plain text, not JSON
    res.json({ choices: [{ message: { content: rawText } }] });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat generation failed: " + err.message });
  }
});

// ---------- IMAGE ----------
// Uses the free, keyless image endpoint (image.pollinations.ai) — Flux model, unlimited.
app.post("/api/image", async (req, res) => {
  try {
    const { prompt, model = "flux", width = 1024, height = 1024 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&width=${width}&height=${height}&nologo=true`;

    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const buffer = await response.arrayBuffer();
    res.set("Content-Type", "image/jpeg");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Image error:", err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

// ---------- VIDEO ----------
// Note: video generation still uses the paid gen.pollinations.ai endpoint and may
// require pollen balance on your account, unlike chat/image above.
app.post("/api/video", async (req, res) => {
  try {
    const { prompt, model = "seedance" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${BASE_URL}/video/${encodedPrompt}?model=${model}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${POLLINATIONS_KEY}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const buffer = await response.arrayBuffer();
    res.set("Content-Type", "video/mp4");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Video error:", err);
    res.status(500).json({ error: "Video generation failed (this can take a while, and the model may be in alpha)" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
