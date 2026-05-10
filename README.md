# DentAR — AR-Enhanced Dental Education Platform

A cross-platform mobile learning application for dental students that combines
interactive 3D dental models, augmented reality (AR) placement, AI-generated
quizzes, and an AI tutoring chatbot.

## Features

### Student
- Login & registration with name and roll number
- Study Topics — browse all faculty-uploaded materials (PDF, PPT, video, audio)
- 3D / AR Viewer — interactive 3D dental anatomy models with anatomical hotspots
- AR-in-room placement using Google Scene Viewer (Android)
- AI Chatbot (DentBot) for asking dental questions
- AI-generated quizzes (MCQ and True/False)
- Personal results history

### Faculty
- Upload lecture materials with Google Drive links
- Link 3D models to specific lectures
- Generate AI quizzes from lecture topics
- View full class reports with student averages
- Drill-down into individual student attempt details
- Remove students from the system

## Tech Stack

- **Frontend:** React Native (Expo)
- **Authentication:** Firebase Authentication
- **Database:** Cloud Firestore
- **AI:** NVIDIA LLM via OpenRouter (proxied through Cloudflare Worker)
- **3D / AR:** Google `<model-viewer>` web component, Scene Viewer for AR
- **Hosting (3D models):** Public GitHub repository

## Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI
- A Firebase project
- Android phone with Expo Go installed (for testing)

### Installation

```bash
git clone https://github.com/laiba-maqsood/dentar-app.git
cd dentar-app
npm install
```

### Configuration

1. Add your Firebase config in `app/services/firebase.js`
2. Place .glb dental models in `app/assets/models/`
3. Update `app.json` and `metro.config.js` to bundle .glb files

### Run

```bash
npx expo start -c
```

Scan the QR code with Expo Go on your phone.

## Architecture

See research paper for full system architecture diagram and detailed
implementation discussion.

## 3D Models

Dental .glb models are hosted in a separate public repository:
https://github.com/laiba-maqsood/dentar-models

Models curated from Sketchfab and Meshy.ai under Creative Commons Attribution
and CC0 licenses.

## Author

Laiba Maqsood — Department of Computer Science

## License

Educational use. Models retain their original CC licenses.