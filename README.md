# Skin Condition Analyzer

A mobile-first web application that uses camera capture, face detection, and lightweight on-device heuristics to estimate skin condition signals.

## Overview

Skin Condition Analyzer guides users through a camera-based scan flow and shows:
- Estimated skin type
- Oiliness
- Hydration
- Acne risk
- Dark spots
- Confidence score

The app is built for quick, practical guidance and trend tracking, not medical diagnosis.

## Core Features

- Mobile-first capture experience
- Front/back camera support
- Real-time face detection and alignment feedback
- Burst capture flow with good-shot counting
- Preview screen with captured shot summary
- Heuristic skin analysis pipeline
- Plain-language explanation of how results were derived
- Recommended routine by skin type
- Result sharing with app URL included
- Local scan history persistence

## How It Works

1. User opens scan flow and views optional tips.
2. Camera screen checks for a single face in frame.
3. Burst capture collects multiple valid face shots.
4. Best/stable frames are used for analysis.
5. Result page displays metrics and a simple explanation section.
6. Scan result is saved in local history.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- MediaPipe Face Detection (`@mediapipe/face_detection`)

## Project Structure

- `src/App.tsx`: app flow and screen state management
- `src/pages/`: screen-level UI (`Home`, `Camera`, `Preview`, `Results`, `History`, `ScanTips`)
- `src/components/`: reusable UI components
- `src/hooks/useCamera.ts`: camera stream and device handling
- `src/utils/faceDetection.ts`: MediaPipe face detection and face crop logic
- `src/utils/analyzeSkin.ts`: skin signal extraction and scoring pipeline
- `public/mediapipe/`: local MediaPipe runtime/model assets

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Scripts

- `npm run dev`: start development server
- `npm run build`: type-check and create production build
- `npm run lint`: run ESLint
- `npm run preview`: preview production build locally

## Deployment Notes

- Camera access requires HTTPS (or localhost in development).
- MediaPipe assets are served locally from `public/mediapipe` for better deployment reliability.

## Limitations

- This app does not provide medical diagnosis.
- Results can vary based on lighting, camera quality, motion blur, and framing.
- Product recommendations are generic routines and should be user-validated.
