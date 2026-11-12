'use strict';
const { test, after }=require('node:test');
const assert=require('node:assert/strict');
const os=require('node:os');
const path=require('node:path');
const fs=require('node:fs');
const http=require('node:http');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mesahelp-test-'));
process.env.DATA_DIR=dir;
const db=require('../src/db');
const {createServer}=require('../src/server');
const server=createServer();
let base;
const request=(method,url,fields={},cookie='')=>new Promise((resolve,reject)=>{
 const body=new URLSearchParams(fields).toString();
 const req=http.request(new URL(url,base),{method,headers:{...(cookie?{Cookie:cookie}:{}),...(method==='POST'?{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(body)}:{})}},res=>{
  let data='';res.setEncoding('utf8');res.on('data',c=>data+=c);res.on('end',()=>resolve({status:res.statusCode,body:data,headers:res.headers}));
 });req.on('error',reject);req.end(method==='POST'?body:undefined);
});
function csrfFrom(html){ const m=html.match(/name="csrf" value="([a-f0-9]+)"/);assert.ok(m,'CSRF debe figurar');return m[1];}
function cookieFrom(resp,name){const parts=resp.headers['set-cookie']||[];const p=parts.find(v=>v.startsWith(`${name}=`));assert.ok(p,`${name} cookie`);return p.split(';')[0];}
async function login(username,password){const first=await request('GET','/login');const csrf=csrfFrom(first.body);const cookie=cookieFrom(first,'precsrf');const resp=await request('POST','/login',{username,password,csrf},cookie);assert.equal(resp.status,303);return cookieFrom(resp,'sid');}
test('MVP: registro, roles, control de acceso, estados, historial y CSRF',async()=>{
 db.addUser('ana','clave-de-ana-2026','solicitante');db.addUser('coordinador','clave-admin-2026','coordinador');db.addUser('otro','clave-de-otro-2026','solicitante');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base=`http://127.0.0.1:${server.address().port}`;
 // Regresión: dos pestañas de login conservan el mismo desafío CSRF.
 const tabA=await request('GET','/login');
 const preCookie=cookieFrom(tabA,'precsrf');
 const tabB=await request('GET','/login',{},preCookie);
 assert.equal(tabB.status,200);
 assert.equal(csrfFrom(tabA.body),csrfFrom(tabB.body),'No rotar token en pestañas abiertas');
 assert.equal((tabB.headers['set-cookie']||[]).length,0,'No sustituir la cookie vigente');
 const stale=await request('POST','/login',{username:'ana',password:'invalida',csrf:csrfFrom(tabA.body)},preCookie);
 assert.equal(stale.status,200,'Formulario de primera pestaña sigue superando CSRF');
 assert.match(stale.body,/Usuario o contraseña incorrectos/);
 const rejected=await request('POST','/login',{username:'ana',password:'invalida',csrf:csrfFrom(tabA.body)});
 assert.equal(rejected.status,403,'Un POST sin cookie debe ser rechazado');
 const anonymous=await request('GET','/');assert.equal(anonymous.status,303);assert.equal(anonymous.headers.location,'/login');
 const a=await login('ana','clave-de-ana-2026');
 let page=await request('GET','/tickets/new',{},a);assert.equal(page.status,200);
 const csrf=csrfFrom(page.body);
 let resp=await request('POST','/tickets',{csrf,subject:'Error al acceder al campus',description:'Al abrir la aplicación no puedo iniciar sesión.',category:'Soporte técnico',priority:'alta'},a);
 assert.equal(resp.status,303);assert.match(resp.headers.location,/^\/tickets\/\d+/);
 const id=Number(resp.headers.location.match(/\d+/)[0]);
 page=await request('GET',`/tickets/${id}`,{},a);assert.equal(page.status,200);assert.match(page.body,/Abierto/);assert.match(page.body,/Solicitud registrada/);
 resp=await request('POST',`/tickets/${id}/status`,{csrf,status:'cerrado'},a);assert.equal(resp.status,403,'Solicitante no puede cerrar');
 const o=await login('otro','clave-de-otro-2026');
 page=await request('GET',`/tickets/${id}`,{},o);assert.equal(page.status,403,'Otro solicitante no accede');
 const c=await login('coordinador','clave-admin-2026');
 page=await request('GET',`/tickets/${id}`,{},c);assert.equal(page.status,200);
 const adminCsrf=csrfFrom(page.body);
 resp=await request('POST',`/tickets/${id}/status`,{csrf:'incorrecto',status:'en_proceso'},c);assert.equal(resp.status,403,'CSRF protegido');
 for(const status of ['en_proceso','resuelto','cerrado']){
  resp=await request('POST',`/tickets/${id}/status`,{csrf:adminCsrf,status,note:`Cambio a ${status}`},c);assert.equal(resp.status,303);
 }
 page=await request('GET',`/tickets/${id}`,{},a);assert.equal(page.status,200);assert.match(page.body,/Cerrado/);assert.match(page.body,/Cambio a cerrado/);
 assert.equal(db.getHistory(id).length,4);
 resp=await request('POST','/logout',{csrf},a);assert.equal(resp.status,303);
 page=await request('GET',`/tickets/${id}`,{},a);assert.equal(page.status,303);
});
after(async()=>{if(server.listening)await new Promise(r=>server.close(r));db.db.close();fs.rmSync(dir,{recursive:true,force:true});});
