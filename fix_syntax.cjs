const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\.get\("unidade", ""\)sVinculadas/g, '.unidadesVinculadas');
  content = content.replace(/\.get\("unidade", ""\)/g, '.unidade');
  content = content.replace(/data\.get\("role", ""\)/g, 'data.role');
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('firestore.rules');
fixFile('firestore-comercial.rules');
console.log("Reverted syntax changes");
