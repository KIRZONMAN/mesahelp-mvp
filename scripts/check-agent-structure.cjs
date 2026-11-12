'use strict';
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = process.cwd();
const agents = ['analista-mvp', 'desarrollador-node', 'auditor-calidad', 'devops-hetzner'];
const skills = ['ciclo-tickets', 'auditar-mvp', 'preparar-hetzner'];
let errors = 0;
function checkFile(relativePath, kind, expectedName) {
  const path = join(root, relativePath);
  if (!existsSync(path)) { console.error(`FALTA ${kind}: ${relativePath}`); errors++; return; }
  const content = readFileSync(path, 'utf8');
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter || !new RegExp(`^name: ${expectedName}$`, 'm').test(frontmatter[1]) || !/^description: .+/m.test(frontmatter[1])) {
    console.error(`FRONTMATTER INVÁLIDO: ${relativePath}`); errors++;
  } else console.log(`OK ${kind}: ${relativePath}`);
}
for (const agent of agents) checkFile(`.claude/agents/${agent}.md`, 'agente', agent);
for (const skill of skills) checkFile(`.claude/skills/${skill}/SKILL.md`, 'skill', skill);
if (!existsSync(join(root, 'CLAUDE.md'))) { errors++; console.error('FALTA CLAUDE.md'); }
console.log(errors ? `Errores estructurales: ${errors}` : 'Estructura válida. Esto NO certifica ejecución real en Claude Code.');
process.exitCode = errors ? 1 : 0;
