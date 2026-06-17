This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Firebase

The app uses Firebase Auth with email/password accounts and Realtime Database groups.

Required setup:

- Enable **Authentication > Sign-in method > Email/Password** in Firebase.
- Keep the existing `NEXT_PUBLIC_FIREBASE_*` variables in `.env`.
- Publish `database.rules.json` to Realtime Database rules.

Shared timers are stored under:

```text
groups/{groupId}/timers/{cityName}/{timerName}
```

Users can create a group, copy the invitation link, and another logged-in user can join with `?invite={groupId}`.

Transportista calls are stored under:

```text
groups/{groupId}/transportista/events
groups/{groupId}/transportista/agents
```

## Transportista Agent

The local agent watches the SAMP chatlog and sends valid transportista calls to Firebase.

Desktop app for friends:

```bash
bun run transportista:desktop:build
```

This generates:

```text
dist\Transportista-Agent.exe
```

That `.exe` is portable. Friends can open it normally, configure email/password/group once, press **Iniciar**, and leave it running in the Windows tray. Closing the window hides it; use the tray icon to open, stop, start, or exit.

CLI setup on each PC:

1. Copy `agent/transportista-agent.config.example.json` to `agent/transportista-agent.config.json`.
2. Fill `groupId`, `auth.email` and `auth.password`.
3. Leave `chatlogPath` empty unless the SAMP folder is not in the user's Documents folder.
4. Run:

```bash
bun run transportista:agent
```

The agent resolves the default chatlog path from the current Windows user:

```text
<Documents>\GTA San Andreas User Files\SAMP\chatlog.txt
```

It accepts calls only when the interval from the previous accepted call is realistic. Defaults:

```text
minIntervalMs = 285000  # 4:45
maxIntervalMs = 325000  # 5:25
fallbackIntervalMs = 306000  # 5:06 from the old transportista.ini
```

Each desktop agent writes its own heartbeat under `transportista/agents`, so the web can show how many PCs are online. Calls are saved with a deterministic ID based on the chatlog timestamp, so if several agents detect the same call they update the same event instead of creating duplicates.

Intervals outside that window are discarded and only reflected in the agent status as the last rejected detection.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
