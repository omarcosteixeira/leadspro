const fs = require('fs');

let rules = fs.readFileSync('firestore.rules', 'utf8');

const evasoRegex = /match \/artifacts\/gestaodeleadspro-d4230\/public\/data\/evasao\/\{id\} \{[\s\S]*?\n    \}/;

const newRulesBlock = `match /artifacts/gestaodeleadspro-d4230/public/data/evasao/{id} {
      allow get, list: if isAuthenticated() && canAccessUnit(resource.data.unidade);
      allow create: if isAuthenticated() && (isMasterUser() || isComercial() || canAccessUnit(request.resource.data.unidade)) &&
        hasAnyRole(["SSA", "Admin Master", "Gestor Unidade", "Líder/FDV", "Sala de Matrícula", "QG", "FDV", "FDV (Comercial)", "Promotor", "Promotor/rua", "Gestor Comercial", "Gerente Comercial (Comercial)"]);
      allow update: if isAuthenticated() && (isMasterUser() || isComercial() || (canAccessUnit(resource.data.unidade) && canAccessUnit(request.resource.data.unidade))) &&
        hasAnyRole(["SSA", "Admin Master", "Gestor Unidade", "Líder/FDV", "Sala de Matrícula", "QG", "FDV", "FDV (Comercial)", "Promotor", "Promotor/rua", "Gestor Comercial", "Gerente Comercial (Comercial)"]);
      allow delete: if isAuthenticated() && (isMasterUser() || isComercial() || canAccessUnit(resource.data.unidade)) &&
        hasAnyRole(["SSA", "Admin Master", "Gestor Unidade", "Líder/FDV", "Sala de Matrícula", "QG", "FDV", "FDV (Comercial)", "Promotor", "Promotor/rua", "Gestor Comercial", "Gerente Comercial (Comercial)"]);
    }
    match /artifacts/gestaodeleadspro-d4230/public/data/fies_prouni/{id} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && isValidFiesProuni(request.resource.data) && (isPrincipal() || isComercial() || isAcademico() || isSSA() || isFinanceiro() || isTecnico() || isSalaMatricula());
      allow delete: if isPrincipal() || isComercial() || isAcademico() || isSSA() || isFinanceiro() || isTecnico() || isSalaMatricula();
    }
    match /artifacts/gestaodeleadspro-d4230/public/data/fies_prouni_vagas/{id} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && (isPrincipal() || isComercial() || isAcademico() || isSSA() || isFinanceiro() || isTecnico() || isSalaMatricula());
      allow delete: if isPrincipal() || isComercial() || isAcademico() || isSSA() || isFinanceiro() || isTecnico() || isSalaMatricula();
    }`;

rules = rules.replace(evasoRegex, newRulesBlock);

fs.writeFileSync('firestore.rules', rules);
