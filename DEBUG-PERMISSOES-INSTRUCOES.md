# 🔍 Debug de Permissões - Instruções

**Data**: 02 de Março de 2026  
**Status**: 🔧 LOGS ADICIONADOS - PRONTO PARA TESTE

---

## 🎯 Objetivo

Identificar por que as permissões não estão sendo carregadas no frontend, mesmo com 46 roles e 96 associações role-permission no banco.

---

## ✅ O Que Foi Feito

### 1. Verificação do Banco de Dados ✅
- 46 roles criados
- 26 permissões cadastradas
- 96 associações role-permission
- org-admin tem 17 permissões

### 2. Logs Adicionados ✅

**backend/src/modules/auth/authController.js**:
- Log do userId antes de carregar permissões
- Log do contexto (userType, organizationId, clientId, role)
- Log do total de permissões carregadas
- Log de erro com stack trace completo

**backend/src/services/permissionService.js**:
- Log de busca do usuário
- Log de onde o usuário foi encontrado (User, OrganizationUser, ClientUser)
- Log dos dados do usuário
- Log do role encontrado
- Log do número de permissões do role
- Warning se role não tiver permissões

---

## 🧪 Como Testar

### Passo 1: Reiniciar Backend

```bash
# Parar o backend (Ctrl+C)
cd backend
npm run dev
```

**Aguardar**: "Server running on port 4003"

### Passo 2: Limpar Cache do Browser

```
Chrome/Edge: Ctrl+Shift+Delete
Firefox: Ctrl+Shift+Delete
Safari: Cmd+Option+E
```

Selecionar:
- [x] Cookies e dados de sites
- [x] Imagens e arquivos em cache

### Passo 3: Fazer Login

1. Abrir `http://localhost:5173`
2. Login:
   - Email: `multicontext@test.com`
   - Senha: `Test@123`
3. Selecionar qualquer contexto (Alpha ou Beta)

### Passo 4: Observar Logs do Backend

**Terminal do backend** deve mostrar logs como:

```
🔍 Carregando permissões para userId: [UUID]
🔍 Contexto: {
  userType: 'organization',
  organizationId: '[UUID]',
  clientId: null,
  role: 'org-admin'
}
🔍 getUserPermissions: Buscando usuário: [UUID]
✅ getUserPermissions: Usuário encontrado em OrganizationUser
✅ getUserPermissions: Dados do usuário: {
  email: 'multicontext@test.com',
  role: 'org-admin',
  organizationId: '[UUID]',
  clientId: null,
  userType: 'organization'
}
✅ Role customizado da organização encontrado: org-admin (org: [UUID])
✅ getUserPermissions: Role encontrado: {
  id: '[UUID]',
  name: 'org-admin',
  displayName: 'Administrador da Organização',
  permissionsCount: 17
}
✅ Permissões carregadas: [array de permissões]
✅ Total de permissões: 17
```

---

## 🔍 Cenários Possíveis

### Cenário 1: Permissões Carregadas ✅

**Logs esperados**:
```
✅ getUserPermissions: Role encontrado: { permissionsCount: 17 }
✅ Permissões carregadas: [array]
✅ Total de permissões: 17
```

**Ação**: Se os logs mostram permissões carregadas mas o frontend ainda mostra o aviso, o problema está no frontend. Verificar console do browser (F12).

### Cenário 2: Role Sem Permissões ⚠️

**Logs esperados**:
```
✅ getUserPermissions: Role encontrado: { permissionsCount: 0 }
⚠️ getUserPermissions: Role "org-admin" sem permissões associadas
```

**Causa**: Associações role-permission não estão sendo carregadas.

**Solução**: Verificar associações no `modules/models/index.js`.

### Cenário 3: Role Não Encontrado ❌

**Logs esperados**:
```
❌ getUserPermissions: Role não encontrado para usuário: org-admin
```

**Causa**: Role não existe ou busca está falhando.

**Solução**: Verificar se role foi criado corretamente.

### Cenário 4: Usuário Não Encontrado ❌

**Logs esperados**:
```
❌ getUserPermissions: Usuário não encontrado: [UUID]
```

**Causa**: userId incorreto ou usuário não existe.

**Solução**: Verificar dados de teste.

### Cenário 5: Erro de Associação ❌

**Logs esperados**:
```
❌ Erro ao carregar permissões RBAC: Permission is not associated to Role!
❌ Stack: [stack trace]
```

**Causa**: Associações Sequelize não carregadas.

**Solução**: Verificar ordem de importação dos models.

---

## 📊 Checklist de Debug

- [ ] Backend reiniciado
- [ ] Cache do browser limpo
- [ ] Login realizado
- [ ] Logs do backend observados
- [ ] Cenário identificado
- [ ] Screenshot dos logs tirado (se necessário)

---

## 🔧 Soluções por Cenário

### Se Cenário 1 (Permissões carregadas mas frontend não recebe)

**Verificar console do browser (F12)**:
```javascript
// Deve mostrar:
console.log('💾 Salvando autenticação com contexto...')
console.log('Response:', response)
// Verificar se response.user.permissions existe e tem valores
```

**Se response.user.permissions está vazio**:
- Problema está no authController ao montar o objeto user
- Verificar linha ~140 do authController.js

### Se Cenário 2 (Role sem permissões)

**Executar**:
```bash
cd backend
node src/scripts/check-permissions.js
```

**Se mostrar permissões no banco mas não no Sequelize**:
- Problema nas associações
- Verificar `modules/models/index.js`

### Se Cenário 3 (Role não encontrado)

**Verificar se role existe**:
```bash
cd backend
node src/scripts/check-permissions.js
```

**Se role existe**:
- Problema na busca `findRoleByHierarchy`
- Verificar organizationId está correto

### Se Cenário 4 (Usuário não encontrado)

**Recriar dados de teste**:
```bash
cd backend
node src/scripts/create-multi-context-test-data.js
```

### Se Cenário 5 (Erro de associação)

**Verificar associações**:
1. Abrir `backend/src/modules/models/index.js`
2. Procurar por:
```javascript
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});
```
3. Verificar se está antes de qualquer uso dos models

---

## 📞 Próximos Passos

1. **Executar teste** seguindo passos acima
2. **Identificar cenário** baseado nos logs
3. **Aplicar solução** correspondente
4. **Reportar resultado** com screenshot dos logs

---

## 📝 Template de Reporte

```
CENÁRIO IDENTIFICADO: [número do cenário]

LOGS DO BACKEND:
[colar logs relevantes]

CONSOLE DO BROWSER (se aplicável):
[colar console.log do browser]

COMPORTAMENTO:
[descrever o que aconteceu]

SOLUÇÃO APLICADA:
[descrever o que foi feito]

RESULTADO:
[funcionou ou não]
```

---

**Pronto para debug! 🔍**

---

**Criado por**: Kiro AI Assistant  
**Data**: 02 de Março de 2026
