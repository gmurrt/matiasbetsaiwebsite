# Matias AI - Smarter Bets, Bigger Wins

A Next.js application with Firebase backend for AI-powered betting predictions and tracking.

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your API keys and configuration:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

   # OpenAI Configuration
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key

   # The Odds API Configuration
   NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Modern, responsive landing page
- Firebase authentication
- Real-time data updates
- AI-powered betting predictions
- Bet tracking and analytics

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Firebase (Authentication, Firestore)
- React
- OpenAI API
- The Odds API

## Project Structure

```
src/
  ├── app/              # Next.js app directory
  ├── components/       # Reusable components
  ├── lib/             # Utility functions and Firebase config
  └── styles/          # Global styles
```

## API Keys and Security

This application requires several API keys to function:

1. **Firebase Configuration**: Create a new project in the [Firebase Console](https://console.firebase.google.com/) and get your configuration details.
2. **OpenAI API Key**: Sign up for an API key at [OpenAI](https://platform.openai.com/).
3. **The Odds API Key**: Get your API key from [The Odds API](https://the-odds-api.com/).

Never commit API keys or sensitive information directly in your code. Always use environment variables.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
