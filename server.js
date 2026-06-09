// server.js - Fully featured Express API connected to MongoDB Atlas for Thripura Offset Printers
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

// --- EMAIL TRANSPORTER (Gmail SMTP) ---
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendWelcomeMail(toEmail, userName) {
  if (!toEmail) return;
  const mailOptions = {
    from: `"Thripura Offset Printers" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: 'Welcome to Thripura Offset Printers — Registration Confirmed',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0e1a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1, #22d3ee); padding: 36px 40px; text-align: center;">
          <h1 style="margin:0; font-size: 2rem; color: white; letter-spacing: 2px;">THRIPURA<span style="opacity:0.7;">.</span></h1>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 0.9rem;">Offset Printers &amp; Digital Production Labs</p>
        </div>
        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="color: #6366f1; font-size: 1.4rem; margin: 0 0 12px;">Welcome aboard, ${userName}!</h2>
          <p style="line-height: 1.7; color: #94a3b8; margin: 0 0 20px;">
            Your client account has been successfully registered in the Thripura production network.
            You can now log in to place print orders, track your production runs, and communicate directly
            with our support team.
          </p>
          <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; padding: 20px; margin-bottom: 28px;">
            <p style="margin: 0; font-size: 0.9rem; color: #c7d2fe;">
              <strong style="color: #818cf8;">Registered as:</strong> ${userName}<br>
              <strong style="color: #818cf8;">Email:</strong> ${toEmail}
            </p>
          </div>
          <p style="line-height: 1.7; color: #94a3b8; margin: 0 0 28px;">
            Use the <strong style="color: #e2e8f0;">Direct Inquiry Chat</strong> on the website to send us
            your specifications — you can attach reference images and voice notes for precision.
          </p>
          <div style="text-align: center;">
            <a href="http://localhost:3000" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #22d3ee); color: white; padding: 14px 36px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 1rem;">Visit Thripura Portal</a>
          </div>
        </div>
        <!-- Footer -->
        <div style="padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 0.78rem; color: #475569;">
          &copy; ${new Date().getFullYear()} Thripura Offset Printers, Ernakulam, Kerala &nbsp;&bull;&nbsp; press@thripura.in
        </div>
      </div>
    `
  };
  try {
    await mailTransporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${toEmail}`);
  } catch (err) {
    console.warn(`⚠️  Email delivery failed for ${toEmail}:`, err.message);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded static files
app.use('/uploads', express.static(uploadsDir));

// Serve static frontend files
app.use(express.static(__dirname));

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.originalname);
    // Audio blobs from browser recording often have no extension — derive from mimetype
    if (!ext || ext === '.') {
      const mimeMap = {
        'audio/webm': '.webm', 'audio/mp4': '.mp4', 'audio/ogg': '.ogg',
        'audio/wav': '.wav', 'audio/mpeg': '.mp3', 'audio/aac': '.aac'
      };
      ext = mimeMap[file.mimetype] || '.bin';
    }
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isAudio = file.mimetype.startsWith('audio/');
    const isDoc = file.mimetype === 'application/pdf' ||
                  file.mimetype === 'application/msword' ||
                  file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                  file.originalname.endsWith('.pdf') ||
                  file.originalname.endsWith('.doc') ||
                  file.originalname.endsWith('.docx');
    if (isImage || isAudio || isDoc) return cb(null, true);
    cb(new Error('Only image, audio, PDF, and Word files are allowed!'));
  }
});

const JSON_DB_PATH = path.join(__dirname, 'db_fallback.json');

function makeIdQuery(id) {
  try {
    return { _id: new ObjectId(id) };
  } catch (e) {
    return { _id: id };
  }
}

class FallbackCollection {
  constructor(name) {
    this.name = name;
  }

  readData() {
    try {
      if (!fs.existsSync(JSON_DB_PATH)) {
        this.writeDefaultData();
      }
      return JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  writeData(data) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
  }

  writeDefaultData() {
    const defaultData = {
      settings: {
        heroTitle: "High-Fidelity Production Print Systems",
        heroDesc: "Experience printing re-engineered for the future. From extreme-scale offset press runs to complex dimensional package solutions.",
        aboutTitle: "Thripura Architectural Print Labs",
        aboutBody: "Founded on the absolute bedrock principles of unmatched clarity and fine structural fidelity, Thripura Offset Printers integrates ultra-precise modern digital frameworks with high-volume mechanical arrays. We facilitate complex corporate production lines, custom dynamic packaging configurations, and premium-grade publication work.",
        phone: "+91 94475 24601",
        email: "press@thripura.in",
        location: "Ernakulam, Kerala",
        showcase1Title: "Extreme Scale CMYK Lithography",
        showcase1Desc: "Our primary high-volume press utilizes advanced mechanical micro-alignment arrays to run continuous printing plates at up to 18,000 sheets per hour. With fully automated ink density scanning and active color spectrum recalibration, we guarantee absolute color accuracy and sharp geometric layouts on any stock thickness.",
        showcase1Points: "CMYK Ink Density Scan|18,000 sheets/hour|Micro-Alignment|Active Recalibration",
        showcase1ImageUrl: "/uploads/industrial_offset_press.png",
        showcase2Title: "Precision Structural & Foil Pressing",
        showcase2Desc: "Designed for luxury packaging and dimensional die-cut configurations, our automated carton pressing lines support multi-layer board folding, laser scoring, and thermal gold/silver foil embossing in a single pass. This ensures extreme seam precision and logistics resilience for premium retail brands.",
        showcase2Points: "Laser Scoring|Gold/Silver Foil Press|Single-Pass Scoring|Multi-Layer Board Fold",
        showcase2ImageUrl: "/uploads/packaging_production_line.png"
      },
      users: [
        { _id: "admin-id-madhu", name: "Madhu Sudhanan P K", role: "admin" }
      ],
      services: [
        {
          _id: "service-id-1",
          title: "High-Volume Offset Printing",
          description: "Mass production runs optimized for brochures, books, and flyers with precision alignment.",
          image: null
        },
        {
          _id: "service-id-2",
          title: "Digital Architectural Layouts",
          description: "Fine detailed premium architectural prints on dense card stock and specialized paper.",
          image: null
        }
      ],
      orders: [
        {
          _id: "order-id-1",
          client: "Vibhath (Verified User)",
          specifications: "Technical Research Compendium Glossy Run",
          volume: "50 Units",
          evaluationPrice: "₹3,450.00",
          status: "Processed/Paid"
        },
        {
          _id: "order-id-2",
          client: "Ananthu K.R.",
          specifications: "Matte Corporate Portfolio Layout Packs",
          volume: "1200 Units",
          evaluationPrice: "Awaiting Allocation",
          status: "Pending Evaluation"
        }
      ],
      messages: [
        {
          _id: "message-id-1",
          sender: "Elizabeth George",
          routing: "elizabeth@edu.in",
          data: "Require custom parameters evaluation run for high-capacity geometric wedding layout prints.",
          reply: "Evaluation pipeline active. Custom pricing allocation sent to queue."
        }
      ]
    };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(defaultData, null, 2));
  }

  find(query) {
    const data = this.readData();
    let list = data[this.name] || [];
    if (query && Object.keys(query).length > 0) {
      list = list.filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
    }
    return {
      toArray: async () => {
        return list;
      }
    };
  }

  async findOne(query) {
    const data = this.readData();
    if (this.name === 'settings') {
      return data.settings;
    }
    const list = data[this.name] || [];
    return list.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  }

  async countDocuments() {
    const data = this.readData();
    if (this.name === 'settings') return 1;
    const list = data[this.name] || [];
    return list.length;
  }

  async insertOne(doc) {
    const data = this.readData();
    const list = data[this.name] || [];
    const _id = new ObjectId().toString();
    const newDoc = { _id, ...doc };
    list.push(newDoc);
    data[this.name] = list;
    this.writeData(data);
    return { insertedId: _id };
  }

  async insertMany(docs) {
    const data = this.readData();
    const list = data[this.name] || [];
    const newDocs = docs.map(doc => ({ _id: new ObjectId().toString(), ...doc }));
    list.push(...newDocs);
    data[this.name] = list;
    this.writeData(data);
    return { insertedCount: docs.length };
  }

  async deleteOne(query) {
    const data = this.readData();
    const list = data[this.name] || [];
    const initialLength = list.length;
    const filtered = list.filter(item => {
      const qId = query._id ? query._id.toString() : null;
      return item._id !== qId && item._id !== query._id;
    });
    data[this.name] = filtered;
    this.writeData(data);
    return { deletedCount: initialLength - filtered.length };
  }

  async deleteMany(query) {
    const data = this.readData();
    const list = data[this.name] || [];
    const initialLength = list.length;
    const filtered = list.filter(item => {
      for (let key in query) {
        if (item[key] === query[key]) return false;
      }
      return true;
    });
    data[this.name] = filtered;
    this.writeData(data);
    return { deletedCount: initialLength - filtered.length };
  }

  async updateOne(query, update, options) {
    const data = this.readData();
    if (this.name === 'settings') {
      const setFields = update.$set || {};
      data.settings = { ...data.settings, ...setFields };
      this.writeData(data);
      return { modifiedCount: 1 };
    }
    const list = data[this.name] || [];
    let modifiedCount = 0;
    const updatedList = list.map(item => {
      const qId = query._id ? query._id.toString() : null;
      const match = item._id === qId || item._id === query._id;
      if (match) {
        modifiedCount++;
        const setFields = update.$set || {};
        return { ...item, ...setFields };
      }
      return item;
    });
    data[this.name] = updatedList;
    this.writeData(data);
    return { modifiedCount };
  }
}

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
let db;
let servicesCol;
let ordersCol;
let messagesCol;
let settingsCol;
let usersCol;

async function startServer() {
  try {
    await client.connect();
    db = client.db('thripura_db');
    servicesCol = db.collection('services');
    ordersCol = db.collection('orders');
    messagesCol = db.collection('messages');
    settingsCol = db.collection('settings');
    usersCol = db.collection('users');
    console.log('✅ Successfully connected to MongoDB Atlas database');

    // Seed default settings if empty
    const settingsCount = await settingsCol.countDocuments();
    if (settingsCount === 0) {
      await settingsCol.insertOne({
        heroTitle: "High-Fidelity Production Print Systems",
        heroDesc: "Experience printing re-engineered for the future. From extreme-scale offset press runs to complex dimensional package solutions.",
        aboutTitle: "Thripura Architectural Print Labs",
        aboutBody: "Founded on the absolute bedrock principles of unmatched clarity and fine structural fidelity, Thripura Offset Printers integrates ultra-precise modern digital frameworks with high-volume mechanical arrays. We facilitate complex corporate production lines, custom dynamic packaging configurations, and premium-grade publication work.",
        phone: "+91 94475 24601",
        email: "press@thripura.in",
        location: "Ernakulam, Kerala",
        showcase1Title: "Extreme Scale CMYK Lithography",
        showcase1Desc: "Our primary high-volume press utilizes advanced mechanical micro-alignment arrays to run continuous printing plates at up to 18,000 sheets per hour. With fully automated ink density scanning and active color spectrum recalibration, we guarantee absolute color accuracy and sharp geometric layouts on any stock thickness.",
        showcase1Points: "CMYK Ink Density Scan|18,000 sheets/hour|Micro-Alignment|Active Recalibration",
        showcase1ImageUrl: "/uploads/industrial_offset_press.png",
        showcase2Title: "Precision Structural & Foil Pressing",
        showcase2Desc: "Designed for luxury packaging and dimensional die-cut configurations, our automated carton pressing lines support multi-layer board folding, laser scoring, and thermal gold/silver foil embossing in a single pass. This ensures extreme seam precision and logistics resilience for premium retail brands.",
        showcase2Points: "Laser Scoring|Gold/Silver Foil Press|Single-Pass Scoring|Multi-Layer Board Fold",
        showcase2ImageUrl: "/uploads/packaging_production_line.png"
      });
      console.log('🌱 Seeded default page settings in Atlas');
    }

    // Seed admin user if empty
    const userCount = await usersCol.countDocuments();
    if (userCount === 0) {
      await usersCol.insertOne({
        name: "Madhu Sudhanan P K",
        role: "admin"
      });
      console.log('🌱 Seeded admin user in Atlas');
    }

    // Seed default services if database is empty
    const serviceCount = await servicesCol.countDocuments();
    if (serviceCount === 0) {
      await servicesCol.insertMany([
        {
          title: "High-Volume Offset Printing",
          description: "Mass production runs optimized for brochures, books, and flyers with precision alignment.",
          image: null
        },
        {
          title: "Digital Architectural Layouts",
          description: "Fine detailed premium architectural prints on dense card stock and specialized paper.",
          image: null
        }
      ]);
      console.log('🌱 Seeded default services database in Atlas');
    }

    // Seed default orders if database is empty
    const orderCount = await ordersCol.countDocuments();
    if (orderCount === 0) {
      await ordersCol.insertMany([
        {
          client: "Vibhath (Verified User)",
          specifications: "Technical Research Compendium Glossy Run",
          volume: "50 Units",
          evaluationPrice: "₹3,450.00",
          status: "Processed/Paid"
        },
        {
          client: "Ananthu K.R.",
          specifications: "Matte Corporate Portfolio Layout Packs",
          volume: "1200 Units",
          evaluationPrice: "Awaiting Allocation",
          status: "Pending Evaluation"
        }
      ]);
      console.log('🌱 Seeded default orders database in Atlas');
    }

    // Seed default messages if database is empty
    const messageCount = await messagesCol.countDocuments();
    if (messageCount === 0) {
      await messagesCol.insertOne({
        sender: "Elizabeth George",
        routing: "elizabeth@edu.in",
        data: "Require custom parameters evaluation run for high-capacity geometric wedding layout prints.",
        reply: "Evaluation pipeline active. Custom pricing allocation sent to queue."
      });
      console.log('🌱 Seeded default messages database in Atlas');
    }
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error.message);
    console.log('⚠️  Activating resilient local JSON database fallback mode...');

    // Instantiate Fallback collections
    servicesCol = new FallbackCollection('services');
    ordersCol = new FallbackCollection('orders');
    messagesCol = new FallbackCollection('messages');
    settingsCol = new FallbackCollection('settings');
    usersCol = new FallbackCollection('users');

    // Ensure the fallback database file exists and is populated
    servicesCol.readData();
    console.log('✅ Local JSON database active and persistent');
  }

  // --- API Endpoints ---

  // 1. SERVICES
  app.get('/api/services', async (req, res) => {
    try {
      const services = await servicesCol.find({}).toArray();
      res.json(services);
    } catch (e) {
      res.status(500).json({ error: 'Failed to retrieve services' });
    }
  });

  app.post('/api/services', upload.single('image'), async (req, res) => {
    try {
      const { title, description } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required fields' });
      }
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
      const newService = { title, description, image: imagePath };
      const result = await servicesCol.insertOne(newService);
      res.json({ _id: result.insertedId, ...newService });
    } catch (e) {
      res.status(500).json({ error: e.message || 'Failed to save new service' });
    }
  });

  app.delete('/api/services/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await servicesCol.deleteOne(makeIdQuery(id));
      res.json({ success: true, deletedCount: result.deletedCount });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete service' });
    }
  });

  app.put('/api/services/:id', upload.single('image'), async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required fields' });
      }
      
      const updateFields = { title, description };
      if (req.file) {
        updateFields.image = `/uploads/${req.file.filename}`;
      }
      
      const result = await servicesCol.updateOne(makeIdQuery(id), { $set: updateFields });
      res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update service' });
    }
  });

  // 2. ORDERS
  app.get('/api/orders', async (req, res) => {
    try {
      const orders = await ordersCol.find({}).toArray();
      res.json(orders);
    } catch (e) {
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  });

  app.post('/api/orders', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'document', maxCount: 1 }]), async (req, res) => {
    try {
      const { client, subject, specifications, volume, expectedTime, imageDesc, docDesc } = req.body;
      const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
      const docFile = req.files && req.files['document'] ? req.files['document'][0] : null;
      
      const newOrder = {
        client: client || 'Anonymous',
        subject: subject || 'Standard Work Request',
        specifications: specifications || '',
        volume: volume || 'Unspecified',
        expectedTime: expectedTime || 'Not specified',
        evaluationPrice: "Pending Evaluation",
        status: "Pending Evaluation",
        imageUrl: imageFile ? `/uploads/${imageFile.filename}` : null,
        imageDesc: imageDesc || '',
        docUrl: docFile ? `/uploads/${docFile.filename}` : null,
        docOriginalName: docFile ? docFile.originalname : null,
        docDesc: docDesc || '',
        timestamp: Date.now()
      };
      const result = await ordersCol.insertOne(newOrder);
      res.json({ _id: result.insertedId, ...newOrder });
    } catch (e) {
      res.status(500).json({ error: e.message || 'Failed to register order request' });
    }
  });

  app.put('/api/orders/:id/price', async (req, res) => {
    try {
      const { id } = req.params;
      const { price } = req.body;
      await ordersCol.updateOne(
        makeIdQuery(id),
        { $set: { evaluationPrice: price } }
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update order price' });
    }
  });

  app.put('/api/orders/:id/complete', async (req, res) => {
    try {
      const { id } = req.params;
      await ordersCol.updateOne(
        makeIdQuery(id),
        { $set: { status: 'Processed/Paid' } }
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await ordersCol.deleteOne(makeIdQuery(id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  // 3. MESSAGES
  app.get('/api/messages', async (req, res) => {
    try {
      const messages = await messagesCol.find({}).toArray();
      res.json(messages);
    } catch (e) {
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  });

  app.get('/api/messages/customers', async (req, res) => {
    try {
      const messages = await messagesCol.find({}).toArray();
      const customers = [];
      const seen = new Set();
      const sorted = [...messages].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      sorted.forEach(m => {
        const cName = m.customerName || m.sender;
        if (cName && !seen.has(cName) && cName !== "Madhu Sudhanan P K" && cName !== "admin") {
          seen.add(cName);
          customers.push({
            name: cName,
            routing: m.routing || '',
            lastMessage: m.data || '',
            timestamp: m.timestamp || 0
          });
        }
      });
      res.json(customers);
    } catch (e) {
      res.status(500).json({ error: 'Failed to retrieve chat customers' });
    }
  });

  app.get('/api/messages/thread/:customerName', async (req, res) => {
    try {
      const { customerName } = req.params;
      const allMessages = await messagesCol.find({}).toArray();
      const thread = [];
      allMessages.forEach(m => {
        const match = (m.customerName === customerName) || (m.sender === customerName) || (m.customerName === undefined && m.sender === customerName);
        if (match) {
          if (m.data) {
            thread.push({
              _id: m._id,
              sender: m.sender,
              role: m.role || 'customer',
              customerName: customerName,
              data: m.data,
              timestamp: m.timestamp || 0,
              routing: m.routing
            });
          }
          if (m.reply) {
            thread.push({
              _id: m._id + '-reply',
              sender: "Madhu Sudhanan P K",
              role: 'admin',
              customerName: customerName,
              data: m.reply,
              timestamp: (m.timestamp || 0) + 1,
              isLegacyReply: true
            });
          }
        }
      });
      thread.sort((a, b) => a.timestamp - b.timestamp);
      res.json(thread);
    } catch (e) {
      res.status(500).json({ error: 'Failed to retrieve thread' });
    }
  });

  app.post('/api/messages', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'document', maxCount: 1 }]), async (req, res) => {
    try {
      const { sender, role, customerName, data, routing, imageDesc } = req.body;
      if (!sender) {
        return res.status(400).json({ error: 'Sender is required' });
      }
      const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
      const docFile = req.files && req.files['document'] ? req.files['document'][0] : null;
      const newMessage = {
        sender,
        role: role || 'customer',
        customerName: customerName || sender,
        data: data || '',
        routing: routing || '',
        timestamp: Date.now(),
        imageUrl: imageFile ? `/uploads/${imageFile.filename}` : null,
        docUrl: docFile ? `/uploads/${docFile.filename}` : null,
        docOriginalName: docFile ? docFile.originalname : null,
        imageDesc: imageDesc || ''
      };
      const result = await messagesCol.insertOne(newMessage);
      res.json({ _id: result.insertedId, ...newMessage });
    } catch (e) {
      res.status(500).json({ error: 'Failed to transmit message' });
    }
  });

  app.put('/api/messages/:id/reply', async (req, res) => {
    try {
      const { id } = req.params;
      const { reply } = req.body;
      await messagesCol.updateOne(
        makeIdQuery(id),
        { $set: { reply } }
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save reply' });
    }
  });

  app.put('/api/messages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Message content is required' });
      }
      if (id.endsWith('-reply')) {
        const mainId = id.replace('-reply', '');
        await messagesCol.updateOne(
          makeIdQuery(mainId),
          { $set: { reply: data } }
        );
      } else {
        await messagesCol.updateOne(
          makeIdQuery(id),
          { $set: { data } }
        );
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update message' });
    }
  });

  // IMPORTANT: Thread clear route must come BEFORE the generic :id route
  app.delete('/api/messages/thread/:customerName', async (req, res) => {
    try {
      const { customerName } = req.params;
      await messagesCol.deleteMany({ customerName: customerName });
      await messagesCol.deleteMany({ sender: customerName });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to clear thread' });
    }
  });

  app.delete('/api/messages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (id.endsWith('-reply')) {
        const mainId = id.replace('-reply', '');
        await messagesCol.updateOne(
          makeIdQuery(mainId),
          { $set: { reply: null } }
        );
      } else {
        await messagesCol.deleteOne(makeIdQuery(id));
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  // 4. SETTINGS
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await settingsCol.findOne({});
      res.json(settings);
    } catch (e) {
      res.status(500).json({ error: 'Failed to retrieve settings' });
    }
  });

  app.post('/api/settings', upload.fields([
    { name: 'qrCode', maxCount: 1 },
    { name: 'brandLogo', maxCount: 1 },
    { name: 'showcase1Image', maxCount: 1 },
    { name: 'showcase2Image', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { heroTitle, heroDesc, aboutTitle, aboutBody, phone, phone2, email, location, showcase1Title, showcase1Desc, showcase2Title, showcase2Desc, showcase1Points, showcase2Points } = req.body;
      const updateData = { heroTitle, heroDesc, aboutTitle, aboutBody, phone, phone2, email, location, showcase1Title, showcase1Desc, showcase2Title, showcase2Desc, showcase1Points, showcase2Points };
      
      const qrFile = req.files && req.files['qrCode'] ? req.files['qrCode'][0] : null;
      const logoFile = req.files && req.files['brandLogo'] ? req.files['brandLogo'][0] : null;
      const s1File = req.files && req.files['showcase1Image'] ? req.files['showcase1Image'][0] : null;
      const s2File = req.files && req.files['showcase2Image'] ? req.files['showcase2Image'][0] : null;

      if (qrFile) {
        updateData.qrCodeUrl = `/uploads/${qrFile.filename}`;
      }
      if (logoFile) {
        updateData.logoUrl = `/uploads/${logoFile.filename}`;
      }
      if (s1File) {
        updateData.showcase1ImageUrl = `/uploads/${s1File.filename}`;
      }
      if (s2File) {
        updateData.showcase2ImageUrl = `/uploads/${s2File.filename}`;
      }

      await settingsCol.updateOne(
        {},
        { $set: updateData },
        { upsert: true }
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save settings: ' + e.message });
    }
  });

  // 5. USERS
  app.get('/api/users', async (req, res) => {
    try {
      const users = await usersCol.find({}).toArray();
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: 'Failed to retrieve users' });
    }
  });



  app.post('/api/users/register', async (req, res) => {
    try {
      const { name, email, phone, password } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      const existing = await usersCol.findOne({ name });
      if (existing) {
        return res.status(400).json({ error: 'System Operator Identity Alias already registered!' });
      }
      const newUser = {
        name,
        email: email || '',
        phone: phone || '',
        password: password || '',
        role: 'customer'
      };
      const result = await usersCol.insertOne(newUser);

      // Send welcome email asynchronously (non-blocking — registration still succeeds if mail fails)
      if (email) sendWelcomeMail(email, name);

      res.json({ _id: result.insertedId, ...newUser });
    } catch (e) {
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await usersCol.findOne(makeIdQuery(id));
      if (user && user.role === 'admin') {
        return res.status(403).json({ error: 'Deletion of root administrator is strictly prohibited!' });
      }
      const result = await usersCol.deleteOne(makeIdQuery(id));
      res.json({ success: true, deletedCount: result.deletedCount });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  app.post('/api/users/login', async (req, res) => {
    try {
      const { name, password } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Admin check from environment variables
      const adminName = process.env.ADMIN_NAME || "Madhu Sudhanan P K";
      const adminPassword = process.env.ADMIN_PASSWORD || "246Entry";
      
      if (name === adminName) {
        if (password === adminPassword) {
          return res.json({ name: adminName, role: "admin" });
        } else {
          return res.status(401).json({ error: "Cryptographic mismatch token or empty authentication string detected." });
        }
      }

      // Check users database for customer
      const user = await usersCol.findOne({ name });
      if (user) {
        if (user.password && user.password !== password) {
          return res.status(401).json({ error: "Incorrect password credentials entered." });
        }
        return res.json(user);
      } else {
        // Automatically register customer user if password is valid
        if (password && password.length >= 4) {
          const newUser = {
            name,
            email: '',
            phone: '',
            password,
            role: 'customer'
          };
          const result = await usersCol.insertOne(newUser);
          return res.json({ _id: result.insertedId, ...newUser });
        }
        return res.status(401).json({ error: "User not found and password too short." });
      }
    } catch (e) {
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Serve index.html for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  // Express Error Handling Middleware
  app.use((err, req, res, next) => {
    console.error('💥 Express Error:', err.message);
    res.status(400).json({ error: err.message || 'An error occurred during request processing' });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server fully operational at http://localhost:${PORT}`);
  });
}

startServer();
