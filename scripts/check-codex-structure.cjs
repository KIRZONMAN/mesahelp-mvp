'use strict';
// Validación estática, no certifica ejecución de Codex ni de sus subagentes.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const agents = ['analista_mvp','desarrollador_node','auditor_calidad','devops_hetzner'];
const skills = ['ciclo-tickets','auditar-mvp','preparar-hetzner'];
let failed = 0;
function assert(ok, msg) { if (!ok) { console.error('ERROR: '+msg); failed++; } else console.log('OK: '+msg); }
assert(fs.existsSync(path.join(root,'AGENTS.md')), 'AGENTS.md');
const config = path.join(root,'.codex','config.toml');
assert(fs.existsSync(config), '.codex/config.toml');
for (const name of agents) {
  const rel = `.codex/agents/${name}.toml`;
  const file = path.join(root,rel);
  if (!fs.existsSync(file)) {assert(false,rel);continue;}
  const content = fs.readFileSync(file,'utf8');
  assert(content.includes(`name = "${name}"`) && /^description\s*=\s*".+"/m.test(content) && /^developer_instructions\s*=\s*".+"/m.test(content), rel);
}
for (const name of skills) {
  const rel = `.agents/skills/${name}/SKILL.md`;
  const file = path.join(root,rel);
  if (!fs.existsSync(file)) {assert(false,rel);continue;}
  const content = fs.readFileSync(file,'utf8');
  assert(new RegExp(`^---\\r?\\nname: ${name}\\r?\\ndescription: .+\\r?\\n---`, 'm').test(content), rel);
}
if (!failed) console.log('Estructura de Codex presente. NO acredita autenticación ni ejecución de subagentes.');
process.exitCode = failed ? 1 : 0;
