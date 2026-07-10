const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /request\.auth\.token\.email in \["canaldonutri@gmail\.com", "marcos\.teixeira@estacio\.br"\]/g,
    '("email" in request.auth.token && request.auth.token.email in ["canaldonutri@gmail.com", "marcos.teixeira@estacio.br"])'
  );
  content = content.replace(
    /userDoc\.email in \["canaldonutri@gmail\.com", "marcos\.teixeira@estacio\.br"\]/g,
    '("email" in userDoc && userDoc.email in ["canaldonutri@gmail.com", "marcos.teixeira@estacio.br"])'
  );
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('firestore.rules');
fixFile('firestore-comercial.rules');
console.log("Fixed isMasterUser in both rules files");
