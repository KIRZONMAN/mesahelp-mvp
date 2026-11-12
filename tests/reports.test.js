'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const os=require('node:os');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'mesahelp-reports-test-'));
process.env.DATA_DIR=directory;
const DB=require('../src/db');
const Reports=require('../src/reports');
const {createServer}=require('../src/server');
const server=createServer();
let base, coordinator, one, two, guestCode, guestID, ownID, otherID;
const request=(method,route,fields={},cookie='')=>new Promise((resolve,reject)=>{
  const body=new URLSearchParams(fields).toString();
  const headers={...(cookie?{Cookie:cookie}:{}),...(method==='POST'?{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(body)}:{})};
  const req=http.request(new URL(route,base),{method,headers},res=>{
    const chunks=[];
    res.on('data',c=>chunks.push(c));res.on('end',()=>{
      const buffer=Buffer.concat(chunks);
      resolve({status:res.statusCode,body:buffer.toString('utf8'),buffer,headers:res.headers});
    });
  });
  req.on('error',reject);req.end(method==='POST'?body:undefined);
});
function csrfFrom(html){const m=html.match(/name="csrf" value="([a-f0-9]+)"/);assert.ok(m);return m[1];}
function cookieFrom(result,name){const p=(result.headers['set-cookie']||[]).find(v=>v.startsWith(`${name}=`));assert.ok(p);return p.split(';')[0];}
async function login(username,password){
  const form=await request('GET','/login');
  const response=await request('POST','/login',{username,password,csrf:csrfFrom(form.body)},cookieFrom(form,'precsrf'));
  assert.equal(response.status,303);return cookieFrom(response,'sid');
}
before(async()=>{
  DB.addUser('coordinador','coord-2026-very-strong','coordinador');
  DB.addUser('ana','ana-2026-very-strong','solicitante');
  DB.addUser('otro','otro-2026-very-strong','solicitante');
  const ana=DB.findUser('ana');const other=DB.findUser('otro');
  ownID=DB.createTicket(ana.id,{subject:'=SUM(1,1) formula de prueba',description:'Nota privada que NO debe exportarse',category:'Académico',priority:'alta'});
  otherID=DB.createTicket(other.id,{subject:'Caso de otro solicitante',description:'Descripción confidencial de otro solicitante',category:'Soporte técnico',priority:'baja'});
  DB.updateTicketStatus(otherID,DB.findUser('coordinador').id,'cerrado','Nota privada que NO debe salir en CSV');
  const guest=DB.createGuestTicket({subject:'Caso de invitado',description:'Descripción privada de invitado',category:'Aseo y mantenimiento',priority:'media'});
  guestID=guest.id;guestCode=guest.code;
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
  coordinator=await login('coordinador','coord-2026-very-strong');
  one=await login('ana','ana-2026-very-strong');
  two=await login('otro','otro-2026-very-strong');
});

test('reportes: acceso anónimo a ambos endpoints requiere autenticación',async()=>{
  for(const route of ['/reportes','/reportes.csv']){
    const response=await request('GET',route);
    assert.equal(response.status,303);assert.equal(response.headers.location,'/login');
  }
});

test('reportes: el coordinador ve el universo general y todas las agrupaciones',async()=>{
  const report=await request('GET','/reportes',{},coordinator);
  assert.equal(report.status,200);
  assert.match(report.body,/Reportes de solicitudes/);
  assert.match(report.body,/>3<\/strong>/);
  for(const name of ['Por estado','Por categoría','Por prioridad','Aseo y mantenimiento','Cerrado','Alta','Media','Baja'])assert.ok(report.body.includes(name),name);
  assert.match(report.body,/Exportar CSV/);
  assert.match(report.body,/Incluye los tickets del sistema/);
});

test('reportes: barras nativas muestran proporciones bajo la CSP y ceros reales',async()=>{
  const response=await request('GET','/reportes',{},coordinator);
  assert.equal(response.status,200);
  assert.match(response.headers['content-security-policy'],/style-src 'self'/);
  assert.match(response.body,/<progress class="report-progress" max="3" value="0" aria-label="En proceso">0 de 3<\/progress>/);
  assert.match(response.body,/<progress class="report-progress" max="3" value="2" aria-label="Abierto">2 de 3<\/progress>/);
  assert.doesNotMatch(response.body,/class="report-fill" style=/);
});

