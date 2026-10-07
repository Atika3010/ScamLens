# ScamLens 🔍

AI-powered scam checker for India. Paste or upload an SMS, WhatsApp message, UPI request or link, and ScamLens returns a **Safe / Suspicious / Scam** verdict with reasons and next steps.

**Live demo:** https://scamlens-sooty.vercel.app

## The Problem
Millions of people in India receive fake KYC messages, fake bijli bill alerts, lottery scams, fake job offers and malicious UPI links every day. Most people have no quick way to check whether a message is genuine.

## Features
- Check text messages or screenshots (SMS, WhatsApp, email)
- Clear verdict: Safe, Suspicious or Scam
- Plain-language reasons and recommended next steps
- Supports English, Hindi and Hinglish
- Live scam map showing scam types by city
- Privacy first: messages are never stored, only the scam type and city

## Tech Stack
- React, TypeScript, Vite, TanStack Start
- Gemini API for message analysis
- Supabase for the live scam map data
- Deployed on Vercel

## Run Locally
```bash
git clone https://github.com/Atika3010/ScamLens.git
cd ScamLens/scamlens
npm install
npm run dev
```

## Environment Variables
Create a `.env` file in the `scamlens` folder:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
GEMINI_API_KEY=your_gemini_api_key
```

## Team: Access Denied
Built at HACK-IEE Hackathon, IEE AMU.
- Atika (Team Leader)
- Saniya Ali
- Adeeba Ekbal

## License
MIT
