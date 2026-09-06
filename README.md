# Developer site for Normann Games

```
/                     Normann Games home
/polarity/            the Polarity page
/privacy-policy.html  linked from the Play listing
/app-ads.txt          must stay at the domain root
```

Two files here are required, not optional:

- **`app-ads.txt`** — AdMob has required this for all new apps since January
  2025, and a missing or malformed file is one of the top five rejection
  reasons. It must sit at the **root** of your developer domain.
- **`privacy-policy.html`** — Google Play will not accept the store listing
  without a public privacy policy URL.

## Publish with GitHub Pages (free)

**The repo must be named `<your-username>.github.io`.** This is not a style
preference. `app-ads.txt` has to sit at the *root* of the domain, and only a
user site puts it there:

| Repo name | app-ads.txt ends up at | AdMob finds it |
|---|---|---|
| `Enorm512.github.io` | `enorm512.github.io/app-ads.txt` | yes |
| `polarity` | `enorm512.github.io/polarity/app-ads.txt` | **no** |

Create an empty repo named `<your-username>.github.io` on GitHub, then:

```bash
git init
git add -A
git commit -m "developer site"
git branch -M main
git remote add origin https://github.com/<you>/<you>.github.io.git
git push -u origin main
```

A user site publishes automatically — no Pages setting to change. It appears at
`https://<you>.github.io/` within a minute or two.

## Before it works

1. Replace `pub-0000000000000000` in `app-ads.txt` with your real AdMob
   publisher ID (AdMob → Settings → Account information).
2. Fill in your name and support email in `privacy-policy.html`.
3. Check the file is reachable: open
   `https://<you>.github.io/app-ads.txt` in a browser. It must return plain
   text at that exact path — not a 404, not an HTML error page, and not one
   directory down.

## The bit that catches people

The domain in your **Play Console store listing → Website field** must match
the domain hosting `app-ads.txt`. AdMob crawls the developer website listed on
your store entry — if those disagree, verification silently fails and you will
be left wondering why ads never serve.

A custom domain works too and is tidier — point it at the same repo and put the
domain in Play Console instead. `.no` domains are inexpensive. But a user site
is enough, and it is free.

Verification is not instant. AdMob re-crawls every 24 hours or so, and the
status shows under **AdMob → Apps → your app → App settings**.
