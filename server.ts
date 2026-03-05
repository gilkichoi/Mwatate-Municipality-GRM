import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("grm.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS grievances (
    id TEXT PRIMARY KEY,
    tracking_number TEXT UNIQUE,
    title TEXT,
    category TEXT,
    description TEXT,
    location TEXT,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    email TEXT,
    gender TEXT,
    ward TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    assigned_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'staff',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS system_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    user_id TEXT,
    username TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial categories if none exist
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as any;
if (categoryCount.count === 0) {
  const initialCategories = [
    "Infrastructure",
    "Water Supply",
    "Waste Management",
    "Public Health",
    "Environment",
    "Land Issues",
    "Other"
  ];
  const insertCategory = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
  initialCategories.forEach(name => {
    insertCategory.run(Math.random().toString(36).substring(2, 11), name);
  });
}

// Seed initial admin user if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("password123", 10);
  db.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)").run(
    Math.random().toString(36).substring(2, 11),
    "admin",
    hashedPassword,
    "Super Admin"
  );
}

// Migration: Normalize admin role
db.prepare("UPDATE users SET role = 'Super Admin' WHERE username = 'admin' AND role = 'admin'").run();

// Migration: Add columns if they don't exist (for existing databases)
try { db.exec("ALTER TABLE grievances ADD COLUMN title TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN priority TEXT DEFAULT 'Medium';"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN assigned_to TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN first_name TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN last_name TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN phone_number TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN email TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN gender TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN ward TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN resolution_comment TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN resolution_report_url TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;"); } catch (e) {}

const logAction = (action: string, userId: string | null, username: string | null, details: string) => {
  try {
    const id = Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO system_logs (id, action, user_id, username, details) VALUES (?, ?, ?, ?, ?)').run(id, action, userId, username, details);
  } catch (err) {
    console.error('Failed to log action:', err);
  }
};

// Email Transporter Helper (Lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

async function sendStatusUpdateEmail(to: string, trackingNumber: string, title: string, newStatus: string) {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.warn("Email transporter not configured. Skipping email notification.");
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Mwatate Municipality" <noreply@mwatate.go.ke>',
    to,
    subject: `Update on your Grievance: ${trackingNumber}`,
    text: `Dear Citizen,\n\nThe status of your grievance "${title}" (Tracking Number: ${trackingNumber}) has been updated to: ${newStatus}.\n\nYou can track the progress of your report at ${process.env.APP_URL || 'our portal'}.\n\nThank you for your patience.\n\nMwatate Municipality`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #059669; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Mwatate Municipality</h1>
          <p style="margin: 4px 0 0 0; opacity: 0.8;">Grievance Redress Mechanism</p>
        </div>
        <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
          <h2 style="margin-top: 0; color: #0f172a;">Status Update</h2>
          <p>Dear Citizen,</p>
          <p>The status of your grievance has been updated.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Grievance</p>
            <p style="margin: 4px 0 12px 0; font-size: 18px; font-weight: bold; color: #0f172a;">${title}</p>
            <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Tracking Number</p>
            <p style="margin: 4px 0 12px 0; font-size: 18px; font-weight: bold; color: #0f172a;">${trackingNumber}</p>
            <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">New Status</p>
            <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: #059669;">${newStatus}</p>
          </div>
          <p>You can track the full progress of your report on our portal.</p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.APP_URL || '#'}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track My Grievance</a>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
          © 2026 Mwatate Municipality. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    console.log(`Notification email sent to ${to} for grievance ${trackingNumber}`);
  } catch (error) {
    console.error(`Failed to send notification email to ${to}:`, error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", true);
  
  // Force HTTPS for secure cookies behind proxy
  app.use((req, res, next) => {
    req.headers['x-forwarded-proto'] = 'https';
    next();
  });

  app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
  }));
  app.use(express.json());

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  const upload = multer({ storage });

  // Serve uploads folder statically
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  const JWT_SECRET = process.env.JWT_SECRET || "mwatate-municipality-jwt-secret";

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      
      const userRole = decoded.role;
      if (roles.includes(userRole) || userRole === 'admin' || userRole === 'Super Admin') {
        next();
      } else {
        res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };

  app.post("/api/admin/upload", requireAuth, upload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    
    if (user && bcrypt.compareSync(password, user.password)) {
      if (user.is_active === 0) {
        return res.status(403).json({ error: "Account deactivated. Please contact administrator." });
      }
      
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      logAction('LOGIN', user.id, user.username, 'User logged in successfully');
      
      res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, (req: any, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;
    
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    
    if (user && bcrypt.compareSync(oldPassword, user.password)) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, userId);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid current password" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    res.json({ user: req.user });
  });

  // API Routes
  app.post("/api/grievances", (req, res) => {
    const { title, category, description, location, first_name, last_name, phone_number, email, gender, ward, priority } = req.body;
    const id = Math.random().toString(36).substring(2, 11);
    const tracking_number = "MWT-" + Math.floor(100000 + Math.random() * 900000);
    
    try {
      const stmt = db.prepare(`
        INSERT INTO grievances (id, tracking_number, title, category, description, location, first_name, last_name, phone_number, email, gender, ward, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, tracking_number, title, category, description, location, first_name, last_name, phone_number, email, gender, ward, priority || 'Medium');
      res.json({ success: true, tracking_number });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to submit grievance" });
    }
  });

  app.get("/api/grievances/:tracking_number", (req, res) => {
    const { tracking_number } = req.params;
    const grievance = db.prepare("SELECT * FROM grievances WHERE tracking_number = ?").get(tracking_number);
    if (grievance) {
      res.json(grievance);
    } else {
      res.status(404).json({ error: "Grievance not found" });
    }
  });

  app.get("/api/admin/grievances", requireRole(['Super Admin', 'GRM Officer', 'Viewer', 'admin']), (req, res) => {
    const grievances = db.prepare("SELECT * FROM grievances ORDER BY created_at DESC").all();
    res.json(grievances);
  });

  app.patch("/api/admin/grievances/:id", requireRole(['Super Admin', 'GRM Officer', 'admin']), async (req: any, res) => {
    const { id } = req.params;
    const { status, assigned_to, resolution_comment, resolution_report_url } = req.body;
    try {
      // Get current grievance info for notification
      const grievance: any = db.prepare("SELECT * FROM grievances WHERE id = ?").get(id);
      
      if (!grievance) {
        return res.status(404).json({ error: "Grievance not found" });
      }

      if (status !== undefined && assigned_to !== undefined) {
        // Validate user exists
        if (assigned_to) {
          const user = db.prepare("SELECT id FROM users WHERE username = ?").get(assigned_to);
          if (!user) {
            return res.status(400).json({ error: "Assigned user not found" });
          }
        }
        db.prepare("UPDATE grievances SET status = ?, assigned_to = ?, resolution_comment = ?, resolution_report_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, assigned_to || null, resolution_comment || grievance.resolution_comment, resolution_report_url || grievance.resolution_report_url, id);
        logAction('UPDATE_GRIEVANCE', req.user.userId, req.user.username, `Updated status to ${status} and assigned to ${assigned_to || 'Unassigned'} for grievance ${grievance.tracking_number}`);
      } else if (status !== undefined) {
        db.prepare("UPDATE grievances SET status = ?, resolution_comment = ?, resolution_report_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, resolution_comment || grievance.resolution_comment, resolution_report_url || grievance.resolution_report_url, id);
        logAction('UPDATE_GRIEVANCE', req.user.userId, req.user.username, `Updated status to ${status} for grievance ${grievance.tracking_number}`);
      } else if (assigned_to !== undefined) {
        // Validate user exists
        if (assigned_to) {
          const user = db.prepare("SELECT id FROM users WHERE username = ?").get(assigned_to);
          if (!user) {
            return res.status(400).json({ error: "Assigned user not found" });
          }
        }
        db.prepare("UPDATE grievances SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(assigned_to || null, id);
        logAction('UPDATE_GRIEVANCE', req.user.userId, req.user.username, `Assigned grievance ${grievance.tracking_number} to ${assigned_to || 'Unassigned'}`);
      }

      // Send notification if status changed and email is provided
      if (status !== undefined && status !== grievance.status && grievance.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(grievance.email)) {
          // Fire and forget email notification
          sendStatusUpdateEmail(grievance.email, grievance.tracking_number, grievance.title || grievance.category, status);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update grievance" });
    }
  });

  // User Management Routes
  app.get("/api/admin/users", requireRole(['Super Admin', 'GRM Officer', 'Viewer', 'admin']), (req, res) => {
    const users = db.prepare("SELECT id, username, role, is_active, created_at FROM users").all();
    res.json(users);
  });

  app.post("/api/admin/users", requireRole(['Super Admin', 'admin']), (req: any, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const id = Math.random().toString(36).substring(2, 11);
      db.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)").run(id, username, hashedPassword, role);
      logAction('CREATE_USER', req.user.userId, req.user.username, `Created user ${username} with role ${role}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user (username might already exist)" });
    }
  });

  app.delete("/api/admin/users/:id", requireRole(['Super Admin', 'admin']), (req: any, res) => {
    const { id } = req.params;
    if (id === req.user.userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    try {
      const userToDelete: any = db.prepare("SELECT username FROM users WHERE id = ?").get(id);
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      if (userToDelete) {
        logAction('DELETE_USER', req.user.userId, req.user.username, `Deleted user ${userToDelete.username}`);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:id", requireRole(['Super Admin', 'admin']), (req: any, res) => {
    const { id } = req.params;
    const { role, is_active } = req.body;
    
    try {
      const targetUser: any = db.prepare("SELECT username FROM users WHERE id = ?").get(id);
      
      if (role !== undefined) {
        db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
        logAction('UPDATE_USER', req.user.userId, req.user.username, `Updated role for user ${targetUser?.username} to ${role}`);
      }
      if (is_active !== undefined) {
        // Prevent deactivating self
        if (id === req.user.userId && is_active === 0) {
          return res.status(400).json({ error: "You cannot deactivate your own account" });
        }
        db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, id);
        logAction('UPDATE_USER', req.user.userId, req.user.username, `${is_active ? 'Activated' : 'Deactivated'} user ${targetUser?.username}`);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Category Management Routes
  app.get("/api/categories", (req, res) => {
    try {
      const categories = db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", requireRole(['Super Admin', 'admin']), (req: any, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });
    try {
      const id = Math.random().toString(36).substring(2, 11);
      db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)").run(id, name);
      logAction('CREATE_CATEGORY', req.user.userId, req.user.username, `Created category ${name}`);
      res.json({ success: true, id, name });
    } catch (error) {
      res.status(500).json({ error: "Failed to create category (it might already exist)" });
    }
  });

  app.patch("/api/admin/categories/:id", requireRole(['Super Admin', 'admin']), (req: any, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });
    try {
      const oldCategory: any = db.prepare("SELECT name FROM categories WHERE id = ?").get(id);
      db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);
      logAction('UPDATE_CATEGORY', req.user.userId, req.user.username, `Renamed category from ${oldCategory?.name} to ${name}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireRole(['Super Admin', 'admin']), (req: any, res) => {
    const { id } = req.params;
    try {
      const categoryToDelete: any = db.prepare("SELECT name FROM categories WHERE id = ?").get(id);
      db.prepare("DELETE FROM categories WHERE id = ?").run(id);
      if (categoryToDelete) {
        logAction('DELETE_CATEGORY', req.user.userId, req.user.username, `Deleted category ${categoryToDelete.name}`);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  app.get("/api/admin/logs", requireRole(['Super Admin']), (req: any, res) => {
    try {
      const logs = db.prepare("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 200").all();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Catch-all for API routes to prevent falling through to SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
