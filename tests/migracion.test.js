'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {DatabaseSync}=require('node:sqlite');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mesahelp-legacy-'));
// Simulate a populated 0.2 database. The 0.3 module must not destroy it.
const previous=new DatabaseSync(path.join(tmp,'mesahelp.sqlite'));
previous.exec(`
PRAGMA foreign_keys=ON;
CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('solicitante','coordinador')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf_token TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE tickets(id INTEGER PRIMARY KEY AUTOINCREMENT,requester_id INTEGER NOT NULL REFERENCES users(id),subject TEXT NOT NULL,description TEXT NOT NULL,category TEXT NOT NULL,priority TEXT NOT NULL CHECK(priority IN ('baja','media','alta')),status TEXT NOT NULL CHECK(status IN ('abierto','en_proceso','resuelto','cerrado')) DEFAULT 'abierto',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ticket_events(id INTEGER PRIMARY KEY AUTOINCREMENT,ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,actor_id INTEGER NOT NULL REFERENCES users(id),old_status TEXT,new_status TEXT NOT NULL,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO users(username,password_hash,role) VALUES('ana','hash-demo','solicitante');
INSERT INTO tickets(requester_id,subject,description,category,priority,status) VALUES(1,'Ticket original conservado','Solicitud registrada antes de migrar','Académico','media','cerrado');
INSERT INTO ticket_events(ticket_id,actor_id,old_status,new_status,note) VALUES(1,1,NULL,'abierto','Solicitud registrada');
INSERT INTO ticket_events(ticket_id,actor_id,old_status,new_status,note) VALUES(1,1,'abierto','cerrado','Se cerró antes de migrar');
`);
previous.close();
test('migración aditiva v0.2 a v0.3 preserva tickets y eventos',()=>{
 const previousDataDir=process.env.DATA_DIR;
 process.env.DATA_DIR=tmp;
 const db=require('../src/db');
 assert.equal(db.getTicket(1).status,'cerrado');
 assert.equal(db.getHistory(1).length,2);
 assert.equal(db.getTicket(1).subject,'Ticket original conservado');
 assert.ok(db.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='guest_ticket_access'").get());
 db.addTicketNote(1,1,'Observación añadida tras actualización');
 assert.equal(db.getTicket(1).status,'cerrado');
 assert.equal(db.getHistory(1).length,3);
 db.db.close();
 if(previousDataDir===undefined)delete process.env.DATA_DIR;else process.env.DATA_DIR=previousDataDir;
});
const {after}=require('node:test');
after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
