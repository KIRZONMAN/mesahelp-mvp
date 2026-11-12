'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { randomBytes, scryptSync, timingSafeEqual, createHash } = require('node:crypto');

const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'mesahelp.sqlite'));
db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
// Migration v0.3 is additive. Never drop v0.2 tables or their data.
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('solicitante','coordinador')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf_token TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS tickets (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 requester_id INTEGER NOT NULL REFERENCES users(id),
 subject TEXT NOT NULL,
 description TEXT NOT NULL,
 category TEXT NOT NULL,
 priority TEXT NOT NULL CHECK(priority IN ('baja','media','alta')),
 status TEXT NOT NULL CHECK(status IN ('abierto','en_proceso','resuelto','cerrado')) DEFAULT 'abierto',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE TABLE IF NOT EXISTS ticket_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
 actor_id INTEGER NOT NULL REFERENCES users(id),
 old_status TEXT,
 new_status TEXT NOT NULL,
 note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS guest_ticket_access (
 ticket_id INTEGER PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
 code_hash TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tickets_updated ON tickets(updated_at DESC, id DESC);
`);

const GUEST_USERNAME = '__invitado__';
const sha256 = value => createHash('sha256').update(value).digest('hex');
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hex] = stored.split(':');
  try {
    const calculated = scryptSync(password, salt, 64);
    const known = Buffer.from(hex, 'hex');
    return known.length === calculated.length && timingSafeEqual(known, calculated);
  } catch { return false; }
}
function addUser(username, password, role) {
  if (!/^[a-z0-9_.-]{3,40}$/i.test(username) || username.toLowerCase() === GUEST_USERNAME) throw new Error('Nombre de usuario inválido');
  if (password.length < 12) throw new Error('Contraseña demasiado corta (mínimo 12 caracteres)');
  if (!['solicitante','coordinador'].includes(role)) throw new Error('Rol inválido');
  return db.prepare('INSERT INTO users(username,password_hash,role) VALUES (?,?,?)')
    .run(username.toLowerCase(), hashPassword(password), role);
}
function findUser(username) {
  return db.prepare('SELECT * FROM users WHERE username=?').get(String(username).toLowerCase());
}
function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const csrf = randomBytes(32).toString('hex');
  const expiry = Date.now() + 8 * 60 * 60 * 1000;
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db.prepare('INSERT INTO sessions(token_hash,user_id,csrf_token,expires_at) VALUES(?,?,?,?)')
    .run(sha256(token), userId, csrf, expiry);
  return { token, csrf };
}
function loadSession(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
  return db.prepare(`SELECT s.csrf_token AS csrf, s.expires_at, u.id, u.username, u.role
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.username<>?`).get(sha256(token), Date.now(), GUEST_USERNAME) || null;
}
function deleteSession(token) {
  if (token && /^[a-f0-9]{64}$/.test(token)) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha256(token));
}
function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {const result=fn();db.exec('COMMIT');return result;}
  catch(e) {try {db.exec('ROLLBACK');} catch {} throw e;}
}
function insertTicket(requesterId, { subject, description, category, priority }, note) {
  const result = db.prepare('INSERT INTO tickets (requester_id,subject,description,category,priority) VALUES(?,?,?,?,?)')
    .run(requesterId, subject, description, category, priority);
  const id = Number(result.lastInsertRowid);
  db.prepare('INSERT INTO ticket_events(ticket_id,actor_id,old_status,new_status,note) VALUES(?,?,?,?,?)')
    .run(id, requesterId, null, 'abierto', note);
  return id;
}
function createTicket(requesterId, fields) {
  return transaction(()=>insertTicket(requesterId, fields, 'Solicitud registrada'));
}
function guestServiceUserId() {
  const found = findUser(GUEST_USERNAME);
  if(found) return found.id;
  const secret = randomBytes(48).toString('hex');
  return Number(db.prepare('INSERT INTO users(username,password_hash,role) VALUES(?,?,?)')
    .run(GUEST_USERNAME,hashPassword(secret),'solicitante').lastInsertRowid);
}
function createGuestTicket(fields) {
  const guestId = guestServiceUserId();
  const code = 'MH-' + randomBytes(24).toString('hex').toUpperCase();
  const id = transaction(()=>{
    const ticketId=insertTicket(guestId,fields,'Solicitud registrada como invitado');
    db.prepare('INSERT INTO guest_ticket_access(ticket_id,code_hash) VALUES(?,?)').run(ticketId,sha256(code));
    return ticketId;
  });
  return {id, code};
}
const requesterSql = `CASE WHEN u.username='__invitado__' THEN 'Invitado' ELSE u.username END`;
function getTicket(id) {
  return db.prepare(`SELECT t.*,${requesterSql} AS requester FROM tickets t JOIN users u ON u.id=t.requester_id WHERE t.id=?`).get(id);
}
function listTickets(user) {
  if (user.role === 'coordinador') return db.prepare(`SELECT t.*,${requesterSql} AS requester FROM tickets t JOIN users u ON u.id=t.requester_id ORDER BY t.updated_at DESC,t.id DESC`).all();
  return db.prepare(`SELECT t.*,${requesterSql} AS requester FROM tickets t JOIN users u ON u.id=t.requester_id WHERE t.requester_id=? ORDER BY t.updated_at DESC,t.id DESC`).all(user.id);
}
function getGuestTicket(code) {
  const normalized=String(code||'').trim().toUpperCase();
  if(!/^MH-[A-F0-9]{48}$/.test(normalized))return null;
  return db.prepare(`SELECT t.*, 'Invitado' AS requester FROM guest_ticket_access a
      JOIN tickets t ON t.id=a.ticket_id WHERE a.code_hash=?`).get(sha256(normalized)) || null;
}
function isGuestTicket(id) {
  return !!db.prepare('SELECT 1 FROM guest_ticket_access WHERE ticket_id=?').get(id);
}
function getHistory(id) {
  return db.prepare(`SELECT e.*,${requesterSql} AS actor FROM ticket_events e JOIN users u ON u.id=e.actor_id WHERE e.ticket_id=? ORDER BY e.id`).all(id);
}
function updateTicketStatus(id,actorId,newStatus,note) {
  return transaction(()=>{
    const before=getTicket(id);
    if(!before)throw new Error('Ticket no encontrado');
    if(before.status===newStatus)return false;
    db.prepare('UPDATE tickets SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(newStatus,id);
    db.prepare('INSERT INTO ticket_events(ticket_id,actor_id,old_status,new_status,note) VALUES(?,?,?,?,?)')
      .run(id,actorId,before.status,newStatus,note);
    return true;
  });
}
function addTicketNote(id,actorId,note) {
  return transaction(()=>{
    const ticket=getTicket(id);
    if(!ticket)throw new Error('Ticket no encontrado');
    db.prepare('INSERT INTO ticket_events(ticket_id,actor_id,old_status,new_status,note) VALUES(?,?,?,?,?)')
      .run(id,actorId,ticket.status,ticket.status,note);
    db.prepare('UPDATE tickets SET updated_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
    return true;
  });
}
module.exports = {db,addUser,findUser,verifyPassword,createSession,loadSession,deleteSession,
  createTicket,createGuestTicket,getGuestTicket,isGuestTicket,getTicket,listTickets,getHistory,updateTicketStatus,addTicketNote};
