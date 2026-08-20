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
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = "openai" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${POLLINATIONS_KEY}`,
      },
      body: JSON.stringify({ model, messages }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Pollinations chat API error:", response.status, errText);
      return res.status(response.status).json({ error: errText });
    }

    const rawText = await response.text();
    console.log("Pollinations raw response:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      // API didn't return JSON — treat the raw text as the reply
      return res.json({ choices: [{ message: { content: rawText } }] });
    }

    res.json(data);
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat generation failed: " + err.message });
  }
});

// ---------- IMAGE ----------
app.post("/api/image", async (req, res) => {
  try {
    const { prompt, model = "flux", width = 1024, height = 1024 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${BASE_URL}/image/${encodedPrompt}?model=${model}&width=${width}&height=${height}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${POLLINATIONS_KEY}` },
    });

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
