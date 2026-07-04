# 🎬 Director.ai
> **A Jigar Corporation Pvt Ltd Technology** 🚀

Director.ai is a highly interactive, dual-AI storytelling web application designed to feel alive, organic, and crafted with genuine soul. No generic AI slop. Just pure, cinematic narrative generation.

## 🔥 The Philosophy
We believe AI shouldn't just be a chatbot; it should be an engine for raw creativity. Director.ai orchestrates two distinct AI agents, each representing a unique Character POV, battling it out in a rapid back-and-forth storytelling duel. You, the Director, orchestrate the scene, inject prompts mid-flow, and compile the final masterpiece.

## ✨ Elite Features
- **100% Client-Side Architecture**: No backend. No server costs. Your browser is the engine.
- **BYOK (Bring Your Own Key)**: Total privacy. You provide your own Gemini API keys.
- **Dual-API Load Balancing**: Seamlessly split API rate limits across two provided keys.
- **Character Vault & AI Polish**: Save characters and let the AI rewrite your raw notes into textured profiles.
- **Cinematic Micro-Animations**: Built with Framer Motion and bespoke Vanilla CSS.
- **Live Injection**: Pause the AI. Inject a prompt. Alter the timeline instantly.
- **Bulletproof Auto-Save**: Powered by IndexedDB. Your story survives tab crashes and refreshes.
- **The "Clean Story" Compiler**: Uses `gemini-3.1-pro-preview` to rewrite the raw timeline into a standalone interactive HTML masterpiece.
- **Uncensored Image Generation**: Seamless gallery integration using Pollinations.ai (with Gemini fallback).

## 🛠️ Tech Stack
- **Framework**: React + Vite (TypeScript)
- **Styling**: Pure, artisanal Vanilla CSS (Zero utility slop)
- **State/Storage**: IndexedDB (`idb` wrapper)
- **Animations**: Framer Motion
- **AI Engine**: Google Gemini API (`gemini-3.5-flash` & `gemini-3.1-pro-preview`)

## 🚀 Setup & Deployment
This project is engineered to deploy effortlessly on GitHub Pages.

### 1. Local Development
Make sure you have Node.js installed.
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. GitHub Pages Deployment (using \`gh\` CLI)
Since this is a fully static client-side app, you can host it for free on GitHub Pages.

1. Build the project:
   ```bash
   npm run build
   ```
2. Create a new repository using the GitHub CLI:
   ```bash
   gh repo create director-ai --public --source=. --remote=origin
   ```
3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit from Jigar Corp"
   git push -u origin main
   ```
4. Deploy to `gh-pages` (We recommend using the `gh-pages` npm package):
   ```bash
   npm install -g gh-pages
   gh-pages -d dist
   ```

*Enjoy the ultimate storytelling experience. Welcome to the future.*
