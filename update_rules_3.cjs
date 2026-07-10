const fs = require('fs');

let content = fs.readFileSync('firestore-comercial.rules', 'utf8');

content = content.replace(
  'function isValidCalendarioAcao(data) {\n      return data.keys().hasAll([\'nome\', \'dataInicio\', \'dataFim\', \'unidade\', \'creatorId\']) &&',
  'function isValidCalendarioAcao(data) {\n      return data.keys().hasAll([\'nome\', \'dataInicio\', \'dataFim\', \'unidade\']) &&'
);

fs.writeFileSync('firestore-comercial.rules', content, 'utf8');

let content2 = fs.readFileSync('firestore.rules', 'utf8');

content2 = content2.replace(
  'function isValidCalendarioAcao(data) {\n      return data.keys().hasAll([\'nome\', \'dataInicio\', \'dataFim\', \'unidade\', \'creatorId\']) &&',
  'function isValidCalendarioAcao(data) {\n      return data.keys().hasAll([\'nome\', \'dataInicio\', \'dataFim\', \'unidade\']) &&'
);

fs.writeFileSync('firestore.rules', content2, 'utf8');
console.log("updated rules");
