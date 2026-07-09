# Security Specification - Plano de Ação & Unit Visibility

## Data Invariants
1. **Unit Ownership**: All core documents (`leads`, `calendario_acoes`, `gap_academico`, `fies_prouni`, `bases`) must have a `unidade` field.
2. **Access Control**: Users with restricted roles can only read and write documents where `document.unidade == user.unidade`.
3. **Privileged Roles**: `Admin Master`, `Gestor Comercial`, and `Gerente Comercial (Comercial)` can bypass unit-based restrictions.
4. **Creator Integrity**: `creatorId` must always match `request.auth.uid` on creation.
5. **Schema Validation**: All documents must conform to the schema defined in `firebase-blueprint.json`.

## The "Dirty Dozen" Payloads (Deny Cases)

### CalendarioAcao (Collection: `calendario_acoes`)

1. **Identity Spoofing**: `FDV_COMERCIAL` tries to create an action for another user.
   ```json
   { "nome": "Ação Hacker", "creatorId": "attacker_uid", "unidade": "Unit A", "colaboradorId": "victim_uid" }
   ```
   *Expected: Deny (if creatorId doesn't match auth.uid)*

2. **Cross-Unit Read**: `FDV_COMERCIAL` from "Unit A" tries to read an action from "Unit B".
   ```json
   // Query: where("unidade", "==", "Unit B")
   ```
   *Expected: Deny*

3. **Cross-Unit Write**: `FDV_COMERCIAL` from "Unit A" tries to update an action in "Unit B".
   ```json
   { "nome": "Malicious Update", "unidade": "Unit B" }
   ```
   *Expected: Deny*

4. **Resource Poisoning (Large String)**:
   ```json
   { "nome": "A".repeat(2000), "unidade": "Unit A" }
   ```
   *Expected: Deny (size check)*

5. **Unauthorized Status Change**: `Promotor` tries to set status to "Concluído" (maybe only FDV/Admin should?).
   ```json
   { "status": "Concluído" }
   ```
   *Expected: Deny (if roles restricted)*

6. **Missing Required Field**:
   ```json
   { "nome": "Ação", "unidade": "Unit A" } // Missing dataInicio, dataFim
   ```
   *Expected: Deny (isValidCalendarioAcao)*

### UserProfile (Collection: `users`)

7. **Privilege Escalation**: User tries to change their own role to "Admin Master".
   ```json
   { "role": "Admin Master" }
   ```
   *Expected: Deny*

8. **Unit Hijacking**: User tries to change their own unit.
   ```json
   { "unidade": "HQ" }
   ```
   *Expected: Deny*

### Leads (Collection: `leads`)

9. **Cross-Unit Read**: Promotor tries to list leads from another unit.
   *Expected: Deny*

10. **Data Injection**:
    ```json
    { "nome": "Leaked Data", "unidade": "Unit B", "promotorId": "attacker_uid" }
    ```
    *Expected: Deny (unit mismatch)*

### Fies/Prouni (Collection: `fies_prouni`)

11. **PII Leak**: Unauthorized role tries to read `cpf`.
    *Expected: Deny*

12. **Status Shortcut**:
    ```json
    { "status": "Aprovado" } // Without proper analysis or role
    ```
    *Expected: Deny*

## Red Team Pass/Fail Criteria
- **Pass**: Rules correctly use `resource.data.unidade` or `get()` to verify unit membership.
- **Pass**: All writes use `isValid[Entity]()` wrapping the logic.
- **Pass**: `affectedKeys().hasOnly()` is used for updates.
- **Fail**: Blanket `allow read: if isSignedIn();` found on sensitive collections.
