# CIB Platform — Frontend

Web frontend for the CIB (Corporate Internet Banking) platform. Organizations onboard onto the
platform, invite their staff, open accounts and move money through a maker–approver workflow.

Built with React 19, Vite, Tailwind CSS, React Router and axios.

## Requirements

- Node.js 22 or newer
- The CIB backend API running (by default on `http://localhost:1990`)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 — you will be redirected to the login page.

## Configuration

The backend address is read from `VITE_API_URL`. To change it, copy `.env.example` to
`.env.local` and edit the value:

```bash
cp .env.example .env.local
```

If `VITE_API_URL` is not set, the app uses `http://localhost:1990`. Vite bakes this value into
the bundle at build time, so set it before running `npm run build` for a deployed environment.

## Scripts

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the development server with hot reload |
| `npm run build`        | Build for production into `dist/`            |
| `npm run preview`      | Serve the production build locally           |
| `npm run lint`         | Run ESLint                                   |
| `npm test`             | Run the tests once                           |
| `npm run test:watch`   | Run the tests and re-run on changes          |
| `npm run format`       | Format all files with Prettier               |
| `npm run format:check` | Check formatting without changing files      |

## Roles

| Role          | Can do                                                                            |
| ------------- | --------------------------------------------------------------------------------- |
| `SUPER_ADMIN` | Approve organizations, manage all organizations and users, manage currencies      |
| `ADMIN`       | Invite and manage users in their organization, manage accounts, view transactions |
| `MAKER`       | Initiate internal transfers, external payouts and external funding                |
| `APPROVER`    | Approve or reject pending transactions                                            |

Access is enforced on each route in `src/App.jsx` and reflected in the sidebar
(`src/components/Sidebar.jsx`). The backend must enforce the same rules — the frontend checks
only control what is shown.

## Project structure

```
src/
  api/axios.js          shared API client (base URL, auth header, logout on 401)
  context/AuthContext   login state, token validation on startup, 30-minute inactivity logout
  components/           layout, sidebar, top bar
  pages/                one file per screen
  pages/settings/       password and currency settings
```

## Authentication

On login the JWT and user details are stored in `localStorage` under `cib_user`. Every request
sends the token as a `Bearer` header. Any `401` response, or 30 minutes without activity, signs
the user out.

The session is shared by all open tabs. The time of the last activity is kept in `localStorage`
under `cib_last_active`, so working in one tab keeps every tab signed in. A session that has been
idle for 30 minutes is dropped when the app next opens, even if the browser was closed in between.
Signing out in one tab signs out all of them.

## Testing Paystack webhooks

Payouts stay pending until Paystack confirms them through a webhook to the backend's
`/webhook/paystack` endpoint. The backend checks the `x-paystack-signature` header on every
webhook, so they cannot be faked from the browser. To test end to end, use Paystack test mode and
point the test webhook URL at your local backend through a tunnel such as ngrok.

## Branches and CI

- `main` — stable branch
- `dev` — day-to-day development; open pull requests from here into `main`

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes and pull requests to both branches:
format check, lint, tests and build. All four must pass.
