import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import session from "express-session";
import bcrypt from "bcryptjs";

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
    contact_info TEXT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial admin user if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("password123", 10);
  db.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)").run(
    Math.random().toString(36).substring(2, 11),
    "admin",
    hashedPassword,
    "admin"
  );
}

// Migration: Add columns if they don't exist (for existing databases)
try { db.exec("ALTER TABLE grievances ADD COLUMN title TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN priority TEXT DEFAULT 'Medium';"); } catch (e) {}
try { db.exec("ALTER TABLE grievances ADD COLUMN assigned_to TEXT;"); } catch (e) {}

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

  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || "mwatate-municipality-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if ((req.session as any).userId) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    
    if (user && bcrypt.compareSync(password, user.password)) {
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;
      (req.session as any).role = user.role;
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Failed to logout" });
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if ((req.session as any).userId) {
      res.json({ 
        user: { 
          id: (req.session as any).userId, 
          username: (req.session as any).username, 
          role: (req.session as any).role 
        } 
      });
    } else {
      res.status(401).json({ error: "Not logged in" });
    }
  });

  // API Routes
  app.post("/api/grievances", (req, res) => {
    const { title, category, description, location, contact_info, priority } = req.body;
    const id = Math.random().toString(36).substring(2, 11);
    const tracking_number = "MWT-" + Math.floor(100000 + Math.random() * 900000);
    
    try {
      const stmt = db.prepare(`
        INSERT INTO grievances (id, tracking_number, title, category, description, location, contact_info, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, tracking_number, title, category, description, location, contact_info, priority || 'Medium');
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

  app.get("/api/admin/grievances", requireAuth, (req, res) => {
    const grievances = db.prepare("SELECT * FROM grievances ORDER BY created_at DESC").all();
    res.json(grievances);
  });

  app.patch("/api/admin/grievances/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { status, assigned_to } = req.body;
    try {
      // Get current grievance info for notification
      const grievance = db.prepare("SELECT * FROM grievances WHERE id = ?").get(id);
      
      if (!grievance) {
        return res.status(404).json({ error: "Grievance not found" });
      }

      if (status !== undefined && assigned_to !== undefined) {
        db.prepare("UPDATE grievances SET status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, assigned_to, id);
      } else if (status !== undefined) {
        db.prepare("UPDATE grievances SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
      } else if (assigned_to !== undefined) {
        db.prepare("UPDATE grievances SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(assigned_to, id);
      }

      // Send notification if status changed and contact_info is an email
      if (status !== undefined && status !== grievance.status && grievance.contact_info) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(grievance.contact_info)) {
          // Fire and forget email notification
          sendStatusUpdateEmail(grievance.contact_info, grievance.tracking_number, grievance.title || grievance.category, status);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update grievance" });
    }
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
