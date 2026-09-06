# Web deploy — why dynamic routes needed their own rewrites

The Vercel deployment served every static route fine and **404'd every dynamic
one**. Found 2026-09-06 while trying to open a quest by URL.

| Path | Before | Why |
|---|---|---|
| `/journey`, `/legal/privacy`, `/quest/select` | 200 | A real file exists: `dist/journey.html` etc. |
| `/quest/q-w-05` | **404** | No file matches — the export writes `dist/quest/[id].html`, brackets and all |
| `/quest/run/<id>`, `/memory/<id>` | **404** | Same |
| `/nonexistent-path` | **404** | The catch-all rewrite was not firing either |

## What was wrong

`vercel.json` had one catch-all rewrite, `/(.*)` → `/index.html`, which should
have served the SPA shell for anything without a file and let the client router
take over. It never fired — even for a path with no file at all.

The likely reason is that it collided with `cleanUrls: true`, which strips
`.html` from served paths. With clean URLs on, `/index.html` is not a path the
deployment serves — `/` is — so the rewrite's *destination* pointed at something
that had itself been rewritten away.

## What it is now

Explicit rewrites, one per dynamic segment, pointing at the bracket files the
export actually produces:

```json
{ "source": "/quest/run/:id", "destination": "/quest/run/[id]" }
```

Order matters: `/quest/run/:id` has to come before `/quest/:id`, or "run" gets
captured as an id. Static routes need no entry — Vercel checks the filesystem
first, so `/quest/select` still resolves to its own file.

This is better than the catch-all even if the catch-all had worked. Each route
keeps its own pre-rendered HTML instead of every URL booting the same empty
shell, and a genuinely unknown path still 404s rather than loading the whole app
to say "not found".

**Unverified until the next deploy.** The cleanUrls collision is inferred from
the behaviour, not proven — Vercel's routing cannot be reproduced locally. If
dynamic routes still 404 after this deploys, the next thing to check is whether
the project's dashboard settings are overriding `vercel.json` at all.

## Scope: this never affected the Android app

Worth stating plainly, because a 404 looks alarming. Expo Router resolves routes
inside the app on native; nothing about the Android build goes through Vercel.
The two things that genuinely depend on this deployment — the privacy policy and
the account-deletion page, both of which Google requires as public URLs — are
static routes and were working throughout.

What was actually broken: sharing a link to a quest, and refreshing the browser
while on one.
