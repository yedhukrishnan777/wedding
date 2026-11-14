require('./src/env'); // loads .env if present
const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const store = require('./src/db');
const h = require('./src/helpers');
const { eventName } = require('./src/seed');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(store.DATA_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.locals.UPLOADS_DIR = UPLOADS_DIR;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));
app.use(cookieParser());

// Shared template context
function baseUrl(req, site) {
  return (site.base_url || process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}
function ctx(req, extra = {}) {
  const site = store.getSite();
  const images = store.getImages();
  const img = (key) => images[key] || { url: '/img/placeholder.svg', position: 'center', aspect: '4/5', label: key };
  return { site, images, img, h, eventName, base: baseUrl(req, site), path: req.path, ...extra };
}
function eventView(e) {
  return {
    ...e,
    name: eventName(e),
    dateLabel: h.formatDate(e.date),
    parts: h.dayParts(e.date),
    timeLabel: h.formatTime(e.time),
    past: h.isPast(e.date),
    target: h.countdownTarget(e.date, e.time),
    hasMap: h.hasMap(e),
    embed: h.mapEmbed(e),
    directions: h.directionsUrl(e),
    mapsUrl: h.mapsUrl(e),
    rsvpOpen: !!e.rsvp_enabled && !h.isPast(e.date),
  };
}
app.locals.eventView = eventView;

// ---------- public pages ----------
app.get('/', (req, res) => {
  const c = ctx(req);
  const events = store.getEvents().map(eventView);
  res.render('home', {
    ...c,
    events,
    gallery: store.getGallery('home'),
    kalyanam: events.find((e) => e.slug === 'kalyanam'),
    rsvpEvents: events.filter((e) => e.rsvpOpen),
  });
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.get('/robots.txt', (req, res) => {
  const site = store.getSite();
  res.type('text/plain').send(site.hide_from_search ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nDisallow: /admin\n');
});

require('./src/admin')(app, { ctx, eventView, UPLOADS_DIR });

app.get('/:slug', (req, res, next) => {
  const raw = store.getEvent(req.params.slug);
  if (!raw) return next();
  const c = ctx(req);
  res.render('event', { ...c, e: eventView(raw), gallery: store.getGallery(raw.slug) });
});

// ---------- RSVP API ----------
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 12;
}
app.post('/api/rsvp/:slug', (req, res) => {
  const e = store.getEvent(req.params.slug);
  if (!e) return res.status(404).json({ error: 'This invitation could not be found.' });
  if (!e.rsvp_enabled || h.isPast(e.date)) return res.status(403).json({ error: 'Replies for this celebration are closed.' });
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot: silently ignore bots
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'Too many replies from this device. Please try again in a few minutes.' });
  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Please enter your name.' });
  if (b.attending !== 'yes' && b.attending !== 'no') return res.status(400).json({ error: 'Please let us know if you can attend.' });
  const attending = b.attending === 'yes';
  let guests = parseInt(b.guests, 10);
  if (!attending || !Number.isFinite(guests) || guests < 0) guests = 0;
  if (guests > 10) return res.status(400).json({ error: 'For more than 10 accompanying guests, please contact the family directly.' });
  const phone = String(b.phone || '').trim().slice(0, 30);
  const message = String(b.message || '').trim().slice(0, 500);
  store.addRsvp({ slug: e.slug, name, attending, guests, phone, message });
  res.json({ ok: true, attending });
});

app.use((req, res) => {
  res.status(404).render('notfound', ctx(req));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong. Please try again.');
});

app.listen(PORT, () => {
  console.log(`Wedding site running on http://localhost:${PORT}`);
  if (!process.env.ADMIN_PASSWORD) console.log('WARNING: ADMIN_PASSWORD is not set. Using the default password "change-me".');
});
