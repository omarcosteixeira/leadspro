const fs = require('fs');

let content = fs.readFileSync('firestore-comercial.rules', 'utf8');

// Update isMasterUser
content = content.replace(
  'userDoc.role == "Admin Master"',
  'userDoc.role == "Admin Master" || \n        userDoc.role == "Líder/FDV"'
);

// Update gap_academico delete
content = content.replace(
  'match /artifacts/gestaodeleadspro-d4230/public/data/gap_academico/{gapId} {\n      allow get, list: if isAuthenticated() && canAccessUnit(resource.data.unidade);\n      allow create, update: if isAuthenticated() && canAccessUnit(request.resource.data.unidade) && (isMasterUser() || isComercial() || isLider() || isSalaMatricula());\n      allow delete: if isMasterUser() || isComercial() || isLider();\n    }',
  'match /artifacts/gestaodeleadspro-d4230/public/data/gap_academico/{gapId} {\n      allow get, list: if isAuthenticated() && canAccessUnit(resource.data.unidade);\n      allow create, update: if isAuthenticated() && canAccessUnit(request.resource.data.unidade) && (isMasterUser() || isComercial() || isLider() || isSalaMatricula());\n      allow delete: if isMasterUser() || isComercial() || isLider() || isSalaMatricula();\n    }'
);

// Update fies_prouni delete
content = content.replace(
  /allow delete: if isMasterUser\(\) \|\| isComercial\(\) \|\| isLider\(\);\n    }/g,
  'allow delete: if isMasterUser() || isComercial() || isLider() || isSalaMatricula();\n    }'
);

// Update cursos
content = content.replace(
  /match \/artifacts\/gestaodeleadspro-d4230\/public\/data\/cursos\/\{id\} {\n      allow read: if true;\n      allow write: if isAuthenticated\(\) && \(isPrincipal\(\) \|\| isComercial\(\) \|\| isAcademico\(\) \|\| isSSA\(\) \|\| isFinanceiro\(\) \|\| isTecnico\(\)\);\n    }/g,
  'match /artifacts/gestaodeleadspro-d4230/public/data/cursos/{id} {\n      allow read: if true;\n      allow write: if isAuthenticated() && (isPrincipal() || isComercial() || isAcademico() || isSSA() || isFinanceiro() || isTecnico() || isSalaMatricula());\n    }'
);

// Update campanhas
content = content.replace(
  /match \/artifacts\/gestaodeleadspro-d4230\/public\/data\/campanhas\/\{id\} {\n      allow read: if isAuthenticated\(\);\n      allow write: if isPrincipal\(\) \|\| isComercial\(\) \|\| isSSA\(\);\n    }/g,
  'match /artifacts/gestaodeleadspro-d4230/public/data/campanhas/{id} {\n      allow read: if isAuthenticated();\n      allow write: if isPrincipal() || isComercial() || isSSA() || isSalaMatricula();\n    }'
);

// Update calendario_acoes
content = content.replace(
  'allow create: if (isMasterUser() || isComercial() || isFinanceiro() || isLider() || isFDV() || isPromotor())',
  'allow create: if (isMasterUser() || isComercial() || isFinanceiro() || isLider() || isFDV() || isPromotor() || isSalaMatricula())'
);
content = content.replace(
  'allow update: if (isMasterUser() || isComercial() || isFinanceiro() || isLider() || isFDV() || isPromotor())',
  'allow update: if (isMasterUser() || isComercial() || isFinanceiro() || isLider() || isFDV() || isPromotor() || isSalaMatricula())'
);
content = content.replace(
  'allow delete: if (isMasterUser() || isComercial() || isLider() || isFinanceiro());',
  'allow delete: if (isMasterUser() || isComercial() || isLider() || isFinanceiro() || isSalaMatricula());'
);

// Update empresas_parceiras
content = content.replace(
  'isMasterUser() || \n        isComercial() || ',
  'isMasterUser() || \n        isComercial() || isSalaMatricula() || '
);
content = content.replace(
  'allow create, update: if isAuthenticated() && (isMasterUser() || isComercial() || isLider() || isGestorUnidade() || isFDV()) && isValidEmpresa(request.resource.data);',
  'allow create, update: if isAuthenticated() && (isMasterUser() || isComercial() || isLider() || isGestorUnidade() || isFDV() || isSalaMatricula()) && isValidEmpresa(request.resource.data);'
);
content = content.replace(
  'allow delete: if isMasterUser() || isComercial() || isLider();',
  'allow delete: if isMasterUser() || isComercial() || isLider() || isSalaMatricula();'
);

// Update controle_concorrencia
content = content.replace(
  /match \/artifacts\/gestaodeleadspro-d4230\/public\/data\/controle_concorrencia\/\{id\} {\n      allow read: if isAuthenticated\(\);\n      allow write: if isPrincipal\(\) \|\| isComercial\(\) \|\| isSSA\(\);\n    }/g,
  'match /artifacts/gestaodeleadspro-d4230/public/data/controle_concorrencia/{id} {\n      allow read: if isAuthenticated();\n      allow write: if isPrincipal() || isComercial() || isSSA() || isSalaMatricula();\n    }'
);

content = content.replace(
  'function isValidCalendarioAcao(data) {\n      return data.keys().hasAll([\'nome\', \'dataInicio\', \'dataFim\', \'unidade\', \'creatorId\']) &&\n             data.nome is string && data.nome.size() <= 1000 &&\n             data.unidade is string &&\n             data.creatorId == request.auth.uid;\n    }',
  'function isValidCalendarioAcao(data) {\n      return data.keys().hasAll([\'nome\', \'dataInicio\', \'dataFim\', \'unidade\', \'creatorId\']) &&\n             data.nome is string && data.nome.size() <= 1000 &&\n             data.unidade is string;\n    }'
);

fs.writeFileSync('firestore-comercial.rules', content, 'utf8');
console.log("updated firestore-comercial.rules");
