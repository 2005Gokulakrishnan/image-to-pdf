# Pixora — JPG to PDF Converter

A responsive React + Vite website for combining multiple images into one PDF. PDF creation runs in the browser using `pdf-lib`; image files are not uploaded to a server.

## Features
- Add multiple JPG/JPEG, PNG, and WebP images at once
- Drag-and-drop upload area and image previews
- Reorder pages using drag-and-drop or up/down controls
- Remove individual images or clear the full list
- A4, A3, and Letter page sizes
- Portrait or landscape orientation
- None, small, normal, or wide margins
- High/standard WebP conversion quality
- Custom PDF filename
- Responsive blue UI, animated upload state/cards, hover motion, and reduced-motion accessibility support

## Run locally
1. Install Node.js (18+ recommended).
2. Extract this project.
3. Open the extracted folder in VS Code.
4. In the terminal run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173`).

## Build for deployment
```bash
npm run build
```
The production site is created in `dist/`.

## Notes
- Each image becomes one PDF page, fitted proportionally inside the selected page and margins.
- JPEG and PNG are embedded directly. WebP images are converted to JPEG in the browser before embedding.
- This starter project does not upload files to a backend.
