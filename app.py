# app.py - Premium Flask & SQLite Backend for Thripura Offset Printers
import os
import time
import random
import sqlite3
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_PATH = os.getenv('SQLITE_DB_PATH', 'thripura_database.db')
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- EMAIL TRANSMORTER (Gmail SMTP) ---
def send_welcome_mail(to_email, user_name):
    mail_user = os.getenv('MAIL_USER')
    mail_pass = os.getenv('MAIL_PASS')
    if not to_email or not mail_user or not mail_pass:
        return
        
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Welcome to Thripura Offset Printers — Registration Confirmed'
    msg['From'] = f'"Thripura Offset Printers" <{mail_user}>'
    msg['To'] = to_email

    html_content = f"""
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0e1a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #22d3ee); padding: 36px 40px; text-align: center;">
          <h1 style="margin:0; font-size: 2rem; color: white; letter-spacing: 2px;">THRIPURA<span style="opacity:0.7;">.</span></h1>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 0.9rem;">Offset Printers &amp; Digital Production Labs</p>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #6366f1; font-size: 1.4rem; margin: 0 0 12px;">Welcome aboard, {user_name}!</h2>
          <p style="line-height: 1.7; color: #94a3b8; margin: 0 0 20px;">
            Your client account has been successfully registered in the Thripura production network.
            You can now log in to place print orders, track your production runs, and communicate directly
            with our support team.
          </p>
          <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; padding: 20px; margin-bottom: 28px;">
            <p style="margin: 0; font-size: 0.9rem; color: #c7d2fe;">
              <strong style="color: #818cf8;">Registered as:</strong> {user_name}<br>
              <strong style="color: #818cf8;">Email:</strong> {to_email}
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
        <div style="padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 0.78rem; color: #475569;">
          &copy; {time.strftime('%Y')} Thripura Offset Printers, Ernakulam, Kerala &nbsp;&bull;&nbsp; press@thripura.in
        </div>
      </div>
    """
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(mail_user, mail_pass)
        server.sendmail(mail_user, to_email, msg.as_string())
        server.quit()
        print(f"[SUCCESS] Welcome email sent to {to_email}")
    except Exception as e:
        print(f"[WARNING] Email delivery failed for {to_email}: {e}")

