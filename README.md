# zodiax

A single-page, no-build-step website that turns any message you type into a
**homophonic substitution cipher** in the spirit of the Zodiac Killer's Z408
and Z340 ciphers — then breaks down exactly why the technique works, with a
live plaintext-vs-ciphertext frequency comparison and a plain-language tour
of how substitution ciphers evolved.

It's meant as an interactive lesson in classical cryptography, not as a true
crime piece — the historical notes on the page stick to the cryptographic
facts (how the ciphers were built and eventually solved) rather than the
crimes themselves.

## How it works

- Every letter of the alphabet is assigned a small pool of unique,
  procedurally generated symbols ("glyphs"), sized roughly by how often that
  letter appears in English — common letters like **E**, **T**, and **A**
  get 5–7 symbols each, rare letters like **Q**, **X**, and **Z** get just 1.
- When you type a message, each letter is replaced by a symbol picked at
  random from its own pool, so the same letter can render as several
  different symbols throughout your message. That's the core trick behind a
  homophonic cipher: it flattens the letter-frequency fingerprint that makes
  simple substitution ciphers so easy to crack.
- The page renders live bar charts comparing your plaintext's letter
  frequency against your ciphertext's symbol frequency, so you can watch the
  distribution flatten as your message gets longer.
- A "Generate a new cipher key" button reshuffles which symbols map to which
  letters, and a "Reveal the key" toggle lets you check your own manual
  decoding attempts.

Everything runs client-side in vanilla HTML/CSS/JS — nothing you type is
sent anywhere, and there's no build step or dependency to install.

## Running locally

Just open `index.html` in a browser, or serve the folder with any static
file server, e.g.:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Deploying

This is a static site, so it can be hosted anywhere that serves static
files — for example, enable **GitHub Pages** on this repository (Settings →
Pages → deploy from the `main` branch, root folder) and it will be live at
no additional cost.

## Files

- `index.html` — page structure and content
- `styles.css` — dark, terminal-inspired styling, responsive down to phone
  widths
- `app.js` — glyph generation, cipher key assignment, encoding, and chart
  rendering
