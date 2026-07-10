const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/userDoc\.role/g, 'userDoc.get("role", "")');
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('firestore.rules');
fixFile('firestore-comercial.rules');
console.log("Fixed userDoc.role in both rules files");
