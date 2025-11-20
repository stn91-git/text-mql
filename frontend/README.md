# JusQuery Frontend

Modern Astro + React dashboard that mirrors the JusQuery/Perplexity UI, connects to the Text-to-MQL backend, and stores chats in the browser.

## Project Structure

```
frontend/
├── public/           # static assets
├── src/
│   ├── components/   # React UI (Sidebar, Chat, etc.)
│   ├── hooks/        # chat state & persistence
│   ├── lib/          # API helpers
│   └── pages/        # Astro routes
├── .env.example      # frontend env template
└── package.json
```

## Environment Variables

The frontend needs to know where the FastAPI backend is running. Astro exposes env vars prefixed with `PUBLIC_`.

1. Copy the template and adjust the base URL if needed:

   ```bash
   cd frontend
   cp .env.example .env
   # edit PUBLIC_API_BASE_URL if your backend is not at http://localhost:8000
   ```

2. Restart `pnpm dev` after changing `.env`.

## Scripts

| Command           | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `pnpm install`    | Install dependencies                        |
| `pnpm dev`        | Start Astro dev server (default :4321)      |
| `pnpm build`      | Production build to `dist/`                 |
| `pnpm preview`    | Preview the production build                |

## Backend Integration Notes

- The chat panel calls `POST /api/query` to get AI answers.
- The status chip requests `/health` every 30 s and shows MongoDB/OpenAI connectivity.
- The collections drawer uses `/api/collections` and `/api/schema/:collection`.
- Update `PUBLIC_API_BASE_URL` whenever the backend URL changes.

Run the FastAPI backend (see `/backend/README.md`) alongside the frontend for a full experience.
