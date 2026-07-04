<div align="center">

<a href="https://official-Arvind.github.io/director-ai/">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0b0c10,50:c5a880,100:191b21&height=220&section=header&text=Director.ai&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Dual-AI%20Storytelling%20Engine&descAlignY=58&descSize=22&animation=fadeIn" width="100%"/>
</a>

<br/>

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Outfit&weight=700&size=22&duration=3000&pause=800&color=C5A880&center=true&vCenter=true&multiline=false&width=700&lines=Zero-Backend+Architecture+%E2%9A%A1;Dual-AI+POV+Interactions+%F0%9F%8E%AD;Interactive+Story+Flow+%F0%9F%8C%B2;Built+by+Jigar+Corporation+%F0%9F%9A%80)](https://official-Arvind.github.io/director-ai/)

<br/>

<a href="https://official-Arvind.github.io/director-ai/">
  <img src="https://img.shields.io/badge/Status-Live%20Now-C5A880?style=for-the-badge&logo=rocket&logoColor=white" alt="Live Status"/>
</a>
<a href="https://github.com/official-Arvind/director-ai/stargazers">
  <img src="https://img.shields.io/github/stars/official-Arvind/director-ai?style=for-the-badge&logo=starship&logoColor=white&color=f7c948" alt="Stars"/>
</a>
&nbsp;
<a href="https://github.com/official-Arvind/director-ai/graphs/contributors">
  <img src="https://img.shields.io/github/contributors/official-Arvind/director-ai?style=for-the-badge&logo=handshake&logoColor=white&color=45a29e" alt="Contributors"/>
</a>

<br/><br/>

> **A highly interactive, zero-backend dual-AI storytelling web application powered by Gemini.**
> Built by Jigar Corporation Pvt Ltd.

<br/>
<a href="https://official-Arvind.github.io/director-ai/">
  <img src="https://img.shields.io/badge/Start_Directing-0b0c10?style=for-the-badge&logo=play&logoColor=white" alt="Start Directing" />
</a>

</div>

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=11,12,16&height=4&section=header" width="100%"/>
</div>

## 🔥 The Philosophy

We believe AI shouldn't just be a chatbot; it should be an engine for raw creativity. Director.ai orchestrates two distinct AI agents, each representing a unique Character POV, battling it out in a rapid back-and-forth storytelling duel. You, the Director, orchestrate the scene, inject prompts mid-flow, and compile the final masterpiece.

---

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=11,12,16&height=3&section=header" width="100%"/>
</div>

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

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

### ⚡ Architecture & UI
- **Framework**: React + Vite (TypeScript)
- **Styling**: Pure, artisanal Vanilla CSS (Zero utility slop)
- **Animations**: Framer Motion

</td>
<td width="50%" valign="top">

### 🧠 Core Engine
- **State/Storage**: IndexedDB (`idb` wrapper)
- **AI Engine**: Google Gemini API (`gemini-3.5-flash` & `gemini-3.1-pro-preview`)

</td>
</tr>
</table>

---

## 🚀 Setup & Deployment

This project is engineered to deploy effortlessly on GitHub Pages.

### 1. Local Development
Make sure you have Node.js installed.
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. GitHub Pages Deployment (using gh CLI)
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
4. Deploy to `gh-pages`:
   ```bash
   npx gh-pages -d dist
   ```

*Enjoy the ultimate storytelling experience. Welcome to the future.*
