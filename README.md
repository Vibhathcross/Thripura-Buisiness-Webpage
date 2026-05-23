# Thripura Offset Printers Portal

A premium, modern, glassmorphic production portal for **Thripura Offset Printers** showcasing a sleek UI, vibrant space‑themed gradients, custom typography, full‑screen CSS rain animations, and 3D hover effects.

---

## ⚡ Deployment & Hosting Architecture

This project is built to be extremely resilient and run seamlessly in two modes:

### Mode 1: Static Client Fallback (GitHub Pages / No Server)
If deployed as a static website (such as on **GitHub Pages**) or run by double-clicking `index.html`, the application automatically activates a transparent **client-side database proxy** using the browser's `localStorage`.
- All features work instantly (admin dashboard, adding services, modifying portal details, submitting order requests, and customer-operator chat).
- Data persists in the browser across page refreshes.
- Default Admin credentials:
  - **Username**: `Madhu Sudhanan P K`
  - **Password**: `246Entry`

### Mode 2: Fullstack Production Node.js & MongoDB Server
When run with the Express server backend, it connects directly to the MongoDB Atlas database and enables rich-media uploads and Gmail confirmations.

---

## 🚀 Running the Fullstack Backend locally

### Prerequisites
- Install [Node.js](https://nodejs.org/) (includes `npm`).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Vibhathcross/thripura.git
   cd thripura
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - *Note: If no `.env` file is present, the server automatically defaults to the cloud MongoDB Atlas instance specified in `server.js`.*

### Start Server
- **Production Mode**:
  ```bash
  npm start
  ```
- **Development Auto-Reload Mode**:
  ```bash
  npm run dev
  ```

Once started, open [http://localhost:3000](http://localhost:3000) in your browser.
