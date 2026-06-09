/**
 * Database Initialization Script for Thripura Offset Printers
 * This script seeds the MongoDB database with default data
 */

const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = 'thripura_db';

async function initializeDatabase() {
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log('\u2705 Connected to MongoDB');
    
    // Collections
    const collections = ['settings', 'services', 'orders', 'messages', 'users'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      
      if (count === 0) {
        console.log(`\u2192 Seeding ${collectionName} collection...`);
        
        if (collectionName === 'settings') {
          await collection.insertOne({
            heroTitle: "High-Fidelity Production Print Systems",
            heroDesc: "Experience printing re-engineered for the future. From extreme-scale offset press runs to complex dimensional package solutions.",
            aboutTitle: "Thripura Architectural Print Labs",
            aboutBody: "Founded on the absolute bedrock principles of unmatched clarity and fine structural fidelity, Thripura Offset Printers integrates ultra-precise modern digital frameworks with high-volume mechanical arrays. We facilitate complex corporate production lines, custom dynamic packaging configurations, and premium-grade publication work.",
            phone: "+91 94475 24601",
            phone2: "",
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
        } else if (collectionName === 'users') {
          const adminName = process.env.ADMIN_NAME || 'Madhu Sudhanan P K';
          const adminPassword = process.env.ADMIN_PASSWORD || '246Entry';
          await collection.insertOne({
            name: adminName,
            email: "press@thripura.in",
            phone: "+91 94475 24601",
            password: adminPassword,
            role: "admin"
          });
        } else if (collectionName === 'services') {
          await collection.insertMany([
            {
              title: "High-Volume Offset Printing",
              description: "Mass production runs optimized for brochures, books, and flyers with precision alignment.",
              image: null
            },
            {
              title: "Digital Architectural Layouts",
              description: "Fine detailed premium architectural prints on dense card stock and specialized paper.",
              image: null
            },
            {
              title: "Precision Structural & Foil Pressing",
              description: "Luxury packaging and dimensional die-cut configurations with multi-layer board folding.",
              image: null
            },
            {
              title: "Premium Publication Binding",
              description: "Luxury catalog assembly, foil-stamped hardcovers, and professional saddle-stitch layouts.",
              image: null
            }
          ]);
        } else if (collectionName === 'orders') {
          await collection.insertMany([
            {
              client: "Vibhath (Verified User)",
              subject: "Technical Research Compendium Glossy Run",
              specifications: "Technical Research Compendium Glossy Run",
              volume: "50 Units",
              expectedTime: "Not specified",
              evaluationPrice: "\u20b93,450.00",
              status: "Processed/Paid",
              imageUrl: null,
              imageDesc: "",
              docUrl: null,
              docOriginalName: null,
              docDesc: "",
              timestamp: Date.now()
            },
            {
              client: "Ananthu K.R.",
              subject: "Matte Corporate Portfolio Layout Packs",
              specifications: "Matte Corporate Portfolio Layout Packs",
              volume: "1200 Units",
              expectedTime: "Not specified",
              evaluationPrice: "Awaiting Allocation",
              status: "Pending Evaluation",
              imageUrl: null,
              imageDesc: "",
              docUrl: null,
              docOriginalName: null,
              docDesc: "",
              timestamp: Date.now()
            }
          ]);
        } else if (collectionName === 'messages') {
          await collection.insertOne({
            sender: "Elizabeth George",
            role: "customer",
            customerName: "Elizabeth George",
            data: "Require custom parameters evaluation run for high-capacity geometric wedding layout prints.",
            routing: "elizabeth@edu.in",
            timestamp: Date.now(),
            imageUrl: null,
            docUrl: null,
            docOriginalName: null,
            imageDesc: "",
            reply: "Evaluation pipeline active. Custom pricing allocation sent to queue."
          });
        }
        
        console.log(`\u2705 Seeded ${collectionName} with default data`);
      } else {
        console.log(`\u2714 ${collectionName} already contains data (${count} documents)`);
      }
    }
    
    console.log('\u2705 Database initialization complete!');
    
  } catch (error) {
    console.error('\u274c Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.close();
    process.exit(0);
  }
}

// Run initialization
initializeDatabase();
