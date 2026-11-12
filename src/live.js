'use strict';
// Minimal server-to-browser WebSocket channel for this single-process academic MVP.
// Deliberately rejects data messages; ticket mutations continue over CSRF-protected HTTP.
const { createHash } = require('node:crypto');
const { URL } = require('node:url');
const DB = require('./db');
const clients = new Set();
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_CLIENTS = 80;
function reject(socket, code=403) {
  if(!socket.destroyed)socket.end(`HTTP/1.1 ${code} ${code===403?'Forbidden':'Bad Request'}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}
function frame(payload, opcode=1) {
  const data=Buffer.isBuffer(payload)?payload:Buffer.from(String(payload));
  if(data.length>65535)throw new Error('WebSocket message too large');
  const header=data.length<126?Buffer.from([0x80|opcode,data.length]):Buffer.from([0x80|opcode,126,data.length>>8,data.length&255]);
  return Buffer.concat([header,data]);
}
function attachLive(server, getCookie) {
  server.on('upgrade',(req,socket,head)=>{
    try {
      const uri=new URL(req.url,'http://localhost');
      if(uri.pathname!=='/live')return reject(socket,403);
      const expected=(process.env.COOKIE_SECURE==='1'?'https://':'http://')+req.headers.host;
      if(!req.headers.origin || req.headers.origin!==expected)return reject(socket,403);
      if(req.headers.upgrade?.toLowerCase()!=='websocket' || !/\bupgrade\b/i.test(req.headers.connection||'') || req.headers['sec-websocket-version']!=='13')return reject(socket,400);
      const key=req.headers['sec-websocket-key'];
      if(typeof key!=='string'||! /^[A-Za-z0-9+/]{22}==$/.test(key) || Buffer.from(key,'base64').length!==16)return reject(socket,400);
      if(clients.size>=MAX_CLIENTS)return reject(socket,403);
      const sid=getCookie(req).sid;
      const user=DB.loadSession(sid);
      if(!user)return reject(socket,403);
      const ticketParam=uri.searchParams.get('ticket');
      let ticketId=null;
      if(ticketParam!==null) {
        if(!/^[1-9]\d{0,10}$/.test(ticketParam))return reject(socket,403);
        const ticket=DB.getTicket(Number(ticketParam));
        if(!ticket || (user.role!=='coordinador' && ticket.requester_id!==user.id))return reject(socket,403);
        ticketId=ticket.id;
      }
      const accept=createHash('sha1').update(key+WS_GUID).digest('base64');
      socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
      socket.setNoDelay(true);
      const client={socket,sid,userId:user.id,role:user.role,ticketId,buffer:Buffer.alloc(0),lastPong:Date.now()};
      clients.add(client);
      socket.on('close',()=>clients.delete(client));
      socket.on('error',()=>clients.delete(client));
      socket.on('data',chunk=>{
        try {
          client.buffer=Buffer.concat([client.buffer,chunk]);
          if(client.buffer.length>8192) {socket.destroy();return;}
          while(client.buffer.length>=2){
            const b0=client.buffer[0],b1=client.buffer[1];
            const opcode=b0&15,masked=!!(b1&128),lengthCode=b1&127;
            if((b0&0x70)!==0 || !masked || lengthCode>=126 || ![8,9,10].includes(opcode)) {socket.destroy();return;}
            const len=lengthCode,required=6+len;
            if(client.buffer.length<required)break;
            const mask=client.buffer.subarray(2,6);
            const data=Buffer.from(client.buffer.subarray(6,required));
            for(let i=0;i<data.length;i++)data[i]^=mask[i%4];
            client.buffer=client.buffer.subarray(required);
            if(opcode===8){socket.end(frame(Buffer.alloc(0),8));return;}
            if(opcode===9)socket.write(frame(data,10));
            if(opcode===10)client.lastPong=Date.now();
          }
        } catch {socket.destroy();}
      });
      if(head?.length)socket.emit('data',head);
      socket.write(frame(JSON.stringify({type:'connected'})));
    } catch {socket.destroy();}
  });
  const heartbeat=setInterval(()=>{
    for(const client of clients){
      if(client.socket.destroyed){clients.delete(client);continue;}
      if(Date.now()-client.lastPong>75000){client.socket.destroy();clients.delete(client);continue;}
      try{client.socket.write(frame(Buffer.alloc(0),9));}catch{client.socket.destroy();}
    }
  },30000);
  heartbeat.unref();
  server.on('close',()=>{clearInterval(heartbeat);for(const c of clients)c.socket.destroy();clients.clear();});
}
function notifyTicket(ticketId) {
  const ticket=DB.getTicket(ticketId);
  if(!ticket)return;
  const payload=frame(JSON.stringify({type:'ticket_updated',ticketId}));
  for(const client of clients){
    if(client.socket.destroyed){clients.delete(client);continue;}
    const current=DB.loadSession(client.sid);
    if(!current){client.socket.destroy();clients.delete(client);continue;}
    if(client.ticketId!==null && client.ticketId!==ticketId)continue;
    if(current.role!=='coordinador'&&ticket.requester_id!==current.id)continue;
    try{client.socket.write(payload);}catch{client.socket.destroy();}
  }
}
module.exports={attachLive,notifyTicket};
