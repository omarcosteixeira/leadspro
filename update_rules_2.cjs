const fs = require('fs');

let content = fs.readFileSync('firestore.rules', 'utf8');

content = content.replace(
  'function isValidCalendarioAcao(data) {\n      return data.keys().hasAll([\'nome\', \'dataInicio\', \'dataFim\', \'unidade\', \'creatorId\']) &&\n             data.nome is string && data.nome.size() <= 1000 &&\n             data.unidade is string &&\n             data.creatorId == request.auth.uid;\n    }',
  'function isValidCalendarioAcao(data) {\n      return data.keys().hasAll([\'nome\', \'dataInicio\', \'dataFim\', \'unidade\', \'creatorId\']) &&\n             data.nome is string && data.nome.size() <= 1000 &&\n             data.unidade is string;\n    }'
);

fs.writeFileSync('firestore.rules', content, 'utf8');
console.log("updated firestore.rules");
