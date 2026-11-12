'use strict';
const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const net=require('node:net');
const {randomBytes}=require('node:crypto');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mesahelp-v03-'));
process.env.DATA_DIR=dir;
const DB=require('../src/db');
const {createServer}=require('../src/server');
const server=createServer();
let base,port;
const sockets=[];
const csrfFrom=html=>{const v=html.match(/name="csrf" value="([a-f0-9]+)"/);assert.ok(v,'CSRF missing');return v[1];};
const cookieFrom=(resp,name)=>{
 const c=(resp.headers['set-cookie']||[]).find(x=>x.startsWith(name+'='));
 assert.ok(c,`${name} cookie missing`);return c.split(';')[0];
};
function request(method,url,form={},cookie=''){
 return new Promise((resolve,reject)=>{
  const data=new URLSearchParams(form).toString();
  const req=http.request(new URL(url,base),{method,headers:{...(cookie?{Cookie:cookie}:{}),...(method==='POST'?{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(data)}:{})}},res=>{
   let body='';res.setEncoding('utf8');res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,body,headers:res.headers}));
  });req.on('error',reject);req.end(method==='POST'?data:undefined);
 });
}
async function login(username,password){
 const first=await request('GET','/login');
 const resp=await request('POST','/login',{username,password,csrf:csrfFrom(first.body)},cookieFrom(first,'precsrf'));
 assert.equal(resp.status,303);return cookieFrom(resp,'sid');
}
function websocketHandshake(cookie,origin,pathName='/live'){
 return new Promise((resolve,reject)=>{
  const socket=net.createConnection({host:'127.0.0.1',port});sockets.push(socket);
  let all=Buffer.alloc(0);
  socket.once('connect',()=>{
   socket.write(`GET ${pathName} HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: ${randomBytes(16).toString('base64')}\r\nOrigin: ${origin||base}\r\n${cookie?`Cookie: ${cookie}\r\n`:''}\r\n`);
  });
  const timeout=setTimeout(()=>{reject(new Error('WS handshake timeout'));socket.destroy();},2000);
  const onData=b=>{
    all=Buffer.concat([all,b]);
    if(!all.includes(Buffer.from('\r\n\r\n')))return;
    clearTimeout(timeout);socket.off('data',onData);
    resolve({socket,head:all.toString('utf8')});
  };
  socket.on('data',onData);socket.once('error',reject);
 });
}
function waitForSignal(socket,pattern,action){
 return new Promise((resolve,reject)=>{
  let str='';
  const timeout=setTimeout(()=>{socket.off('data',recv);reject(new Error(`WebSocket event missing: ${pattern}`));},2000);
  function recv(chunk){str+=chunk.toString('utf8');if(str.includes(pattern)){clearTimeout(timeout);socket.off('data',recv);resolve(str);}}
  socket.on('data',recv);
  action().catch(e=>{clearTimeout(timeout);socket.off('data',recv);reject(e);});
 });
}
test('MesaHelp v0.3: guest access, categories, notes, permissions and real-time signaling',async()=>{
 DB.addUser('ana','ana-pass-strong-2026','solicitante');
 DB.addUser('otro','otro-pass-strong-2026','solicitante');
 DB.addUser('coordinador','coordinador-strong-pass-2026','coordinador');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 port=server.address().port;base=`http://127.0.0.1:${port}`;
 const a=await login('ana','ana-pass-strong-2026');
 const o=await login('otro','otro-pass-strong-2026');
 const c=await login('coordinador','coordinador-strong-pass-2026');
 const form=await request('GET','/tickets/new',{},a);
 assert.match(form.body,/Aseo y mantenimiento/);
 const csrf=csrfFrom(form.body);
 const created=await request('POST','/tickets',{csrf,subject:'Incidencia de mantenimiento',description:'El salón necesita mantenimiento general del edificio.',category:'Aseo y mantenimiento',priority:'media'},a);
 assert.equal(created.status,303);
 const id=Number(created.headers.location.match(/\/tickets\/(\d+)/)[1]);
 assert.equal(DB.getTicket(id).category,'Aseo y mantenimiento');
 assert.equal((await request('GET',`/tickets/${id}`,{},o)).status,403);
 const coordinatorForm=await request('GET',`/tickets/${id}`,{},c);
 const coordCsrf=csrfFrom(coordinatorForm.body);
 let change=await request('POST',`/tickets/${id}/notes`,{csrf:coordCsrf,note:'Revisión sin cambiar el estado'},c);
 assert.equal(change.status,303);
 assert.equal(DB.getTicket(id).status,'abierto');
 assert.equal(DB.getHistory(id).length,2);
 assert.equal(DB.getHistory(id)[1].old_status,'abierto');
 assert.equal(DB.getHistory(id)[1].new_status,'abierto');
 const seeNote=await request('GET',`/tickets/${id}`,{},a);
 assert.match(seeNote.body,/Observación de seguimiento/);
 change=await request('POST',`/tickets/${id}/notes`,{csrf,note:'Ataque de solicitante'},a);
 assert.equal(change.status,403);
 change=await request('POST',`/tickets/${id}/notes`,{csrf:'wrong',note:'Ataque CSRF'},c);
 assert.equal(change.status,403);
 assert.equal((await request('GET','/')).status,303);
 const guestForm=await request('GET','/guest/new');
 const guestCookie=cookieFrom(guestForm,'precsrf');
 assert.match(guestForm.body,/Aseo y mantenimiento/);
 const guestFields={csrf:csrfFrom(guestForm.body),subject:'Solicitud de aseo invitado',description:'Hay una zona de estudio que requiere limpieza.',category:'Aseo y mantenimiento',priority:'alta'};
 let guestResp=await request('POST','/guest/tickets',guestFields);
 assert.equal(guestResp.status,403,'guest CSRF requires cookie');
 guestResp=await request('POST','/guest/tickets',guestFields,guestCookie);
 assert.equal(guestResp.status,201);
 const guestCode=guestResp.body.match(/MH-[A-F0-9]{48}/)?.[0];assert.ok(guestCode);
 const guestTicketId=Number(guestResp.body.match(/Ticket #(\d+)/)[1]);
 assert.notEqual(guestTicketId,id);
 assert.equal(DB.getGuestTicket(guestCode).id,guestTicketId);
 assert.equal(DB.db.prepare('SELECT code_hash FROM guest_ticket_access WHERE ticket_id=?').get(guestTicketId).code_hash.length,64);
 assert.equal((await request('GET',`/tickets/${guestTicketId}`,{},a)).status,403,'registered user cannot read guest ticket');
 assert.equal((await request('GET',`/tickets/${guestTicketId}`)).status,303,'anonymous cannot enumerate tickets');
 const follow=await request('GET','/seguimiento',{},guestCookie);
 const followCsrf=csrfFrom(follow.body);
 const followResult=await request('POST','/seguimiento',{csrf:followCsrf,code:guestCode},guestCookie);
 assert.equal(followResult.status,200);assert.match(followResult.body,/Solicitud de aseo invitado/);
 assert.doesNotMatch(followResult.body,new RegExp(guestCode)); // secret is not reflected
 const wrongCode=await request('POST','/seguimiento',{csrf:followCsrf,code:'MH-'+('F'.repeat(48))},guestCookie);
 assert.match(wrongCode.body,/Código de seguimiento no válido/);
 const coordinatorDashboard=await request('GET','/',{},c);
 assert.match(coordinatorDashboard.body,/Invitado/);
 assert.match(coordinatorDashboard.body,/RESUELTOS/);
 // El explorador jamás crea una ruta nueva que salte los permisos del servidor.
 assert.match(coordinatorDashboard.body,/data-ticket-explorer/);
 assert.match(coordinatorDashboard.body,/src="\/explorer\.js"/);
 assert.match(coordinatorDashboard.body,/data-explorer-row/);
 const requesterDashboard=await request('GET','/',{},a);
 const otherDashboard=await request('GET','/',{},o);
 assert.match(requesterDashboard.body,/Incidencia de mantenimiento/);
 assert.doesNotMatch(requesterDashboard.body,/Solicitud de aseo invitado/);
 assert.doesNotMatch(otherDashboard.body,/Incidencia de mantenimiento|Solicitud de aseo invitado/);
 assert.equal((requesterDashboard.body.match(/data-explorer-row /g)||[]).length,1);
 assert.equal((otherDashboard.body.match(/data-explorer-row /g)||[]).length,0);
 const publicScript=await request('GET','/explorer.js');
 assert.equal(publicScript.status,200);
 assert.match(publicScript.headers['content-type'],/javascript/);
 assert.match(publicScript.body,/MesaHelpExplorer/);
 // WebSocket must be both session-authenticated and same-origin.
 const forbidden=await websocketHandshake('',base,'/live');assert.match(forbidden.head,/HTTP\/1.1 403/);forbidden.socket.destroy();
 const badOrigin=await websocketHandshake(c,'https://evil.example','/live');assert.match(badOrigin.head,/HTTP\/1.1 403/);badOrigin.socket.destroy();
 const noAccess=await websocketHandshake(o,base,`/live?ticket=${id}`);assert.match(noAccess.head,/HTTP\/1.1 403/);noAccess.socket.destroy();
 const first=await websocketHandshake(a,base,`/live?ticket=${id}`);assert.match(first.head,/101 Switching Protocols/);
 const adminWs=await websocketHandshake(c,base,'/live');assert.match(adminWs.head,/101 Switching Protocols/);
 const notice=await waitForSignal(first.socket,'ticket_updated',()=>request('POST',`/tickets/${id}/status`,{csrf:coordCsrf,status:'en_proceso',note:'Ya se está gestionando'},c));
 assert.match(notice,/ticket_updated/);
 assert.equal(DB.getTicket(id).status,'en_proceso');
 const adminNotice=await waitForSignal(adminWs.socket,'ticket_updated',()=>request('POST',`/tickets/${id}/notes`,{csrf:coordCsrf,note:'Nueva nota informativa'},c));
 assert.match(adminNotice,/ticket_updated/);
 // Guest updates never grant unrestricted access through WebSockets.
 assert.match((await websocketHandshake(a,base,`/live?ticket=${guestTicketId}`)).head,/HTTP\/1.1 403/);
});
after(async()=>{
 for(const socket of sockets)socket.destroy();
 if(server.listening)await new Promise(resolve=>server.close(resolve));
 DB.db.close();fs.rmSync(dir,{recursive:true,force:true});
});
