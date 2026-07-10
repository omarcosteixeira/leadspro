const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /\("email" in request\.auth\.token && request\.auth\.token\.email in \["canaldonutri@gmail\.com", "marcos\.teixeira@estacio\.br"\]\)/g,
    'request.auth.token.get("email", "") in ["canaldonutri@gmail.com", "marcos.teixeira@estacio.br"]'
  );
  content = content.replace(
    /\("email" in userDoc && userDoc\.email in \["canaldonutri@gmail\.com", "marcos\.teixeira@estacio\.br"\]\)/g,
    'userDoc.get("email", "") in ["canaldonutri@gmail.com", "marcos.teixeira@estacio.br"]'
  );
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('firestore.rules');
fixFile('firestore-comercial.rules');
console.log("Fixed email in both rules files");
