# Trying NutriTrace locally

Two ways to run it on your own machine, then an optional script that fills
it with sample data so the Diary, Statistics and Goals pages have
something to show.

## Option A: Docker (quickest)

Uses the published image, which is the same v1.4.0 code as this repo.

```bash
docker run -d --name nutritrace-demo -p 3001:3001 \
  -e JWT_SECRET="$(openssl rand -base64 48)" \
  -e INSECURE_COOKIES=1 \
  -v nutritrace-demo:/data \
  ghcr.io/traceapps/nutritrace:latest
```

Open http://localhost:3001 and create an account in the first-run wizard.

`INSECURE_COOKIES=1` lets the login cookie work over plain `http://`.
Leave it out when you put the app behind HTTPS.

To build an image from this repo instead: `docker build -t nutritrace .`,
then use `nutritrace` in place of the image name above.

To remove it when you're done: `docker rm -f nutritrace-demo && docker volume rm nutritrace-demo`.

## Option B: From source (Node 20+)

```bash
npm install
npm run build                  # builds the Svelte frontend into dist/
cd server
npm install
ln -s ../dist dist             # the server serves the frontend from server/dist
DB_PATH=./data/nutritrace.db UPLOADS_PATH=./data/uploads \
  JWT_SECRET="$(openssl rand -base64 48)" INSECURE_COOKIES=1 \
  node index.js
```

Open http://localhost:3001.

For frontend hot reload, keep the server running and run `npm run dev` in
the repo root. Vite serves the app on http://localhost:5173 and sends
`/api` calls to the server on port 3001.

## Sample data

After you've created your account in the wizard:

```bash
NT_USER=yourname NT_PASS='your password' node demo/seed.mjs
```

This adds 14 foods and two weeks of diary days, with meals, water and
weigh-ins. Run it once; a second run adds everything again. Set `NT_URL`
if the server isn't on `http://localhost:3001`.

## Things to try

- **Diary:** add foods to a meal; the lightning button quick-adds calories.
- **Foods:** search Open Food Facts or USDA, scan a barcode, build a recipe.
- **Goals:** set calorie and macro targets, or turn on Adaptive TDEE.
- **Statistics:** charts for any nutrient or body measurement.
- **Settings → AI Assistant:** add a Claude, OpenAI or Gemini key to chat
  with your diary.
- **Settings → API Tokens:** create a token for the REST API (`/api/v1/*`,
  off until you set `PUBLIC_API_ENABLED=1`; see
  [docs/public-api.md](../docs/public-api.md)) or the MCP endpoint
  (`MCP_ENABLED=1`).
