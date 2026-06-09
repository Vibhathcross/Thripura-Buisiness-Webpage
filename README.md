# Thripura Offset Printers

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.10-brightgreen)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-6.6+-brightgreen)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Thripura Offset Printers** is a premium, full-stack web application for managing print orders, services, and customer communications. Built with **Node.js + Express + MongoDB** (primary) and **Python + Flask + SQLite** (alternative), it features a modern, responsive design with glassmorphism, smooth animations, and comprehensive business management capabilities.

---

## \ud83c\udf0e Features

### \ud83d\udcc1 Business Management
- **Services Catalog**: Manage print services with images and descriptions
- **Orders System**: Track client orders with status, pricing, and file attachments
- **Customer Chat**: Real-time messaging with file sharing (images, documents, audio)
- **User Management**: Admin and customer accounts with role-based access
- **Settings Panel**: Configure business information, contact details, and branding

### \ud83d\ud83d Design & UI
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Glassmorphism**: Modern glass effect UI elements
- **Smooth Animations**: Micro-interactions and transitions
- **Dark Mode**: Optimized for dark themes
- **Custom Branding**: Upload logos, QR codes, and showcase images

### \ud83d\udd0c Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend (Primary)**: Node.js, Express, MongoDB Atlas
- **Backend (Alternative)**: Python 3.10+, Flask, SQLite
- **File Uploads**: Multer (Node.js) / Werkzeug (Python)
- **Email**: Nodemailer (SMTP)
- **Authentication**: Session-based with hardcoded admin fallback

### \ud83c\udf21 Database Support
- **MongoDB Atlas** (Recommended): Cloud-based, scalable
- **JSON Fallback**: Local file-based storage for offline mode
- **SQLite** (Python backend): Lightweight, file-based database

---

## \ud83d\udce3 Quick Start

### Option 1: Using Node.js + MongoDB (Recommended)

#### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git

#### Setup
```bash
# Clone the repository
git clone https://github.com/Vibhathcross/thripura.git
cd thripura

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use any text editor

# Start the server
npm start
# or for development with auto-reload:
npm run dev
```

The application will be available at `http://localhost:3000`

---

### Option 2: Using Python + SQLite (Alternative)

#### Prerequisites
- Python 3.10+ installed
- Git

#### Setup
```bash
# Clone the repository
git clone https://github.com/Vibhathcross/thripura.git
cd thripura

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use any text editor

# Start the Flask server
python app.py
```

The application will be available at `http://localhost:3000`

---

## \ud83c\udf75 Using Docker

### Build and Run
```bash
# Build the Docker image
docker build -t thripura-offset-printers .

# Run the container
docker run -p 3000:3000 \
  -e MONGO_URI=mongodb://127.0.0.1:27017 \
  -e MAIL_USER=your_email@gmail.com \
  -e MAIL_PASS=your_app_password \
  thripura-offset-printers
```

### Docker Compose (with MongoDB)
Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/thripura_db
      - MAIL_USER=${MAIL_USER}
      - MAIL_PASS=${MAIL_PASS}
      - PORT=3000
    depends_on:
      - mongo
    volumes:
      - ./uploads:/app/uploads

  mongo:
    image: mongo:6.6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=thripura_db

volumes:
  mongo-data:
```

Run with:
```bash
# Set your email credentials
export MAIL_USER=your_email@gmail.com
export MAIL_PASS=your_app_password

# Start all services
docker-compose up -d
```

---

## \ud83c\udf10 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGO_URI` | MongoDB connection string | Yes (for Node.js) | `mongodb://127.0.0.1:27017` |
| `PORT` | Application port | No | `3000` |
| `MAIL_USER` | Gmail for notifications | No | - |
| `MAIL_PASS` | Gmail app password | No | - |
| `SQLITE_DB_PATH` | SQLite database path | No (for Python) | `thripura_database.db` |

### Email Setup

1. Enable **Less Secure Apps** or create an **App Password** for your Gmail:
   - Go to: https://myaccount.google.com/apppasswords
   - Generate an app password
   - Use it as `MAIL_PASS` in your `.env` file

2. If using 2FA, ensure you're using an App Password, not your regular password.

---

## \ud83d\udcc2 Project Structure

```
thripura-offset-printers/
├── index.html              # Main frontend HTML
├── styles.css              # CSS styles and animations
├── server.js               # Node.js + Express backend (Primary)
├── app.py                  # Python + Flask backend (Alternative)
├── package.json            # Node.js dependencies
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker configuration
├── .dockerignore           # Docker ignore rules
├── .gitignore              # Git ignore rules
├── .env.example            # Environment template
├── README.md               # This file
├── node_modules/           # Node.js dependencies (gitignored)
├── uploads/                # Uploaded files (gitignored)
├── thripura_database.db    # SQLite database (gitignored)
└── db_fallback.json        # JSON fallback database
```

---

## \ud83d\udcdb Database Setup

### MongoDB Atlas (Recommended)

1. **Create a MongoDB Atlas account**: https://www.mongodb.com/atlas/database
2. **Create a free cluster**
3. **Create a database user** with read/write permissions
4. **Add your IP** to the access list
5. **Get the connection string** and add it to `.env`:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/thripura_db?retryWrites=true&w=majority
   ```

### Local MongoDB

1. **Install MongoDB Community Edition**: https://www.mongodb.com/try/download/community
2. **Start MongoDB service**
3. Use the default connection string:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017
   ```

### SQLite (Python Backend)

The SQLite database is automatically created when you run `app.py`. It will:
- Create `thripura_database.db` in the project root
- Initialize all required tables
- Seed with default data (admin user, services, settings)