# --- DATABASE ENGINE SETUP ---
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        heroTitle TEXT,
        heroDesc TEXT,
        aboutTitle TEXT,
        aboutBody TEXT,
        phone TEXT,
        phone2 TEXT,
        email TEXT,
        location TEXT,
        qrCodeUrl TEXT,
        logoUrl TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        email TEXT,
        phone TEXT,
        password TEXT,
        role TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        image TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client TEXT,
        subject TEXT,
        specifications TEXT,
        volume TEXT,
        expectedTime TEXT,
        evaluationPrice TEXT,
        status TEXT,
        imageUrl TEXT,
        imageDesc TEXT,
        docUrl TEXT,
        docOriginalName TEXT,
        docDesc TEXT,
        timestamp REAL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        role TEXT,
        customerName TEXT,
        data TEXT,
        routing TEXT,
        timestamp REAL,
        imageUrl TEXT,
        docUrl TEXT,
        docOriginalName TEXT,
        imageDesc TEXT,
        reply TEXT
    )
    ''')
    
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO settings (heroTitle, heroDesc, aboutTitle, aboutBody, phone, phone2, email, location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            "From Concept to Creation, We Print Excellence.",
            "High-fidelity offset print systems and premium digital production crafted with absolute precision. We turn your vision into flawless physical reality.",
            "Thripura Architectural Print Labs",
            "Founded on the absolute bedrock principles of unmatched clarity and fine structural fidelity, Thripura Offset Printers integrates ultra-precise modern digital frameworks with high-volume mechanical arrays. We facilitate complex corporate production lines, custom dynamic packaging configurations, and premium-grade publication work.",
            "+91 94475 24601",
            "",
            "press@thripura.in",
            "Ernakulam, Kerala"
        ))
        
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        admin_name = os.getenv('ADMIN_NAME', 'Madhu Sudhanan P K')
        admin_password = os.getenv('ADMIN_PASSWORD', '246Entry')
        cursor.execute('''
        INSERT INTO users (name, role, password)
        VALUES (?, ?, ?)
        ''', (admin_name, "admin", admin_password))
        
    cursor.execute("SELECT COUNT(*) FROM services")
    if cursor.fetchone()[0] == 0:
        services = [
            ("High-Volume Offset Press", "Perfect for extreme-scale commercial runs, high-fidelity publications, brochures, and packaging configurations with precise mechanical alignment.", None),
            ("Fine Art & Architectural Layouts", "Ultra-precise digital large-format layout printing on dense card stocks, matte architectural rolls, and specialized textures.", None),
            ("Dynamic Dimensional Packaging", "Custom structural package designs, heavy-duty carton pressings, and die-cut boxes optimized for high-volume retail logistics.", None),
            ("Premium Publication Binding", "Luxury catalog assembly, foil-stamped hardcovers, and professional saddle-stitch layouts for premium corporate publications.", None)
        ]
        cursor.executemany('''
        INSERT INTO services (title, description, image)
        VALUES (?, ?, ?)
        ''', services)
        
    cursor.execute("SELECT COUNT(*) FROM orders")
    if cursor.fetchone()[0] == 0:
        orders = [
            ("Vibhath (Verified User)", "Technical Research Compendium Glossy Run", "50 Units", "₹3,450.00", "Processed/Paid", None),
            ("Ananthu K.R.", "Matte Corporate Portfolio Layout Packs", "1200 Units", "Awaiting Allocation", "Pending Evaluation", None)
        ]
        for client, spec, vol, price, status, img in orders:
            cursor.execute('''
            INSERT INTO orders (client, subject, specifications, volume, evaluationPrice, status, imageUrl, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (client, "Standard Work Request", spec, vol, price, status, img, time.time() * 1000))
            
    cursor.execute("SELECT COUNT(*) FROM messages")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO messages (sender, routing, data, reply, timestamp, role, customerName)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            "Elizabeth George",
            "elizabeth@edu.in",
            "Require custom parameters evaluation run for high-capacity geometric wedding layout prints.",
            "Evaluation pipeline active. Custom pricing allocation sent to queue.",
            time.time() * 1000,
            "customer",
            "Elizabeth George"
        ))
        
    conn.commit()
    conn.close()

# --- FILE UPLOADER ENGINE ---
def save_uploaded_file(file):
    if not file or file.filename == '':
        return None
    unique_suffix = f"{int(time.time() * 1000)}-{random.randint(0, 1e9)}"
    filename = secure_filename(file.filename)
    _, ext = os.path.splitext(filename)
    if not ext:
        mime_map = {
            'audio/webm': '.webm', 'audio/mp4': '.mp4', 'audio/ogg': '.ogg',
            'audio/wav': '.wav', 'audio/mpeg': '.mp3', 'audio/aac': '.aac'
        }
        ext = mime_map.get(file.content_type, '.bin')
    new_filename = f"{unique_suffix}{ext}"
    file.save(os.path.join(UPLOAD_FOLDER, new_filename))
    return f"/uploads/{new_filename}"

# --- API ENDPOINTS ---

# 1. SERVICES
@app.route('/api/services', methods=['GET'])
def get_services():
    conn = get_db_connection()
    services = conn.execute("SELECT * FROM services").fetchall()
    conn.close()
    return jsonify([dict(s) for s in services])

@app.route('/api/services', methods=['POST'])
def add_service():
    try:
        title = request.form.get('title')
        description = request.form.get('description')
        if not title or not description:
            return jsonify({"error": "Title and description are required fields"}), 400
            
        image_file = request.files.get('image')
        image_path = save_uploaded_file(image_file)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO services (title, description, image) VALUES (?, ?, ?)",
                       (title, description, image_path))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"id": new_id, "title": title, "description": description, "image": image_path})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/services/<int:service_id>', methods=['DELETE'])
