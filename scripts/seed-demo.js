'use strict';
const {randomBytes}=require('node:crypto');
const {db,addUser,findUser}=require('../src/db');
console.log('CUENTAS DEMOSTRATIVAS · conserva las credenciales fuera del repositorio');
let created=0;
for(const [username,role] of [['solicitante','solicitante'],['coordinador','coordinador']]){
 if(findUser(username)) {console.log(`${username}: cuenta existente, se conserva su contraseña`);continue;}
 const password=randomBytes(12).toString('base64url');
 addUser(username,password,role);
 console.log(`${username} (${role}) | contraseña: ${password}`);
 created++;
}
if(created)console.log('Guarda estas contraseñas de forma privada. No se imprimirán nuevamente.');
else console.log('No se modificó ninguna cuenta.');