---

## \ud83d\ude80 Running the Application

### Development Mode

```bash
# Node.js
npm run dev  # Uses nodemon for auto-reload

# Python
python app.py
```

### Production Mode

```bash
# Node.js
npm start

# Python (use a production WSGI server like Gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3000 app:app
```

---

## \ud83d\udc47 Default Credentials

### Admin Access
- **Username**: `Madhu Sudhanan P K`
- **Password**: `246Entry`

> \u26a0\ufe0f **Note**: Change this password immediately after first login for security.

---

## \ud83d\udcca API Endpoints

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | Get all services |
| POST | `/api/services` | Create a new service |
| PUT | `/api/services/:id` | Update a service |
| DELETE | `/api/services/:id` | Delete a service |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| POST | `/api/orders` | Create a new order |
| PUT | `/api/orders/:id/price` | Update order price |
| PUT | `/api/orders/:id/complete` | Mark order as complete |
| DELETE | `/api/orders/:id` | Delete an order |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | Get all messages |
| GET | `/api/messages/customers` | Get list of customers |
| GET | `/api/messages/thread/:customerName` | Get message thread |
| POST | `/api/messages` | Send a new message |
| PUT | `/api/messages/:id/reply` | Reply to a message |
| PUT | `/api/messages/:id` | Edit a message |
| DELETE | `/api/messages/thread/:customerName` | Delete entire thread |
| DELETE | `/api/messages/:id` | Delete a message |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get current settings |
| POST | `/api/settings` | Update settings |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Login a user |
| DELETE | `/api/users/:id` | Delete a user |

---

## \ud83c\udf77 Deployment Guide

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - `MONGO_URI`
   - `MAIL_USER`
   - `MAIL_PASS`

### Deploy to Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### Deploy to Railway

1. Create a new project
2. Import from GitHub
3. Configure environment variables
4. Deploy

---

## \ud83d\udc80 File Uploads

The application supports uploading:
- **Images**: JPG, PNG, GIF, WEBP
- **Documents**: PDF, DOC, DOCX
- **Audio**: MP3, WAV, OGG, WEBM

Uploads are stored in the `uploads/` directory and served at `/uploads/<filename>`.

> \u26a0\ufe0f **Note**: The `uploads/` directory is gitignored. Make sure to:
> - Create the directory before starting the server
> - Set proper permissions for file uploads

---

## \ud83c\udf27 Security Best Practices

1. **Change Admin Password**: Update the hardcoded admin password (`246Entry`) immediately
2. **Use HTTPS**: Always deploy with SSL/TLS in production
3. **Environment Variables**: Never commit `.env` files to git
4. **Email Security**: Use App Passwords for Gmail SMTP
5. **Database Security**: Use strong passwords for MongoDB
6. **Rate Limiting**: Consider adding rate limiting in production
7. **CORS**: Configure CORS properly for production

---

## \ud83d\udc89 Troubleshooting

### MongoDB Connection Failed
- Verify your MongoDB URI is correct
- Check if MongoDB service is running
- Ensure your IP is whitelisted in MongoDB Atlas
- Test connection using `mongosh` CLI

### Email Not Sending
- Verify your Gmail App Password is correct
- Check if Less Secure Apps is enabled
- Test SMTP connection manually
- Check spam folder

### File Uploads Not Working
- Ensure `uploads/` directory exists and is writable
- Check file size limits
- Verify file type restrictions

### Port Already in Use
- Try a different port: `PORT=5000 npm start`
- Kill the process using the port:
  ```bash
  # Linux/Mac
  lsof -ti:3000 | xargs kill -9
  
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

---

## \ud83c\udf93 Customization

### Changing Business Information
1. Login as admin (`Madhu Sudhanan P K` / `246Entry`)
2. Navigate to Settings
3. Update all business details
4. Save changes

### Adding Services
1. Login as admin
2. Go to Services section
3. Click "Add Service"
4. Fill in details and upload image if needed

### Managing Users
- Admin can view all users
- Delete users (except admin)
- Customers auto-register on first login

---

## \ud83d\udc68\u200d\ud83d\udcbb Technology Details

### Node.js Backend (server.js)
- **Framework**: Express 4.x
- **Database**: MongoDB (with JSON fallback)
- **File Uploads**: Multer
- **Email**: Nodemailer
- **CORS**: Enabled for all origins

### Python Backend (app.py)
- **Framework**: Flask
- **Database**: SQLite
- **File Uploads**: Werkzeug
- **Email**: smtplib
- **CORS**: Flask-CORS

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with animations
- **Responsive**: Mobile-first design

---

## \ud83d\udcdd Local Development

For best development experience:

1. **Use both backends**: Test with both Node.js and Python
2. **Hot reload**: Use `npm run dev` for Node.js development
3. **API testing**: Use Postman or curl to test endpoints
4. **Database viewer**: Use MongoDB Compass or SQLite Browser

---

## \ud83c\udf88 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## \ud83c\udf49 License

MIT License - See [LICENSE](LICENSE) for details.

---

## \ud83d\udc8b Support

For issues, questions, or feature requests:
- **GitHub Issues**: [Open an Issue](https://github.com/Vibhathcross/thripura/issues)
- **Email**: contact@vibhathcross@gmail.com

---

## \ud83d\udca1 Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | 2026-05-29 | Initial release |

---

<p align="center">
  <b>Built with \ud83d\udc8b by Vibhath</b><br>
  <i>Premium Print Solutions, Digitally Managed</i>
</p>