def delete_service(service_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM services WHERE id = ?", (service_id,))
        deleted = cursor.rowcount
        conn.commit()
        conn.close()
        return jsonify({"success": True, "deletedCount": deleted})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/services/<int:service_id>', methods=['PUT'])
def update_service(service_id):
    try:
        title = request.form.get('title')
        description = request.form.get('description')
        if not title or not description:
            return jsonify({"error": "Title and description are required fields"}), 400
            
        image_file = request.files.get('image')
        image_path = save_uploaded_file(image_file)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if image_path:
            cursor.execute("UPDATE services SET title = ?, description = ?, image = ? WHERE id = ?",
                           (title, description, image_path, service_id))
        else:
            cursor.execute("UPDATE services SET title = ?, description = ? WHERE id = ?",
                           (title, description, service_id))
        conn.commit()
        conn.close()
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. ORDERS
@app.route('/api/orders', methods=['GET'])
def get_orders():
    conn = get_db_connection()
    orders = conn.execute("SELECT * FROM orders").fetchall()
    conn.close()
    return jsonify([dict(o) for o in orders])

@app.route('/api/orders', methods=['POST'])
def add_order():
    try:
        client = request.form.get('client', 'Anonymous')
        subject = request.form.get('subject', 'Standard Work Request')
        specifications = request.form.get('specifications', '')
        volume = request.form.get('volume', 'Unspecified')
        expected_time = request.form.get('expectedTime', 'Not specified')
        image_desc = request.form.get('imageDesc', '')
        doc_desc = request.form.get('docDesc', '')
        
        image_file = request.files.get('image')
        doc_file = request.files.get('document')
        
        image_url = save_uploaded_file(image_file)
        doc_url = save_uploaded_file(doc_file)
        doc_orig_name = doc_file.filename if doc_file else None
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO orders (client, subject, specifications, volume, expectedTime, evaluationPrice, status, imageUrl, imageDesc, docUrl, docOriginalName, docDesc, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (client, subject, specifications, volume, expected_time, "Pending Evaluation", "Pending Evaluation", image_url, image_desc, doc_url, doc_orig_name, doc_desc, time.time() * 1000))
        
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            "id": new_id, "client": client, "subject": subject, "specifications": specifications,
            "volume": volume, "expectedTime": expected_time, "evaluationPrice": "Pending Evaluation", "status": "Pending Evaluation",
            "imageUrl": image_url, "imageDesc": image_desc, "docUrl": doc_url, "docOriginalName": doc_orig_name, "docDesc": doc_desc,
            "timestamp": time.time() * 1000
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders/<int:order_id>/price', methods=['PUT'])
def update_order_price(order_id):
    try:
        price = request.json.get('price')
        conn = get_db_connection()
        conn.execute("UPDATE orders SET evaluationPrice = ? WHERE id = ?", (price, order_id))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders/<int:order_id>/complete', methods=['PUT'])
def complete_order(order_id):
    try:
        conn = get_db_connection()
        conn.execute("UPDATE orders SET status = 'Processed/Paid' WHERE id = ?", (order_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM orders WHERE id = ?", (order_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. MESSAGES (CHATS)
@app.route('/api/messages', methods=['GET'])
def get_messages():
    conn = get_db_connection()
    messages = conn.execute("SELECT * FROM messages").fetchall()
    conn.close()
    return jsonify([dict(m) for m in messages])

@app.route('/api/messages/customers', methods=['GET'])
def get_chat_customers():
    try:
        conn = get_db_connection()
        messages = conn.execute("SELECT * FROM messages ORDER BY timestamp DESC").fetchall()
        conn.close()
        
        customers = []
        seen = set()
        for m in messages:
            c_name = m['customerName'] or m['sender']
            if c_name and c_name not in seen and c_name not in ["Madhu Sudhanan P K", "admin"]:
                seen.add(c_name)
                customers.append({
                    "name": c_name,
                    "routing": m['routing'] or '',
                    "lastMessage": m['data'] or '',
                    "timestamp": m['timestamp'] or 0
                })
        return jsonify(customers)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/messages/thread/<customer_name>', methods=['GET'])
def get_chat_thread(customer_name):
    try:
        conn = get_db_connection()
        all_messages = conn.execute("SELECT * FROM messages").fetchall()
        conn.close()
        
        thread = []
        for m in all_messages:
            match = (m['customerName'] == customer_name) or (m['sender'] == customer_name)
            if match:
                if m['data']:
                    thread.append({
                        "id": m['id'],
                        "sender": m['sender'],
                        "role": m['role'] or 'customer',
                        "customerName": customer_name,
                        "data": m['data'],
                        "timestamp": m['timestamp'] or 0,
                        "routing": m['routing']
                    })
                if m['reply']:
                    thread.append({
                        "id": f"{m['id']}-reply",
                        "sender": "Madhu Sudhanan P K",
                        "role": 'admin',
                        "customerName": customer_name,
                        "data": m['reply'],
                        "timestamp": (m['timestamp'] or 0) + 1,
                        "isLegacyReply": True
                    })
        thread.sort(key=lambda x: x['timestamp'])
        return jsonify(thread)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/messages', methods=['POST'])
def add_message():
    try:
        sender = request.form.get('sender')
        if not sender:
            return jsonify({"error": "Sender is required"}), 400
            
        role = request.form.get('role', 'customer')
        customer_name = request.form.get('customerName', sender)
        data = request.form.get('data', '')
        routing = request.form.get('routing', '')
        image_desc = request.form.get('imageDesc', '')
        
        image_file = request.files.get('image')
        doc_file = request.files.get('document')
        
        image_url = save_uploaded_file(image_file)
        doc_url = save_uploaded_file(doc_file)
        doc_orig_name = doc_file.filename if doc_file else None
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO messages (sender, role, customerName, data, routing, timestamp, imageUrl, docUrl, docOriginalName, imageDesc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (sender, role, customer_name, data, routing, time.time() * 1000, image_url, doc_url, doc_orig_name, image_desc))
        
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            "id": new_id, "sender": sender, "role": role, "customerName": customer_name, "data": data,
            "routing": routing, "timestamp": time.time() * 1000, "imageUrl": image_url, "docUrl": doc_url,
            "docOriginalName": doc_orig_name, "imageDesc": image_desc
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/messages/<id>/reply', methods=['PUT'])
def reply_message(id):
    try:
        reply = request.json.get('reply')
        conn = get_db_connection()
        # Parse numeric ID
        msg_id = int(id.replace('-reply', '')) if isinstance(id, str) else id
        conn.execute("UPDATE messages SET reply = ? WHERE id = ?", (reply, msg_id))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/messages/<id>', methods=['PUT'])
def edit_message(id):
    try:
        data = request.json.get('data')
        if not data:
            return jsonify({"error": "Message content is required"}), 400
            
        conn = get_db_connection()
        if isinstance(id, str) and id.endswith('-reply'):
            main_id = int(id.replace('-reply', ''))
            conn.execute("UPDATE messages SET reply = ? WHERE id = ?", (data, main_id))
        else:
            conn.execute("UPDATE messages SET data = ? WHERE id = ?", (data, int(id)))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/messages/thread/<customer_name>', methods=['DELETE'])
def delete_message_thread(customer_name):
    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM messages WHERE customerName = ? OR sender = ?", (customer_name, customer_name))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/messages/<id>', methods=['DELETE'])
def delete_message(id):
    try:
        conn = get_db_connection()
        if isinstance(id, str) and id.endswith('-reply'):
            main_id = int(id.replace('-reply', ''))
            conn.execute("UPDATE messages SET reply = NULL WHERE id = ?", (main_id,))
        else:
            conn.execute("DELETE FROM messages WHERE id = ?", (int(id),))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 4. SETTINGS
@app.route('/api/settings', methods=['GET'])
def get_settings():
    conn = get_db_connection()
    settings = conn.execute("SELECT * FROM settings LIMIT 1").fetchone()
    conn.close()
    return jsonify(dict(settings) if settings else {})

@app.route('/api/settings', methods=['POST'])
def save_settings():
    try:
        hero_title = request.form.get('heroTitle')
        hero_desc = request.form.get('heroDesc')
        about_title = request.form.get('aboutTitle')
        about_body = request.form.get('aboutBody')
        phone = request.form.get('phone')
        phone2 = request.form.get('phone2')
        email = request.form.get('email')
        location = request.form.get('location')
        
        qr_file = request.files.get('qrCode')
        logo_file = request.files.get('brandLogo')
        
        qr_url = save_uploaded_file(qr_file)
        logo_url = save_uploaded_file(logo_file)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if settings row exists
        existing = conn.execute("SELECT rowid FROM settings LIMIT 1").fetchone()
        if existing:
            query = "UPDATE settings SET heroTitle=?, heroDesc=?, aboutTitle=?, aboutBody=?, phone=?, phone2=?, email=?, location=?"
            params = [hero_title, hero_desc, about_title, about_body, phone, phone2, email, location]
            if qr_url:
                query += ", qrCodeUrl=?"
                params.append(qr_url)
            if logo_url:
                query += ", logoUrl=?"
                params.append(logo_url)
            conn.execute(query, tuple(params))
        else:
            conn.execute('''
            INSERT INTO settings (heroTitle, heroDesc, aboutTitle, aboutBody, phone, phone2, email, location, qrCodeUrl, logoUrl)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (hero_title, hero_desc, about_title, about_body, phone, phone2, email, location, qr_url, logo_url))
            
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 5. USERS (AUTH)
@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    users = conn.execute("SELECT * FROM users").fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

@app.route('/api/users/register', methods=['POST'])
def register_user():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email', '')
        phone = data.get('phone', '')
        password = data.get('password', '')
        
        if not name:
            return jsonify({"error": "Name is required"}), 400
            
        conn = get_db_connection()
        existing = conn.execute("SELECT id FROM users WHERE name = ?", (name,)).fetchone()
        if existing:
            conn.close()
            return jsonify({"error": "System Operator Identity Alias already registered!"}), 400
            
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'customer')",
                       (name, email, phone, password))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        if email:
            try:
                send_welcome_mail(email, name)
            except:
                pass
                
        return jsonify({"id": new_id, "name": name, "email": email, "phone": phone, "role": "customer"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        conn = get_db_connection()
        user = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
        if user and user['role'] == 'admin':
            conn.close()
            return jsonify({"error": "Deletion of root administrator is strictly prohibited!"}), 403
            
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        deleted = cursor.rowcount
        conn.commit()
        conn.close()
        return jsonify({"success": True, "deletedCount": deleted})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/login', methods=['POST'])
def login_user():
    try:
        data = request.json
        name = data.get('name')
        password = data.get('password')
        
        if not name:
            return jsonify({"error": "Name is required"}), 400
            
        admin_name = os.getenv('ADMIN_NAME', 'Madhu Sudhanan P K')
        admin_password = os.getenv('ADMIN_PASSWORD', '246Entry')
        
        if name == admin_name:
            if password == admin_password:
                return jsonify({"name": admin_name, "role": "admin"})
            else:
                return jsonify({"error": "Cryptographic mismatch token or empty authentication string detected."}), 401
                
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE name = ?", (name,)).fetchone()
        
        if user:
            if user['password'] and user['password'] != password:
                conn.close()
                return jsonify({"error": "Incorrect password credentials entered."}), 401
            res_user = dict(user)
            conn.close()
            return jsonify(res_user)
        else:
            if password and len(password) >= 4:
                cursor = conn.cursor()
                cursor.execute("INSERT INTO users (name, email, phone, password, role) VALUES (?, '', '', ?, 'customer')",
                               (name, password))
                new_id = cursor.lastrowid
                conn.commit()
                conn.close()
                return jsonify({"id": new_id, "name": name, "email": "", "phone": "", "role": "customer"})
            conn.close()
            return jsonify({"error": "User not found and password too short."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Serve static files
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
@app.route('/<path:path>')
def serve_index(path=None):
    if path and os.path.exists(os.path.join(os.path.dirname(__file__), path)):
        return send_from_directory(os.path.dirname(__file__), path)
    return send_from_directory(os.path.dirname(__file__), 'index.html')

if __name__ == '__main__':
    init_db()
    port = int(os.getenv('PORT', 3000))
    print(f"[START] Python Flask server starting on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port)
