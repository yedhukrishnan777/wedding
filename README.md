# Sanjay & Namitha — wedding invitation website

One homepage and eight independent invitation pages, each with its own link, photos,
map, RSVP and WhatsApp preview. Everything is editable from a password-protected admin panel.

| Page | Link |
|---|---|
| Homepage | `/` |
| Orappeeru | `/orappeeru` |
| Engagement | `/engagement` |
| Haldi | `/haldi` |
| Namitha's Madhuram | `/n-madhuram` |
| Sanjay's Madhuram | `/s-madhuram` |
| Kalyanam (wedding) | `/kalyanam` |
| Cocktail | `/cocktail` |
| Cocktail Party | `/cocktail-party` |
| Admin panel | `/admin` |

## 1. Run it on your computer

You need [Node.js 20 or newer](https://nodejs.org).

```bash
npm install
cp .env.example .env      # then open .env and set ADMIN_PASSWORD
npm start
```

Open http://localhost:3000 and http://localhost:3000/admin.
If you skip the `.env` step the admin password is `change-me` (the admin panel will nag you to change it).

The database (`data/wedding.db`) and uploaded photos (`data/uploads/`) are created on first start.
**Back up the `data` folder** — it holds every RSVP and every photo you upload.

## 2. Using the admin panel (`/admin`)

- **Invitations** — every link with *Copy link* and *WhatsApp* buttons, plus RSVP counts. *Edit* changes the
  date, time, venue, address, map, invitation message, colour theme and whether RSVPs are open.
- **RSVPs** — replies per celebration, total people expected, and a spreadsheet (CSV) download.
- **Photos** — every image has a name (e.g. *Engagement Cover*, *Couple Photograph*). Upload a replacement and it is
  resized and cropped into the same frame automatically. *Focus* chooses which part stays in view.
  Galleries accept many photos at once; tick *Replace the sample photos* the first time.
- **Homepage & music** — names, family details, story, welcome text, wedding date, background music,
  your website address, and privacy options.

### Things still to confirm (shown as "to be announced" until you fill them in)

- **Times** for every celebration.
- **Chakolas** (Orappeeru and Cocktail): there are two Chakolas venues in Kochi. The map search is pre-filled with
  Chakolas Pavilion Convention Centre, North Kalamassery, but the map is switched **off** until you confirm.
- **Chilavanoor** (Haldi): a neighbourhood, so an exact address is needed.
- **Alpha** (Namitha's Madhuram) and **Artistry – Wudap** (Sanjay's Madhuram): full name and address needed.
- **The Lake Manor** (Engagement): map is on, pointing at The Lake Manor resort, Panangad — please double-check.
- **Cocktail Party**: date, time and venue.
- **Family names**, and anything personal about the couple.

To switch a map on: *Invitations → Edit →* fill in the address (or paste a Google Maps share link) *→* tick
*Show the map* *→ Save*, then use *Check this location on Google Maps* to verify the pin.

## 3. Publish it online

The site needs a host that runs Node.js **with a persistent disk** (for the database and photos).
Static hosts such as Netlify or GitHub Pages will not work, and Vercel has no persistent disk.

### Option A — Render.com (simplest)

1. Put this folder in a GitHub repository (private is fine).
2. On Render choose **New → Blueprint** and select the repository. `render.yaml` sets everything up,
   including a 1 GB disk mounted at `/var/data`.
3. When asked, enter an `ADMIN_PASSWORD`.
4. After the first deploy your site is live at `https://<name>.onrender.com`.

A persistent disk requires a paid Render plan; check Render's current pricing.

### Option B — Railway, Fly.io or any Docker host

Use the included `Dockerfile`. Attach a volume at `/var/data` and set `ADMIN_PASSWORD` and `SESSION_SECRET`.

### Option C — your own server (VPS)

```bash
npm ci --omit=dev
ADMIN_PASSWORD=... SESSION_SECRET=... DATA_DIR=/var/www/wedding-data PORT=3000 node server.js
```

Run it under `pm2` or `systemd`, and put Nginx or Caddy in front for HTTPS.

## 4. Connect a custom domain

1. Buy the domain (e.g. from GoDaddy, Namecheap or Cloudflare).
2. In your host's dashboard add the custom domain (Render: *Settings → Custom Domains*).
3. At your domain registrar add the DNS record the host shows you (usually a `CNAME` for `www`
   and an `A`/`ALIAS` record for the bare domain). HTTPS certificates are issued automatically.
4. In the admin panel open **Homepage & music → Website address** and enter `https://www.yourdomain.com`.
   This makes copied links and WhatsApp previews use the new address.

## 5. Sharing invitations on WhatsApp

1. Log in to `/admin` on your phone.
2. Next to the celebration tap **WhatsApp** (or **Copy link** and paste it into a chat).
3. Send each guest only the links for the celebrations they are invited to, for example
   `https://www.yourdomain.com/engagement` and `https://www.yourdomain.com/kalyanam`.

Good to know:

- Wait a second after pasting for the preview card (title, photo, description) to appear before sending.
- WhatsApp remembers previews. If you change a cover photo after sharing a link, the old preview may show for a
  while. Adding `?v=2` to the end of the link forces a fresh preview.
- By default each invitation does **not** link to the homepage, so guests only see what you send them.
  The homepage lists all eight celebrations — share it only with guests invited to everything.
- The site is hidden from search engines by default (changeable in the admin panel).

## 6. Photos, music and artwork — what is what

- **Sample photographs** are loaded from Pexels and Unsplash (free licences). Replace them in **Photos**.
  A few sample slots use illustrations because no suitable free photograph was available
  (venues, Madhuram sweets, Cocktail Party cover).
- **Illustrations and florals** in `public/img` were drawn for this site. `tools/gen_art.py` regenerates them.
- **Music**: `public/audio/romance.mp3` is an original piano piece generated for this site
  (`tools/gen_music.py`), so there are no copyright restrictions. Upload your own track in the admin panel
  if you prefer — only use music you have the rights to.
- **Fonts**: Pinyon Script and Cormorant Garamond (SIL Open Font License), stored in `public/fonts`.

## 7. Project layout

```
server.js            public pages + RSVP API
src/seed.js          starting content (events, texts, sample photos)
src/db.js            SQLite database
src/admin.js         admin panel, uploads, image processing
src/helpers.js       dates, maps, image helpers
views/               page templates (home, event, admin)
public/              styles, script, fonts, artwork, music
data/                created at runtime: database + uploads (back this up)
```

Editing `src/seed.js` only affects a brand-new database; once the site has started, make changes in the admin panel.
