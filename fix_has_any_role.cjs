const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /data\.role in roles/g,
    'data.get("role", "") in roles'
  );
  content = content.replace(
    /isRestrictedRole\(data\.role\)/g,
    'isRestrictedRole(data.get("role", ""))'
  );
  content = content.replace(
    /data\.unidade/g,
    'data.get("unidade", "")'
  );
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('firestore.rules');
fixFile('firestore-comercial.rules');
console.log("Fixed hasAnyRole in both rules files");
