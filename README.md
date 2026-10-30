# Lemonade

Lemonade is a mobile-first school life sim. Students join with their own school email. Classmates who have not signed up are not in the app, not in the directory, and not targets for gifts, polls, crushes, or the overnight agent.

## Run it

```bash
npm install
npm run dev
```

Or `./start.sh`, which installs dependencies the first time and then starts the app.

`npm run dev` creates `.env` if needed, creates the SQLite database, loads fictional seed data, and opens Next.js at [http://localhost:3000](http://localhost:3000).

Sign-in is a one-time code. In local dev the code is printed in the terminal and listed at [http://localhost:3000/dev/mail](http://localhost:3000/dev/mail).

| Who | Email | What you'll see |
| --- | --- | --- |
| Alex Johnson | alex.johnson@lincoln.example | Daily summary, mutual crush with Emma, gifts, polls |
| Riley Quinn | riley.quinn@lincoln.example | Empty home. No friends and no feed yet |
| Avery Brooks | avery.brooks@roosevelt.example | Ambassador page for a school that is not live |
| Quinn Harper | quinn.harper@lincoln.example | Moderator queue, including the real sender of an anonymous gift |

Invite link for Alex: `http://localhost:3000/join/ALEX2026`

Reset the database:

```bash
npm run db:reset
```

## Overnight autopilot

Autopilot is opt-in. It runs only during a student's sleep window (default 22:00–07:00 UTC) and only mentions classmates who verified a school email and opted into the directory.

```bash
npm run autopilot                 # respect sleep windows
npm run autopilot -- --force     # dev: run now for every opted-in student
npm run autopilot -- --force --email=alex.johnson@lincoln.example
```

Signed-in dev sessions also have **Run autopilot now** on Settings. A scheduler can `POST /api/cron/autopilot` with header `x-cron-secret` (see `.env.example`). Body `{ "force": true }` skips the sleep window.

If `OPENAI_API_KEY` is set, event text is drafted by that OpenAI-compatible API. Any person who is not in the eligible classmate list is discarded. With no key, a deterministic rule list writes the events and uses avatar memory (art club, lunch, study, movies) to pick the scene.

## Tests

```bash
npm test
```

Covers school-email verification, the under-16 parent approval gate, romantic features, the spend cap, and the rule that people who have not joined and opted in cannot be gifted, polled, or mentioned by autopilot.

## Stack

Next.js, TypeScript, Tailwind, Prisma, SQLite. Gems and stars check out through a stub payment provider. No real charges.

## Consent rules baked in

- No rosters, scrapes, or purchased student data. Directory entries are verified, opted-in accounts.
- Under 16 requires a parent approve link before the profile is visible or autopilot can run.
- Crushes, romantic gifts, and Kiss are 16+. Younger students get a High Five instead.
- Anonymous gifts can be turned off. They are rate-limited, filtered, and visible to moderators with the real sender.
- Counts on school cards, the empty home, and invites are real joined students.
- Settings includes autopilot, memory, export, delete, and a daily spend cap (required under 16, max 80).
