# Euphoria Theme Frontend

Static frontend for the Euphoria Theme website. No backend or login logic is required.

## Structure

- `index.html` - Main page markup
- `public/styles.css` - Site styles
- `public/script.js` - Frontend behavior (API fetching, carousel, modal)
- `public/images/` - Local images and logo

## Run locally

Open `index.html` in a browser.

## Data sources

The site pulls live data from:

- `https://api.euphoriadevelopment.uk/contributors`
- `https://api.euphoriadevelopment.uk/donators`
- `https://api.euphoriadevelopment.uk/stats/`
- GitHub org data for repo stars/forks: `https://api.github.com/orgs/EuphoriaTheme/repos`

## Notes

- Product download buttons use GitHub Releases when available.
- If the APIs are unavailable, the UI shows a fallback message.
