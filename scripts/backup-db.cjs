'use strict';
// Consistent online SQLite backup using VACUUM INTO. Never overwrite existing backups.
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes}=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const dataDir=path.resolve(process.env.DATA_DIR||path.join(__dirname,'..','data'));
const source=path.join(dataDir,'mesahelp.sqlite');
if(!fs.existsSync(source)){console.error('No existe base de datos. Inicia MesaHelp primero.');process.exit(1);}
const backupDir=path.resolve(process.env.BACKUP_DIR||path.join(__dirname,'..','backups'));
fs.mkdirSync(backupDir,{recursive:true});
const stamp=new Date().toISOString().replace(/[:-]/g,'').replace(/\..*$/,'').replace('T','-');
const target=path.join(backupDir,`mesahelp-${stamp}-${randomBytes(3).toString('hex')}.sqlite`);
const db=new DatabaseSync(source);
try{
 db.exec('PRAGMA busy_timeout=5000;');
 db.exec(`VACUUM INTO '${target.replace(/'/g,"''")}';`);
 console.log('Copia SQLite creada:',target);
}catch(err){console.error('Error al crear copia:',err.message);process.exitCode=1;}
finally{db.close();}
