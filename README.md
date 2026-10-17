# Greenwald Family Tree

Live site: https://maxgreenwald.github.io/greenwald-family-tree/

A static site, no build step. Open `index.html` in a browser.

- `data.js`: the family (people and who is whose parent/partner). This is the only file to edit when adding family.
- `family.js`: layout and relationship logic (no browser code, tested in Node).
- `app.js`, `styles.css`: the interface.
- `npm test`: checks the data is intact and the layout has no overlaps.

Optional fields you can add to any person in `data.js` and the card will show them: `born`, `died`, `photo` (an image URL or a path like `photos/gerald.jpg`).
