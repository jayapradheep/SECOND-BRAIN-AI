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
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = "https://gen.pollinations.ai";

if (!POLLINATIONS_KEY) {
  console.warn("⚠️  POLLINATIONS_API_KEY is not set in .env — requests may fail or be rate-limited.");
}

// ---------- CHAT ----------
// Uses Groq's free API (console.groq.com) — genuinely free, no billing surprises.
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = "openai/gpt-oss-120b" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not set on the server." });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model, messages }),
    });

    const rawText = await response.text();
    console.log("Groq raw response:", rawText);

    if (!response.ok) {
      console.error("Groq chat API error:", response.status, rawText);
      return res.status(response.status).json({ error: rawText });
    }

    const data = JSON.parse(rawText);
    res.json(data);
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat generation failed: " + err.message });
  }
});

// ---------- IMAGE ----------
// Two providers:
// - "flux" (default) uses the free, keyless Pollinations endpoint — unlimited, no key needed.
// - "openai" uses OpenAI's gpt-image-1 model — needs OPENAI_API_KEY, paid per image but reliable.
app.post("/api/image", async (req, res) => {
  try {
    const { prompt, model = "flux", width = 1024, height = 1024 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    // --- OpenAI provider ---
    if (model === "openai") {
      if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server." });
      }

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
          n: 1,
        }),
      });

      const rawText = await response.text();
      console.log("OpenAI image raw response (truncated):", rawText.slice(0, 300));

      if (!response.ok) {
        console.error("OpenAI image API error:", response.status, rawText);
        return res.status(response.status).json({ error: rawText });
      }

      const data = JSON.parse(rawText);
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) {
        return res.status(500).json({ error: "OpenAI response did not contain an image: " + rawText.slice(0, 200) });
      }

      res.set("Content-Type", "image/png");
      res.send(Buffer.from(b64, "base64"));
      return;
    }

    // --- Free Pollinations provider (default) ---
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&width=${width}&height=${height}&nologo=true`;

    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Pollinations image API error:", response.status, errText);
      return res.status(response.status).json({ error: errText });
    }

    const buffer = await response.arrayBuffer();
    res.set("Content-Type", "image/jpeg");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Image error:", err);
    res.status(500).json({ error: "Image generation failed: " + err.message });
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
