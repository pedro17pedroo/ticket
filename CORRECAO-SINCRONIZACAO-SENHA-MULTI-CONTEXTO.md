# Correção: Sincronização de Senha em Multi-Contexto

## 📋 Problema Identificado

Quando um usuário possui múltiplos contextos (OrganizationUser e ClientUser com o mesmo email), ao alterar a senha em um portal (ex: portal da organização), a senha não era sincronizada automaticamente nos outros contextos. Isso causava erro de "Você não tem permissão para acessar este portal" ao tentar fazer login no portal do cliente.

### Cenário do Bug

**Usuário:** multicontext@test.com
- 2 contextos OrganizationUser (em organizações diferentes)
- 1 contexto ClientUser

**Fluxo do problema:**
1. Usuário altera senha no portal da organização
2. Apenas o hash da senha do OrganizationUser específico é atualizado
3. ClientUser mantém a senha antiga
4. Login no portal do cliente falha com erro 403

### Logs do Erro

```
debug: ❌ Acesso negado: Nenhum contexto do tipo 'client' disponível para portal 'client'
```

O sistema encontrava o ClientUser, mas a validação de senha falhava porque o hash estava desatualizado.

## ✅ Solução Implementada

### 1. Utilitário de Sincronização de Senha

Criado arquivo `backend/src/utils/passwordSync.js` com duas funções:

```javascript
// Sincroniza usando hash já criptografado
syncPasswordAcrossContexts(email, passwordHash)

// Sincroniza usando senha em texto plano
syncPasswordAcrossContextsPlain(email, plainPassword)
```

**Funcionalidade:**
- Atualiza todos os OrganizationUsers ativos com o email
- Atualiza todos os ClientUsers ativos com o email
- Usa `individualHooks: false` para evitar re-hash da senha
- Retorna estatísticas de quantos registros foram atualizados
- Trata erros individualmente sem falhar a operação principal

### 2. Integração nos Controllers

A sincronização foi adicionada em todos os pontos onde a senha é alterada:

#### a) `authController.changePassword` (Linha ~643)
- Usuário altera sua própria senha
- Sincroniza após atualização bem-sucedida

#### b) `authController.resetPasswordWithToken` (Linha ~424)
- Reset de senha via token de email
- Sincroniza após validação do token

#### c) `clientUserManagementController.resetPasswordByAdmin` (Linha ~531)
- Admin redefine senha de ClientUser
- Sincroniza após atualização

#### d) `userController.resetPassword` (Linha ~377)
- Admin redefine senha de OrganizationUser
- Sincroniza após atualização

### 3. Correção Imediata

Para corrigir os dados existentes, foi executado:

```javascript
// Buscar hash da senha do OrganizationUser principal
const mainHash = await OrganizationUser.findByPk('3314a47e-cdb9-4db8-976f-ea1abed36644');

// Sincronizar para todos os contextos
await ClientUser.update(
  { password: mainHash.password },
  { where: { email: 'multicontext@test.com' }, individualHooks: false }
);

await OrganizationUser.update(
  { password: mainHash.password },
  { where: { email: 'multicontext@test.com' }, individualHooks: false }
);
```

## 🔍 Verificação

### Antes da Correção
```sql
SELECT email, role, substring(password, 1, 30) FROM organization_users 
WHERE email = 'multicontext@test.com';
-- Resultado: 2 hashes diferentes

SELECT email, role, substring(password, 1, 30) FROM client_users 
WHERE email = 'multicontext@test.com';
-- Resultado: hash diferente dos OrganizationUsers
```

### Após a Correção
```sql
-- Todos os contextos com o mesmo hash
Total de usuários: 3
Hashes únicos: 1
✅ Todos os usuários têm a mesma senha agora!
```

### Teste de Login
```bash
curl -X POST http://localhost:4003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "multicontext@test.com", "password": "123456789", "portalType": "client"}'

# Resultado: ✅ Login bem-sucedido no portal do cliente
```

## 📊 Impacto

### Benefícios
- ✅ Senha sincronizada automaticamente em todos os contextos
- ✅ Usuário pode acessar todos os portais com a mesma senha
- ✅ Experiência de usuário consistente
- ✅ Reduz chamados de suporte por problemas de senha

### Considerações
- A sincronização é "best effort" - se falhar, não impede a operação principal
- Logs detalhados para troubleshooting
- Não afeta performance significativamente (operações em background)

## 🔐 Segurança

- ✅ Usa `individualHooks: false` para evitar re-hash (mantém o hash original)
- ✅ Apenas sincroniza usuários ativos (`isActive: true`)
- ✅ Mantém auditoria de alterações de senha
- ✅ Não expõe senhas em texto plano nos logs

## 📝 Próximos Passos

### Recomendações
1. Considerar adicionar um job de verificação periódica para detectar inconsistências
2. Adicionar alerta no painel admin quando detectar senhas dessincronizadas
3. Documentar no manual do usuário que a senha é única para todos os contextos

### Monitoramento
- Verificar logs para erros de sincronização: `grep "Erro ao sincronizar senha" logs/*.log`
- Monitorar taxa de falhas de login por contexto
- Alertar se múltiplas tentativas de login falharem após mudança de senha

## 🧪 Testes

### Cenários de Teste
1. ✅ Alterar senha no portal da organização → Login no portal do cliente funciona
2. ✅ Alterar senha no portal do cliente → Login no portal da organização funciona
3. ✅ Reset de senha via email → Todos os contextos atualizados
4. ✅ Admin redefine senha → Todos os contextos atualizados
5. ✅ Usuário com 3+ contextos → Todos sincronizados

### Comandos de Teste
```bash
# Verificar sincronização
node -e "
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('tatuticket', 'postgres', 'postgres', {
  host: 'localhost', port: 5432, dialect: 'postgres', logging: false
});

(async () => {
  const [org] = await sequelize.query(
    \"SELECT email, substring(password, 1, 30) as hash FROM organization_users WHERE email = 'multicontext@test.com'\"
  );
  const [client] = await sequelize.query(
    \"SELECT email, substring(password, 1, 30) as hash FROM client_users WHERE email = 'multicontext@test.com'\"
  );
  
  const allHashes = [...org, ...client].map(u => u.hash);
  const unique = [...new Set(allHashes)];
  
  console.log('Total:', allHashes.length, 'Únicos:', unique.length);
  console.log(unique.length === 1 ? '✅ Sincronizado' : '❌ Dessincronizado');
  
  await sequelize.close();
})();
"
```

## 📚 Referências

- Arquivo: `backend/src/utils/passwordSync.js`
- Controllers atualizados:
  - `backend/src/modules/auth/authController.js`
  - `backend/src/modules/clients/clientUserManagementController.js`
  - `backend/src/modules/users/userController.js`
- Modelos: `OrganizationUser`, `ClientUser`
- Documentos relacionados: `IMPLEMENTACAO-MULTI-CONTEXT-COMPLETA.md`
