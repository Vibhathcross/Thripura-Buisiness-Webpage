# Thripura Offset Printers Portal

A premium, modern, glassmorphic production portal for **Thripura Offset Printers** showcasing a sleek UI, vibrant space‑themed gradients, custom typography, full‑screen CSS rain animations, and 3D hover effects.

---

## ⚡ Deployment & Hosting Architecture

This project is built as a **Fullstack Production Node.js & MongoDB Server** application. 
- It connects directly to the MongoDB Atlas database to store and manage services, user accounts, client order requests, and customer-operator communications.
- Enables rich-media uploads (such as audio specs and reference files) and Gmail-based receipt notifications.

---

## 🚀 Running the Portal

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

### Configuration
1. (Optional) Customize environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. *Note: If no `.env` file is present, the server automatically defaults to the cloud MongoDB Atlas instance specified in `server.js` to ensure the project works out of the box.*

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

---

## 🔐 Credentials
- Default Admin credentials:
  - **Username**: `Madhu Sudhanan P K`
  - **Password**: `246Entry`
