# Finish remaining SEO findings

## Skip
- **Drug-interactions guide** (`agent_content:semrush_content_suggestions`) — leave as-is per your request. I can revisit later if you want a `/guides/drug-interactions` content page.

## Connect Google Search Console

1. **Link the connector** — call `standard_connectors--connect` with `connector_id: "google_search_console"`. You authorize the Google account whose Search Console should own the property. This injects `GOOGLE_SEARCH_CONSOLE_API_KEY` into the project.
2. **Request a META verification token** from Google for `https://me-otc-trade.lovable.app/`.
3. **Add the meta tag** to `src/routes/__root.tsx` `head().meta` array:
   ```
   { name: "google-site-verification", content: "<token from step 2>" }
   ```
4. **Publish** the project so the tag is server-rendered on the live origin (required — Google fetches the raw HTML).
5. **Verify** by calling Google's `siteVerification/v1/webResource?verificationMethod=META`.
6. **Add the site** to your Search Console property list via `PUT /webmasters/v3/sites/<encoded-url>`.
7. **Submit the sitemap** `https://me-otc-trade.lovable.app/sitemap.xml` via `PUT /webmasters/v3/sites/<encoded-url>/sitemaps/<encoded-sitemap-url>`.
8. **Mark the `gsc:gsc` finding fixed.**

## What you'll need to do
- Approve the connector OAuth flow when prompted.
- Click **Publish** after step 3 so the verification tag is live before I call verify.

## Out of scope
- The drug-interactions content guide.
- Any custom-domain setup — uses the existing `me-otc-trade.lovable.app` domain.
