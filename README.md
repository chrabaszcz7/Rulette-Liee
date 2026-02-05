# Rulette Lie - Multiplayer Truth or Lie Game

A thrilling multiplayer Russian roulette game with truth and lie mechanics built with Next.js 14, Firebase, and modern web technologies.

## Features

- **Authentication**: Email/password authentication with Firebase Auth
- **User Profiles**: Custom nicknames with unique suffixes (e.g., `player#A1B2C`), avatar uploads, and stats tracking
- **Friends System**: Add friends by nickname, manage friend requests
- **Room System**: Create/join game rooms with shareable codes
- **Real-time Chat**: Live chat in game rooms
- **Russian Roulette Game**: 
  - Mission/Decision player roles
  - Truth/Lie mechanics
  - Elimination system with chamber-based roulette
- **Leaderboards**: Top 10 players by wins
- **Modern UI**: Discord-inspired design with glassmorphism and neon effects

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript (strict mode)
- TailwindCSS
- shadcn/ui components
- Framer Motion animations
- Zustand state management

### Backend (Firebase)
- Firebase Authentication
- Cloud Firestore (real-time database)
- Cloud Functions (game logic, cleanup)
- Cloud Storage (avatar images)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase CLI

### Installation

1. Clone the repository:
```bash
cd "rulette lie"
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install Cloud Functions dependencies:
```bash
cd functions
npm install
cd ..
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)

2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Storage
   - Cloud Functions

3. Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

4. Deploy Storage rules:
```bash
firebase deploy --only storage:rules
```

5. Deploy Cloud Functions:
```bash
firebase deploy --only functions
```

## Project Structure

```
rulette-lie/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   └── (dashboard)/       # Protected dashboard pages
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Layout components
│   │   └── game/              # Game-specific components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and Firebase config
│   ├── store/                 # Zustand stores
│   └── types/                 # TypeScript types
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       └── index.ts           # Cloud Functions code
├── firestore.rules            # Firestore security rules
├── storage.rules              # Storage security rules
└── firebase.json              # Firebase configuration
```

## Game Rules

1. **Roles**: Each round, one player becomes the Mission Player and another becomes the Decision Player.

2. **Mission**: The Mission Player receives a secret mission: TRUTH or LIE, along with a role badge emoji.

3. **Decision**: The Decision Player must guess whether the Mission Player is telling the truth or lying.

4. **Roulette**: 
   - Wrong guess? Decision Player faces the roulette
   - Right guess? Mission Player faces the roulette
   - If the chamber fires, the player is eliminated

5. **Win Condition**: Last player standing wins!

## Security

- Firestore Rules enforce:
  - Users can only edit their own profiles
  - Game outcomes can only be modified by Cloud Functions
  - Chat messages only writable by room members
  
- Cloud Functions handle:
  - Game state transitions
  - Roulette logic
  - Stats updates
  - Room cleanup

## Deployment

### Deploy to Vercel (Frontend)

1. Push to GitHub
2. Connect to Vercel
3. Deploy

### Deploy Firebase Services

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Environment Variables

The Firebase config is included in the code. For production, consider using environment variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## License

MIT
