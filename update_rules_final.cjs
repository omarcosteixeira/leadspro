const fs = require('fs');

let rules = fs.readFileSync('firestore.rules', 'utf8');

// Replace the helper functions block
const helpersRegex = /\/\/ ===============================================================\s*\n\s*\/\/ Helper Functions\s*\n\s*\/\/ ===============================================================[\s\S]*?\/\/ ===============================================================\s*\n\s*\/\/ Collection Rules/m;

const newHelpers = `// ===============================================================
    // Helper Functions
    // ===============================================================
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      let path = /databases/$(database)/documents/artifacts/gestaodeleadspro-d4230/public/data/users/$(request.auth.uid);
      return exists(path) ? get(path).data : {};
    }
    
    function isMasterUser() {
      let userDoc = getUserData();
      return isAuthenticated() && (
        ("email" in request.auth.token && request.auth.token.email in ["canaldonutri@gmail.com", "marcos.teixeira@estacio.br"]) || 
        userDoc.get("email", "") in ["canaldonutri@gmail.com", "marcos.teixeira@estacio.br"] ||
        userDoc.get("role", "") == "Admin Master" || 
        userDoc.get("role", "") == "Líder/FDV"
      );
    }
    
    function hasAnyRole(roles) {
      let data = getUserData();
      return isAuthenticated() && (
        isMasterUser() ||
        data.get("role", "") in roles
      );
    }
    
    function isAdminMaster() { return hasAnyRole(['Admin Master']); }
    function isPrincipal() { return isAdminMaster(); }
    function isLider() { return hasAnyRole(['Líder/FDV']); }
    function isSalaMatricula() { return hasAnyRole(['Sala de Matrícula']); }
    function isQG() { return hasAnyRole(['QG']); }
    function isFDV() { return hasAnyRole(['FDV', 'FDV (Comercial)']); }
    function isPromotor() { return hasAnyRole(['Promotor', 'Promotor/rua']); }
    function isSSA() { return hasAnyRole(['SSA']); }
    function isGestorUnidade() { return hasAnyRole(['Gestor Unidade']); }
    function isGestorComercial() { return hasAnyRole(['Gestor Comercial', 'Gerente Comercial (Comercial)']); }
    function isComercial() { return isGestorComercial(); }
    function isAcademico() { return hasAnyRole(['Acadêmico']); }
    function isFinanceiro() { return hasAnyRole(['Financeiro']); }
    function isTecnico() { return hasAnyRole(['Técnico']); }

    function isRestrictedRole(role) {
      return !(role in ['Admin Master', 'Gestor Comercial', 'Gerente Comercial (Comercial)']);
    }

    function canAccessUnit(unidade) {
      let data = getUserData();
      return isMasterUser() || !isRestrictedRole(data.get("role", "")) || (unidade == data.get("unidade", ""));
    }

    // Helper for Requirement: FDV can see linked promotores data
    function isLinkedToMe(otherUserUid) {
      let otherUserData = get(/databases/$(database)/documents/artifacts/gestaodeleadspro-d4230/public/data/users/$(otherUserUid)).data;
      return otherUserData.get("linkadoA", "") == request.auth.uid;
    }

    // Validation Helpers
    function isValidUser(data) {
      return data.keys().hasAll(['uid', 'email', 'name', 'role']) &&
             data.uid is string &&
             data.email is string &&
             data.name is string &&
             data.role in ['Admin Master', 'Promotor', 'FDV', 'Sala de Matrícula', 'QG', 'Líder/FDV', 'SSA', 'Gestor Unidade', 'Gestor Comercial', 'Acadêmico', 'Gerente Comercial (Comercial)', 'FDV (Comercial)', 'Promotor/rua', 'Financeiro', 'Técnico'] &&
             (!('unidade' in data) || data.unidade is string);
    }

    function isValidCalendarioAcao(data) {
      return data.keys().hasAll(['nome', 'dataInicio', 'dataFim', 'unidade']) &&
             data.nome is string && data.nome.size() <= 1000 &&
             data.unidade is string;
    }

    function isValidEmpresa(data) {
      return data.keys().hasAll(['nome', 'responsavel', 'telefone']) &&
             data.nome is string && data.nome.size() > 0 &&
             data.responsavel is string &&
             data.telefone is string &&
             (!('unidadesVinculadas' in data) || data.unidadesVinculadas is list) &&
             (!('consultorId' in data) || data.consultorId is string) &&
             (!('creatorId' in data) || data.creatorId is string);
    }

    function isValidWhatsAppMessage(data) {
      return data.keys().hasAll(['tipo', 'texto']) &&
             data.tipo is string &&
             data.texto is string;
    }

    function isValidMapaoAcademico(data) {
      return data.keys().hasAll(['modalidade', 'curso', 'tipoCurso']) &&
             data.modalidade is string &&
             data.curso is string;
    }

    function isValidFiesProuni(data) {
      return data.keys().hasAll(['nome', 'cpf', 'tipo', 'bolsa', 'curso', 'unidade']) &&
             data.nome is string &&
             data.cpf is string &&
             data.unidade is string;
    }

    // ===============================================================
    // Collection Rules`;

rules = rules.replace(helpersRegex, newHelpers);

// Now update the users match block
const usersRegex = /match \/artifacts\/gestaodeleadspro-d4230\/public\/data\/users\/\{userId\} \{[\s\S]*?\n    \}/;

const newUsersRule = `match /artifacts/gestaodeleadspro-d4230/public/data/users/{userId} {
      allow get: if isAuthenticated() && (userId == request.auth.uid || isMasterUser() || isComercial() || canAccessUnit(resource.data.get("unidade", "")));
      allow list: if isAuthenticated() && (
        isMasterUser() || 
        isComercial() || isSalaMatricula() || 
        ("email" in request.auth.token && resource.data.email == request.auth.token.email) ||
        resource.data.uid == request.auth.uid ||
        (isGestorUnidade() && resource.data.unidade == getUserData().get("unidade", "") && resource.data.role in ['FDV', 'FDV (Comercial)', 'Promotor', 'Promotor/rua']) ||
        (isFDV() && (resource.data.unidade == getUserData().get("unidade", "") || resource.data.get("linkadoA", "") == request.auth.uid || resource.data.uid == request.auth.uid))
      );
      allow create: if isAuthenticated() && isValidUser(request.resource.data) && (userId == request.auth.uid || isMasterUser() || isLider() || isGestorComercial());
      allow update: if isAuthenticated() && isValidUser(request.resource.data) && (isMasterUser() || isLider() || isGestorComercial() || (userId == request.auth.uid && request.resource.data.role == resource.data.get("role", "") && request.resource.data.unidade == resource.data.get("unidade", "")));
      allow delete: if isMasterUser() || isLider() || isGestorComercial();
    }`;

rules = rules.replace(usersRegex, newUsersRule);

fs.writeFileSync('firestore.rules', rules);