test('reportes: cada solicitante ve únicamente sus propios datos',async()=>{
  for(const session of [one,two]){
    const report=await request('GET','/reportes',{},session);
    assert.equal(report.status,200);assert.match(report.body,/Resumen de mis solicitudes/);
    assert.match(report.body,/>1<\/strong>/);
    assert.match(report.body,/Solo incluye tus propias solicitudes/);
  }
  const anaCsv=await request('GET','/reportes.csv',{},one);
  assert.equal(anaCsv.status,200);assert.match(anaCsv.body,/SUM\(1,1\)/);
  assert.doesNotMatch(anaCsv.body,/Caso de otro solicitante|Caso de invitado/);
  const otherCsv=await request('GET','/reportes.csv',{},two);
  assert.equal(otherCsv.status,200);assert.match(otherCsv.body,/Caso de otro solicitante/);
  assert.doesNotMatch(otherCsv.body,/SUM\(1,1\)|Caso de invitado/);
});

test('reportes: CSV del coordinador incluye invitados pero no detalles ni códigos privados',async()=>{
  const result=await request('GET','/reportes.csv',{},coordinator);
  assert.equal(result.status,200);
  assert.match(result.headers['content-type'],/^text\/csv; charset=utf-8$/);
  assert.match(result.headers['content-disposition'],/attachment/);
  assert.ok(result.buffer.subarray(0,3).equals(Buffer.from([0xef,0xbb,0xbf])),'BOM UTF-8');
  const text=result.body;
  assert.equal(text.split('\r\n').filter(Boolean).length,4,'Cabecera + 3 tickets');
  assert.match(text,/Caso de invitado/);
  assert.match(text,/"Invitado"/);
  assert.match(text,/"0003"/);
  assert.doesNotMatch(text,/Nota privada|Descripción privada|Descripción confidencial/);
  assert.ok(!text.includes(guestCode),'No exportar el código de invitado');
});

test('reportes: CSV contiene protección de fórmulas y escapado de comillas y saltos',()=>{
  assert.equal(Reports.csvCell('=1+2'), '"\'=1+2"');
  assert.equal(Reports.csvCell('  -SUM(1)'), '"\'  -SUM(1)"');
  assert.equal(Reports.csvCell('@IMPORTXML(A1)'), '"\'@IMPORTXML(A1)"');
  assert.equal(Reports.csvCell('Texto "normal", otra línea\ncontinúa'),'"Texto ""normal"", otra línea\ncontinúa"');
  assert.equal(Reports.csvCell('Ejemplo común'),'"Ejemplo común"');
  const csv=Reports.exportCsv([{id:25,subject:'=SUM(1,1)',requester:'ana',category:'Académico',priority:'alta',status:'abierto',created_at:'2026-11-11 01:00:00',updated_at:'2026-11-11 01:00:00'}]);
  assert.ok(csv.startsWith('\ufeff'));
  assert.ok(csv.includes('"\'=SUM(1,1)"'));
  assert.ok(csv.endsWith('\r\n'));
});

test('reportes: todas las agrupaciones suman el universo y el conjunto vacío es válido',()=>{
  const rows=DB.listTickets(DB.findUser('coordinador'));
  const s=Reports.summarize(rows);
  assert.equal(s.total,3);
  for(const collection of [s.byStatus,s.byCategory,s.byPriority])assert.equal(collection.reduce((n,item)=>n+item.count,0),3);
  const empty=Reports.summarize([]);
  assert.equal(empty.total,0);
  for(const collection of [empty.byStatus,empty.byCategory,empty.byPriority])assert.equal(collection.reduce((n,item)=>n+item.count,0),0);
});

after(async()=>{
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  DB.db.close();
  fs.rmSync(directory,{recursive:true,force:true});
});
