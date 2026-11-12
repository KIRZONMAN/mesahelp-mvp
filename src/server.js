'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes,timingSafeEqual}=require('node:crypto');
const DB=require('./db');
const Reports=require('./reports');
const {attachLive,notifyTicket}=require('./live');

const STATES={abierto:'Abierto',en_proceso:'En proceso',resuelto:'Resuelto',cerrado:'Cerrado'};
const CATEGORIES=['Soporte técnico','Académico','Administrativo','Aseo y mantenimiento','Otro'];
const PRIORITIES=['baja','media','alta'];
const clean=value=>String(value??'').trim();
const esc=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function equal(a,b){const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&x.length>0&&timingSafeEqual(x,y);}
function cookies(req){const out={};for(const part of (req.headers.cookie||'').split(';')){const i=part.indexOf('=');if(i>0)out[part.slice(0,i).trim()]=part.slice(i+1).trim();}return out;}
function secureFlag(){return process.env.COOKIE_SECURE==='1'?'; Secure':'';}
function security(res){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ws: wss:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader('Cache-Control','no-store');
}
function send(res,status,body,type='text/html; charset=utf-8') {security(res);res.writeHead(status,{'Content-Type':type});res.end(body);}
function redirect(res,to){security(res);res.writeHead(303,{Location:to});res.end();}
function issuePrecsrf(req,res){
  const existing=cookies(req).precsrf;
  const csrf=/^[a-f0-9]{48}$/.test(existing||'')?existing:randomBytes(24).toString('hex');
  if(csrf!==existing)res.setHeader('Set-Cookie',`precsrf=${csrf}; Path=/; HttpOnly; SameSite=Lax${secureFlag()}`);
  return csrf;
}
const date=v=>new Date(String(v).replace(' ','T')+'Z').toLocaleString('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const pill=status=>`<span class="status ${esc(status)}"><span class="status-dot"></span>${esc(STATES[status]||status)}</span>`;
const formToken=csrf=>`<input type="hidden" name="csrf" value="${esc(csrf)}">`;
function layout({title,user,content,live=false,explorer=false}){
  const nav=user?`<aside class="side"><div class="brand"><span class="brandmark">✳</span><span>Mesa<span class="brandaccent">Help</span></span></div><div class="sidelabel">ESPACIO DE TRABAJO</div><nav><a href="/" class="side-link">▦ &nbsp; Tickets</a><a href="/tickets/new" class="side-link">＋ &nbsp; Nueva solicitud</a><a href="/reportes" class="side-link">▤ &nbsp; Reportes</a></nav><div class="side-bottom"><div class="avatar">${esc(user.username.slice(0,1).toUpperCase())}</div><div><strong>${esc(user.username)}</strong><small>${user.role==='coordinador'?'Coordinación':'Solicitante'}</small></div><form method="post" action="/logout">${formToken(user.csrf)}<button class="logout" title="Cerrar sesión">Salir</button></form></div></aside>`:'';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · MesaHelp</title><link rel="stylesheet" href="/styles.css">${explorer?'<script src="/explorer.js" defer></script>':''}${live?'<script src="/live.js" defer></script>':''}</head><body class="${user?'app':'auth-page'}">${nav}<main class="main">${content}</main></body></html>`;
}
function publicHeader(label){return `<header class="topbar"><a href="/login">✳ MesaHelp</a><span>${esc(label)}</span></header>`;}
function showLogin(req,res,msg=''){
  const csrf=issuePrecsrf(req,res);
  return send(res,200,layout({title:'Acceso',content:`<div class="login-wrap"><div class="login-visual"><span class="mini-label">MESA DE AYUDA · PROYECTO ACADÉMICO</span><h1>Menos ruido.<br><em>Más soluciones.</em></h1><p>Solicitudes claras, seguimiento sencillo y un historial transparente. Todo lo importante, en un solo lugar.</p><div class="login-art"><div class="art-card"><span>✓</span><strong>Solicitud registrada</strong><small>Ticket #0001 · Abierto</small></div><div class="art-card shift"><span>↗</span><strong>Seguimiento activo</strong><small>Estado: En proceso</small></div></div><footer>MesaHelp v0.3 · Seguimiento académico</footer></div><div class="login-form"><div class="mobile-brand">✳ MesaHelp</div><span class="eyebrow">BIENVENIDO</span><h2>Iniciar sesión</h2><p>Accede con tu usuario asignado.</p>${msg?`<div class="alert">${esc(msg)}</div>`:''}<form method="post" action="/login">${formToken(csrf)}<label>Usuario<input name="username" autocomplete="username" maxlength="40" required placeholder="Tu usuario"></label><label>Contraseña<input type="password" name="password" autocomplete="current-password" required placeholder="Tu contraseña"></label><button class="btn primary full">Entrar al sistema →</button></form><div class="guest-actions"><a href="/guest/new">Registrar solicitud como invitado</a><a href="/seguimiento">Consultar ticket de invitado</a></div><small>Las cuentas de prueba se generan localmente mediante el script de demostración.</small></div></div>`}));
}
function categoryOptions(){return CATEGORIES.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');}
function ticketFields(){return `<label>Asunto <span>*</span><input name="subject" minlength="5" maxlength="120" required placeholder="Ej. Solicitud de aseo en el salón 204"></label><div class="form-grid"><label>Categoría<select name="category">${categoryOptions()}</select></label><label>Prioridad<select name="priority"><option value="baja">Baja</option><option value="media" selected>Media</option><option value="alta">Alta</option></select></label></div><label>Descripción <span>*</span><textarea name="description" minlength="10" maxlength="2000" rows="7" required placeholder="Describe la necesidad y los detalles importantes para su seguimiento."></textarea></label>`;}
function validateTicket(form){
  const fields={subject:clean(form.subject),description:clean(form.description),category:clean(form.category),priority:clean(form.priority)};
  return fields.subject.length>=5&&fields.subject.length<=120&&fields.description.length>=10&&fields.description.length<=2000&&CATEGORIES.includes(fields.category)&&PRIORITIES.includes(fields.priority)?fields:null;
}
function newTicketForm(user,error=''){
  return layout({title:'Nueva solicitud',user,content:`<header class="topbar">MESA DE AYUDA / NUEVA SOLICITUD</header><div class="page narrow"><a class="back" href="/">← Volver a tickets</a><div class="page-heading"><div><span class="eyebrow">CREAR TICKET</span><h1>Nueva solicitud</h1><p>Describe la necesidad para que coordinación pueda darle seguimiento.</p></div></div>${error?`<div class="alert">${esc(error)}</div>`:''}<form class="panel ticket-form" method="post" action="/tickets">${formToken(user.csrf)}${ticketFields()}<div class="form-footer"><span>El ticket iniciará en estado «Abierto».</span><button class="btn primary">Registrar solicitud →</button></div></form></div>`});
}
function guestTicketForm(req,res,error=''){
  const csrf=issuePrecsrf(req,res);
  return send(res,200,layout({title:'Solicitud como invitado',content:`${publicHeader('REGISTRO COMO INVITADO')}<div class="page narrow"><a class="back" href="/login">← Volver al acceso</a><div class="page-heading"><div><span class="eyebrow">SIN CREAR CUENTA</span><h1>Solicitud como invitado</h1><p>Recibirás un código privado para consultar el seguimiento. Guárdalo: no podemos recuperarlo.</p></div></div>${error?`<div class="alert">${esc(error)}</div>`:''}<form class="panel ticket-form" method="post" action="/guest/tickets">${formToken(csrf)}<div class="honeypot" aria-hidden="true"><label>No llenar este campo<input name="website" tabindex="-1" autocomplete="off"></label></div>${ticketFields()}<div class="form-footer"><span>No envíes contraseñas ni información sensible en la descripción.</span><button class="btn primary">Crear ticket como invitado →</button></div></form></div>`}));
}
function guestCreated(id,code){
  return layout({title:'Ticket de invitado creado',content:`${publicHeader('TICKET REGISTRADO')}<div class="page narrow"><div class="panel"><span class="eyebrow">SOLICITUD REGISTRADA</span><h1>Ticket #${String(id).padStart(4,'0')}</h1><p>Tu solicitud fue registrada correctamente. Copia y guarda este código de seguimiento privado.</p><div class="tracking-code"><strong>${esc(code)}</strong></div><p class="important">Este código se muestra una sola vez. Cualquier persona que lo conozca podrá ver el seguimiento del ticket.</p><a class="btn primary" href="/seguimiento">Consultar seguimiento →</a></div></div>`});
}
function trackingForm(req,res,error='',ticket=null,events=[]){
  const csrf=issuePrecsrf(req,res);
  const result=ticket?`<div class="panel"><div class="section-head"><h2>Ticket #${String(ticket.id).padStart(4,'0')} · ${esc(ticket.subject)}</h2>${pill(ticket.status)}</div><div class="kv"><div><small>CATEGORÍA</small><strong>${esc(ticket.category)}</strong></div><div><small>PRIORIDAD</small><strong>${esc(ticket.priority)}</strong></div><div><small>ÚLTIMA ACTIVIDAD</small><strong>${esc(date(ticket.updated_at))}</strong></div></div><p class="description">${esc(ticket.description)}</p><h3>Historial de seguimiento</h3><div class="timeline">${timeline(events)}</div></div>`:'';
  return send(res,200,layout({title:'Consultar ticket',content:`${publicHeader('SEGUIMIENTO DE INVITADOS')}<div class="page narrow"><a href="/login" class="back">← Volver al acceso</a><div class="page-heading"><div><span class="eyebrow">CONSULTA PRIVADA</span><h1>Seguimiento de invitado</h1><p>Introduce el código entregado al crear el ticket. No necesitas iniciar sesión.</p></div></div>${error?`<div class="alert">${esc(error)}</div>`:''}<form class="panel ticket-form tracking-form" method="post" action="/seguimiento">${formToken(csrf)}<label>Código de seguimiento<input type="text" name="code" required maxlength="51" autocomplete="off" placeholder="MH-..."></label><button class="btn primary">Consultar ticket →</button></form>${result}</div>`}));
}
function timeline(events){return events.map(e=>{
  const initial=e.old_status===null;
  const noteOnly=!initial&&e.old_status===e.new_status;
  const label=initial?'Solicitud registrada':noteOnly?'Observación de seguimiento':`${STATES[e.old_status]||e.old_status} → ${STATES[e.new_status]||e.new_status}`;
  return `<div class="event"><div class="event-line"></div><div class="event-body"><strong>${esc(label)}</strong><small>${esc(e.actor)} · ${esc(date(e.created_at))}</small>${e.note?`<p>${esc(e.note)}</p>`:''}</div></div>`;
 }).join('');}
function dashboard(user,tickets){
  const counts=Object.fromEntries(Object.keys(STATES).map(s=>[s,tickets.filter(t=>t.status===s).length]));
  const stat=(title,value,label)=>`<div class="stat"><small>${title}</small><strong>${value}</strong><span>${label}</span></div>`;
  const cards=`<div class="stats five">${stat('TICKETS VISIBLES',tickets.length,'Registro total')}${stat('ABIERTOS',counts.abierto,'Pendientes')}${stat('EN PROCESO',counts.en_proceso,'En seguimiento')}${stat('RESUELTOS',counts.resuelto,'Solución registrada')}${stat('CERRADOS',counts.cerrado,'Finalizados')}</div>`;
  // Filtrado local: la consulta SQL ya limitó estos datos al usuario autenticado.
  // Solo se envían al navegador los tickets autorizados por DB.listTickets(user).
  const table=tickets.length?`<div class="table-wrap" data-explorer-table><table><thead><tr><th>Ticket</th><th>Solicitante</th><th>Categoría</th><th>Prioridad</th><th>Estado</th><th>Última actividad</th></tr></thead><tbody data-explorer-body>${tickets.map(t=>`<tr data-explorer-row data-search="${esc(`#${String(t.id).padStart(4,'0')} ${t.id} ${t.subject}`)}" data-state="${esc(t.status)}" data-category="${esc(t.category)}" data-priority="${esc(t.priority)}" data-updated="${esc(t.updated_at)}" data-ticket-id="${t.id}"><td><a class="ticket-link" href="/tickets/${t.id}"><small>#${String(t.id).padStart(4,'0')}</small><strong>${esc(t.subject)}</strong></a></td><td>${esc(t.requester)}</td><td>${esc(t.category)}</td><td><span class="priority ${esc(t.priority)}">${esc(t.priority)}</span></td><td>${pill(t.status)}</td><td class="date">${esc(date(t.updated_at))}</td></tr>`).join('')}</tbody></table></div><div class="explorer-no-results" data-explorer-empty hidden role="status"><strong>No hay solicitudes que coincidan</strong><p>Prueba otra búsqueda o cambia los filtros.</p></div>`:`<div class="empty"><div>◌</div><strong>Aún no hay tickets</strong><p>Registra la primera solicitud para comenzar.</p><a href="/tickets/new" class="btn primary">Crear primer ticket</a></div>`;
  const statusOptions=Object.entries(STATES).map(([key,label])=>`<option value="${esc(key)}">${esc(label)}</option>`).join('');
  const categoryFilters=CATEGORIES.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('');
  // Los controles permanecen fuera de data-live-zone para no perder el foco ni el filtro
  // cuando Live reemplaza las tarjetas y el listado.
  const explorerControls=`<section class="ticket-explorer" data-ticket-explorer hidden aria-label="Buscar y filtrar tickets"><div class="explorer-heading"><div><span class="eyebrow">EXPLORADOR DE TICKETS</span><h2>Encuentra una solicitud</h2></div><span class="explorer-count" data-explorer-count role="status" aria-live="polite"></span></div><div class="explorer-fields"><label for="ticket-search">Buscar por número o asunto<input id="ticket-search" data-explorer-search type="search" maxlength="120" autocomplete="off" placeholder="Ej. #0005 o revisión de notas"></label><label for="ticket-state">Estado<select id="ticket-state" data-explorer-status><option value="">Todos los estados</option>${statusOptions}</select></label><label for="ticket-category">Categoría<select id="ticket-category" data-explorer-category><option value="">Todas las categorías</option>${categoryFilters}</select></label><label for="ticket-priority">Prioridad<select id="ticket-priority" data-explorer-priority><option value="">Todas las prioridades</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></label><label for="ticket-order">Ordenar por<select id="ticket-order" data-explorer-sort><option value="recent">Última actividad (reciente)</option><option value="oldest">Última actividad (antigua)</option><option value="priority-high">Prioridad (alta primero)</option><option value="priority-low">Prioridad (baja primero)</option></select></label></div><div class="explorer-actions"><span>Los filtros se aplican solo a tus tickets visibles.</span><button type="button" class="btn explorer-clear" data-explorer-clear>Limpiar filtros</button></div></section>`;
  return layout({title:'Tickets',user,live:true,explorer:true,content:`<header class="topbar"><span>MESA DE AYUDA / TICKETS</span><span class="live"><i></i><span data-live-status>Conectando seguimiento…</span></span></header><div class="page"><div class="page-heading"><div><span class="eyebrow">PANEL PRINCIPAL</span><h1>${user.role==='coordinador'?'Gestión de solicitudes':'Mis solicitudes'}</h1><p>${user.role==='coordinador'?'Visualiza y actualiza el estado de todas las solicitudes.':'Crea tickets y consulta las actualizaciones en vivo.'}</p></div><a class="btn primary" href="/tickets/new">＋ Nueva solicitud</a></div>${explorerControls}<div data-live-zone>${cards}<section class="section"><div class="section-head"><h2>Listado de tickets</h2><span>${tickets.length} registros</span></div>${table}</section></div><div class="disclaimer">MesaHelp v0.3.1 · El seguimiento registrado no sustituye la solución efectiva de la incidencia.</div></div>`});
}
function reportsPage(user,tickets) {
  // DB.listTickets(user) ya restringe la información antes de generar la vista.
  const summary=Reports.summarize(tickets);
  const renderGroup=(title,items)=>`<section class="panel report-group"><h2>${esc(title)}</h2><div class="report-bars">${items.map(({label,count})=>{
    // <progress> aplica la proporción sin estilos inline, compatibles con la CSP actual.
    // max>=1 evita un valor máximo inválido cuando no hay tickets.
    return `<div class="report-line"><div class="report-line-head"><span>${esc(label)}</span><strong>${count}</strong></div><progress class="report-progress" max="${Math.max(summary.total,1)}" value="${count}" aria-label="${esc(label)}">${count} de ${summary.total}</progress></div>`;
  }).join('')}</div></section>`;
  return layout({title:'Reportes',user,content:`<header class="topbar">MESA DE AYUDA / REPORTES</header><div class="page"><div class="page-heading"><div><span class="eyebrow">INFORMACIÓN OPERATIVA</span><h1>${user.role==='coordinador'?'Reportes de solicitudes':'Resumen de mis solicitudes'}</h1><p>Indicadores basados en los tickets autorizados para tu sesión. No son métricas de desempeño ni tiempos de resolución.</p></div><a class="btn primary" href="/reportes.csv">↓ Exportar CSV</a></div><div class="report-intro panel"><span class="eyebrow">TOTAL DE TICKETS AUTORIZADOS</span><strong class="report-total">${summary.total}</strong><p>${user.role==='coordinador'?'Incluye los tickets del sistema, también los registrados como invitado.':'Solo incluye tus propias solicitudes.'} El archivo CSV contiene el listado autorizado sin las descripciones ni códigos privados.</p></div><div class="report-grid">${renderGroup('Por estado',summary.byStatus)}${renderGroup('Por categoría',summary.byCategory)}${renderGroup('Por prioridad',summary.byPriority)}</div><p class="disclaimer">Los totales son instantáneas al abrir la página. Actualiza esta vista para obtener datos recientes. CSV: UTF-8 con columnas separadas por comas.</p></div>`});
}
function ticketDetail(user,ticket,events,msg=''){
  const coordinator=user.role==='coordinador';
  const update=coordinator?`<form class="panel status-panel" method="post" action="/tickets/${ticket.id}/status">${formToken(user.csrf)}<h2>Actualizar estado</h2><p>Registra un cambio de estado para esta solicitud.</p><label>Nuevo estado<select name="status">${Object.entries(STATES).map(([s,l])=>`<option value="${s}" ${ticket.status===s?'selected':''}>${l}</option>`).join('')}</select></label><label>Observación (opcional)<textarea rows="3" name="note" maxlength="500" placeholder="Ej. Se asignó al área correspondiente"></textarea></label><button class="btn primary full">Guardar cambio de estado</button></form><form class="panel status-panel" method="post" action="/tickets/${ticket.id}/notes">${formToken(user.csrf)}<h2>Agregar observación</h2><p>Agrega una nota de seguimiento sin cambiar el estado.</p><label>Observación <span>*</span><textarea rows="4" name="note" minlength="3" maxlength="500" required placeholder="Ej. Coordinación revisó el caso"></textarea></label><button class="btn primary full">Registrar observación</button></form>`:`<div class="panel notice-panel"><h2>Seguimiento</h2><p>Coordinación actualizará el estado y registrará las observaciones pertinentes.</p></div>`;
  return layout({title:`Ticket #${ticket.id}`,user,live:true,content:`<header class="topbar">MESA DE AYUDA / TICKET #${esc(ticket.id)} <span class="live"><i></i><span data-live-status>Conectando seguimiento…</span></span></header><div class="page" data-live-zone data-ticket-id="${ticket.id}"><a href="/" class="back">← Volver a tickets</a>${msg?`<div class="success-alert">${esc(msg)}</div>`:''}<div class="page-heading"><div><span class="eyebrow">TICKET #${String(ticket.id).padStart(4,'0')}</span><h1>${esc(ticket.subject)}</h1><p>Registrado por ${esc(ticket.requester)} · ${esc(date(ticket.created_at))}</p></div>${pill(ticket.status)}</div><div class="details-grid"><div><div class="panel"><div class="section-head"><h2>Información de la solicitud</h2></div><div class="kv"><div><small>CATEGORÍA</small><strong>${esc(ticket.category)}</strong></div><div><small>PRIORIDAD</small><strong>${esc(ticket.priority)}</strong></div><div><small>ESTADO ACTUAL</small>${pill(ticket.status)}</div></div><h3>Descripción</h3><p class="description">${esc(ticket.description)}</p></div><div class="panel"><div class="section-head"><h2>Historial de seguimiento</h2><span>${events.length} eventos</span></div><div class="timeline">${timeline(events)}</div></div></div><aside>${update}</aside></div></div>`});
}
async function readForm(req){
  const type=(req.headers['content-type']||'').split(';')[0].toLowerCase();
  if(type!=='application/x-www-form-urlencoded'){const error=new Error('Tipo de formulario no admitido');error.status=415;throw error;}
  const chunks=[];let total=0;
  for await(const chunk of req){total+=chunk.length;if(total>16384){const err=new Error('Formulario demasiado grande');err.status=413;throw err;}chunks.push(chunk);}
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')));
}
const failures=new Map();
function allowed(key,limit,windowMs=60000){
  const now=Date.now();let item=failures.get(key);
  if(!item||now>item.expires)item={count:0,expires:now+windowMs};
  item.count++;failures.set(key,item);
  if(failures.size>2000){for(const [k,v] of failures)if(v.expires<now)failures.delete(k);}
  return item.count<=limit;
}
function createServer(){
  const server=http.createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost');const method=req.method||'GET';
      if(method==='GET'&&url.pathname==='/healthz')return send(res,200,'ok','text/plain; charset=utf-8');
      if(method==='GET'&&['/styles.css','/live.js','/explorer.js'].includes(url.pathname)){
        const file=url.pathname.slice(1);
        return send(res,200,fs.readFileSync(path.join(__dirname,'..','public',file)),file.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8');
      }
      const parsed=cookies(req),user=DB.loadSession(parsed.sid);
      if(method==='GET'&&url.pathname==='/login')return user?redirect(res,'/'):showLogin(req,res);
      if(method==='GET'&&url.pathname==='/guest/new')return guestTicketForm(req,res);
      if(method==='GET'&&url.pathname==='/seguimiento')return trackingForm(req,res);
      if(method==='POST'&&url.pathname==='/login'){
        const form=await readForm(req);
        if(!equal(form.csrf,parsed.precsrf)){
          const reason=!form.csrf?'formulario sin token':!parsed.precsrf?'cookie precsrf ausente':'cookie y formulario distintos';
          console.warn(`[MesaHelp CSRF] POST /login rechazado: ${reason}; COOKIE_SECURE=${process.env.COOKIE_SECURE==='1'?'1':'0'}`);
          return send(res,403,'Formulario expirado. Vuelve a /login.','text/plain; charset=utf-8');
        }
        if(!allowed(`login:${req.socket.remoteAddress}`,12))return showLogin(req,res,'Demasiados intentos. Intenta de nuevo más tarde.');
        const username=clean(form.username).toLowerCase();
        const person=username==='__invitado__'?null:DB.findUser(username);
        if(!person||!DB.verifyPassword(String(form.password||''),person.password_hash))return showLogin(req,res,'Usuario o contraseña incorrectos.');
        const session=DB.createSession(person.id);
        res.setHeader('Set-Cookie',[`sid=${session.token}; Path=/; HttpOnly; SameSite=Lax${secureFlag()}; Max-Age=28800`,`precsrf=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${secureFlag()}`]);
        return redirect(res,'/');
      }
      if(method==='POST'&&url.pathname==='/guest/tickets'){
        const form=await readForm(req);
        if(!equal(form.csrf,parsed.precsrf))return send(res,403,'Formulario expirado; vuelve a crear tu solicitud.','text/plain; charset=utf-8');
        if(!allowed(`guest-create:${req.socket.remoteAddress}`,8))return send(res,429,'Demasiadas solicitudes. Inténtalo más tarde.','text/plain; charset=utf-8');
        if(clean(form.website))return send(res,422,'No se pudo registrar la solicitud.','text/plain; charset=utf-8');
        const fields=validateTicket(form);
        if(!fields)return guestTicketForm(req,res,'Revisa asunto, descripción, categoría y prioridad.');
        const {id,code}=DB.createGuestTicket(fields);notifyTicket(id);
        return send(res,201,guestCreated(id,code));
      }
      if(method==='POST'&&url.pathname==='/seguimiento'){
        const form=await readForm(req);
        if(!equal(form.csrf,parsed.precsrf))return send(res,403,'Formulario expirado; vuelve a consultar.','text/plain; charset=utf-8');
        if(!allowed(`guest-lookup:${req.socket.remoteAddress}`,30))return send(res,429,'Demasiadas consultas. Inténtalo más tarde.','text/plain; charset=utf-8');
        const ticket=DB.getGuestTicket(form.code);
        return ticket?trackingForm(req,res,'',ticket,DB.getHistory(ticket.id)):trackingForm(req,res,'Código de seguimiento no válido.');
      }
      if(!user)return redirect(res,'/login');
      if(method==='POST'){
        const form=await readForm(req);
        if(!equal(form.csrf,user.csrf))return send(res,403,'Acción no permitida: verificación CSRF inválida.','text/plain; charset=utf-8');
        if(url.pathname==='/logout'){
          DB.deleteSession(parsed.sid);
          res.setHeader('Set-Cookie',`sid=; Path=/; HttpOnly; SameSite=Lax${secureFlag()}; Max-Age=0`);
          return redirect(res,'/login');
        }
        if(url.pathname==='/tickets'){
          const fields=validateTicket(form);
          if(!fields)return send(res,422,newTicketForm(user,'Revisa asunto, descripción, categoría y prioridad.'));
          const id=DB.createTicket(user.id,fields);notifyTicket(id);
          return redirect(res,`/tickets/${id}?creado=1`);
        }
        const status=url.pathname.match(/^\/tickets\/(\d+)\/status$/);
        if(status){
          if(user.role!=='coordinador')return send(res,403,'Sin permiso.','text/plain; charset=utf-8');
          const id=Number(status[1]);if(!DB.getTicket(id))return send(res,404,'Ticket no encontrado.','text/plain; charset=utf-8');
          const state=clean(form.status),note=clean(form.note);
          if(!Object.hasOwn(STATES,state)||note.length>500)return send(res,422,'Estado o nota inválidos.','text/plain; charset=utf-8');
          const changed=DB.updateTicketStatus(id,user.id,state,note);
          if(changed)notifyTicket(id);
          return redirect(res,`/tickets/${id}?${changed?'actualizado':'sin_cambios'}=1`);
        }
        const notes=url.pathname.match(/^\/tickets\/(\d+)\/notes$/);
        if(notes){
          if(user.role!=='coordinador')return send(res,403,'Sin permiso.','text/plain; charset=utf-8');
          const id=Number(notes[1]);if(!DB.getTicket(id))return send(res,404,'Ticket no encontrado.','text/plain; charset=utf-8');
          const note=clean(form.note);
          if(note.length<3||note.length>500)return send(res,422,'La observación debe tener entre 3 y 500 caracteres.','text/plain; charset=utf-8');
          DB.addTicketNote(id,user.id,note);notifyTicket(id);
          return redirect(res,`/tickets/${id}?nota=1`);
        }
        return send(res,404,'Ruta no encontrada.','text/plain; charset=utf-8');
      }
      if(method!=='GET')return send(res,405,'Método no permitido.','text/plain; charset=utf-8');
      if(url.pathname==='/')return send(res,200,dashboard(user,DB.listTickets(user)));
      if(url.pathname==='/reportes')return send(res,200,reportsPage(user,DB.listTickets(user)));
      if(url.pathname==='/reportes.csv'){
        const csv=Reports.exportCsv(DB.listTickets(user));
        res.setHeader('Content-Disposition','attachment; filename="mesahelp-reporte.csv"');
        return send(res,200,csv,'text/csv; charset=utf-8');
      }
      if(url.pathname==='/tickets/new')return send(res,200,newTicketForm(user));
      const match=url.pathname.match(/^\/tickets\/(\d+)$/);
      if(match){
        const id=Number(match[1]),ticket=DB.getTicket(id);
        if(!ticket)return send(res,404,'Ticket no encontrado.','text/plain; charset=utf-8');
        if(user.role!=='coordinador'&&ticket.requester_id!==user.id)return send(res,403,'No tienes permiso para visualizar este ticket.','text/plain; charset=utf-8');
        const message=url.searchParams.has('creado')?'Ticket creado correctamente.':url.searchParams.has('actualizado')?'Estado actualizado correctamente.':url.searchParams.has('nota')?'Observación registrada.':url.searchParams.has('sin_cambios')?'No hubo cambios de estado.':'';
        return send(res,200,ticketDetail(user,ticket,DB.getHistory(id),message));
      }
      return send(res,404,'Página no encontrada.','text/plain; charset=utf-8');
    }catch(error){
      if(error.status&&error.status<500)return send(res,error.status,esc(error.message),'text/plain; charset=utf-8');
      console.error(error);if(!res.headersSent)send(res,500,'Se produjo un error interno.','text/plain; charset=utf-8');
    }
  });
  attachLive(server,cookies);
  return server;
}
if(require.main===module){const port=Number(process.env.PORT||3000);createServer().listen(port,'0.0.0.0',()=>console.log(`MesaHelp v0.3 en http://localhost:${port}`));}
module.exports={createServer,CATEGORIES,STATES};
