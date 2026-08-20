# 🧠 SECOND BRAIN AI — Chat + Image + Video App

Ithu oru Node.js + Express backend, Pollinations.ai API vachu **chat, image, video** generate panna.

## Setup Steps

1. **Dependencies install pannunga:**
   ```
   npm install
   ```

2. **`.env` file create pannunga** (`.env.example` ah copy pannunga):
   ```
   cp .env.example .env
   ```
   Adhukku apparam `.env` file open panni, un Pollinations API key (sk_... nu start aagum) paste pannunga:
   ```
   POLLINATIONS_API_KEY=sk_your_actual_key_here
   PORT=3000
   ```

3. **Server run pannunga:**
   ```
   npm start
   ```

4. Browser la open pannunga:
   ```
   http://localhost:3000
   ```

## Structure

```
ai-app/
├── server.js          → Backend (Express) — chat/image/video API routes
├── package.json        → Dependencies
├── .env.example         → Template for your API key
└── public/
    └── index.html       → Frontend (Chat, Image, Video tabs)
```

## Important — API Key Safety

- `.env` file la key vecha, adha **never git la commit pannaadheenga**. `.gitignore` la `.env` add pannunga.
- Key frontend la (browser JS la) direct ah use pannaadheenga — namba backend (`server.js`) mattum key ah touch pannum, frontend adha paakadhu. Ithu already ippadi thaan set up pannirukom.

## Deployment (production ku)

Idha internet la live ah host panna venumna:
- **Render.com**, **Railway.app**, illa **Vercel** (backend functions) use pannalam — free tier irukku.
- Deploy pannina apparam, `POLLINATIONS_API_KEY` ah adha platform oda "Environment Variables" section la add pannunga (`.env` file mாதிரி).

## Notes

- **Video generation** konjam slow ah irukum (30 sec – few minutes), model quality/availability vary aagum (especially `veo` — adhu innum alpha stage).
- Chat model default ah `openai` vechirukom, veru models (`claude`, `gemini` etc.) use pannanumna `server.js` la `model` parameter change pannunga, illa frontend dropdown add pannunga.
