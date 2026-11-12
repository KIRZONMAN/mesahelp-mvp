'use strict';
// Diagnóstico seguro del flujo de login: no necesita tus credenciales.
// Uso: node scripts/diagnosticar-csrf.cjs http://127.0.0.1:3000
const http = require('node:http');
const https = require('node:https');
const origin = new URL(process.argv[2] || 'http://127.0.0.1:3000');
const client = origin.protocol === 'https:' ? https : http;
function request(method, route, fields={}, cookie='') {
 return new Promise((resolve,reject)=>{
  const body=new URLSearchParams(fields).toString();
  const req=client.request(new URL(route,origin),{method,headers:{...(cookie?{'Cookie':cookie}:{}),...(method==='POST'?{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(body)}:{})}},res=>{
   let html='';res.setEncoding('utf8');res.on('data',c=>html+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,html}));
  });
  req.on('error',reject);req.end(method==='POST'?body:undefined);
 });
}
(async()=>{
 const login=await request('GET','/login');
 const csrf=login.html.match(/name="csrf" value="([a-f0-9]+)"/)?.[1];
 const cookie=login.headers['set-cookie']?.find(v=>v.startsWith('precsrf='))?.split(';')[0];
 const secure=login.headers['set-cookie']?.find(v=>v.startsWith('precsrf='))?.includes('Secure') || false;
 console.log(`GET /login: HTTP ${login.status}; formulario_csrf=${Boolean(csrf)}; cookie_precsrf=${Boolean(cookie)}; secure=${secure}`);
 if(!csrf||!cookie){console.error('No se obtuvo un formulario/cookie usable; comprueba la URL y si ya existe sesión.');process.exitCode=1;return;}
 const retry=await request('POST','/login',{username:'usuario-inexistente-diagnostico',password:'clave-invalida',csrf},cookie);
 console.log(`POST /login con cookie: HTTP ${retry.status}`);
 if(retry.status===200 && retry.html.includes('Usuario o contraseña incorrectos')) {
  console.log('CORRECTO: el servidor acepta el token CSRF. Si Opera muestra 403, revisa las cookies/solicitud en Opera.');
 } else if(retry.status===403) {
  console.error('FALLO: el servidor rechaza la cookie incluso cuando se reenvía. Revisa COOKIE_SECURE y posibles diferencias con el código local.');process.exitCode=2;
 } else {console.log('Resultado distinto al esperado. Comprueba que el servidor local corresponde a MesaHelp y no hay otra sesión activa.');process.exitCode=3;}
})().catch(error=>{console.error('Error de conexión:',error.message);process.exitCode=1;});
