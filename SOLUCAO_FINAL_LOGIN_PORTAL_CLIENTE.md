# ✅ SOLUÇÃO FINAL: Login Portal Cliente - Senha Hash Duplo

**Data:** 05/11/2025 13:36  
**Status:** ✅ **RESOLVIDO DEFINITIVAMENTE**

---

## 🐛 PROBLEMA RAIZ

### **Sintoma:**
```
POST /api/auth/login 401 (Unauthorized)
Response: { "error": "Credenciais inválidas" }
```

Login falhava mesmo com:
- ✅ Usuários criados no banco
- ✅ ENUM com roles corretos
- ✅ Credenciais corretas

---

## 🔍 CAUSA RAIZ: HASH DUPLO DE SENHA

O script de criação de usuários estava **hasheando a senha DUAS VEZES**:

### **Fluxo do Bug:**

```javascript
// 1️⃣ Script: create-client-users.js
const hashedPassword = await bcrypt.hash('ClientAdmin@123', 10);
// → $2a$10$XYzbHM7WvQtTHoN4RRr7YudOpSHoVsMqQ2mxHWUuaz3x1yquMMWbi

// 2️⃣ User.create({ password: hashedPassword })

// 3️⃣ Model Hook: userModel.js beforeCreate
beforeCreate: async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    // → Hash do hash! ❌
  }
}

// 4️⃣ Banco recebe: hash(hash(senha)) ❌
```

### **Resultado:**
```javascript
// Banco de dados armazenava:
hash('$2a$10$XYzbHM7WvQtTHoN4RRr7YudOpSHoVsMqQ2mxHWUuaz3x1yquMMWbi')
// Em vez de:
hash('ClientAdmin@123')
```

### **No Login:**
```javascript
bcrypt.compare('ClientAdmin@123', hash_duplo) 
// → false ❌
```

---

## ✅ SOLUÇÕES APLICADAS

### **1. Adicionar Scope `withPassword` ao Model**

O scope estava definido no `authController.js` mas não no `userModel.js`.

**Arquivo:** `/backend/src/modules/users/userModel.js`

```javascript
// ✅ ADICIONADO
User.addScope('withPassword', {
  attributes: { include: ['password'] }
});
```

**Antes:** Scope não encontrado → erro ao buscar usuário  
**Depois:** Scope funciona → usuário encontrado com senha

---

### **2. Recriar Usuários com Senha em Texto Puro**

**Script:** `recreate-client-users.js`

```javascript
// ✅ CORRETO - Senha em TEXTO PURO
const plainPassword = 'ClientAdmin@123';

await User.create({
  email: 'admin@acme.pt',
  password: plainPassword,  // ← Hook vai hashear!
  role: 'client-admin'
});
```

**Fluxo Correto:**
```
1. Script passa senha em texto puro
2. Hook beforeCreate detecta senha
3. Hash é gerado: bcrypt.hash('ClientAdmin@123', salt)
4. Banco armazena hash correto
5. Login compara: bcrypt.compare('ClientAdmin@123', hash) → true ✅
```

---

### **3. Adicionar Logs de Debug no AuthController**

**Arquivo:** `/backend/src/modules/auth/authController.js`

```javascript
export const login = async (req, res, next) => {
  console.log('🔐 Login attempt:', email);
  
  const user = await User.scope('withPassword').findOne({ where: { email } });
  
  console.log('👤 User found:', user ? { 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    isActive: user.isActive, 
    hasPassword: !!user.password 
  } : 'NOT FOUND');
  
  console.log('🔑 Comparing passwords...');
  const isPasswordValid = await user.comparePassword(password);
  console.log('🔑 Password valid:', isPasswordValid);
};
```

**Logs agora mostram:**
```
🔐 Login attempt: admin@acme.pt
👤 User found: { id: '22222...', email: 'admin@acme.pt', role: 'client-admin', isActive: true, hasPassword: true }
🔑 Comparing passwords...
🔑 Password valid: true
```

---

## 📊 VERIFICAÇÃO

### **Teste de Senha no Banco:**

```bash
node -e "
import { User } from './src/modules/models/index.js';
import bcrypt from 'bcryptjs';

const user = await User.scope('withPassword').findOne({ 
  where: { email: 'admin@acme.pt' } 
});

const isValid = await bcrypt.compare('ClientAdmin@123', user.password);
console.log('Password test:', isValid ? '✅ CORRETO' : '❌ INCORRETO');
"
```

**Resultado:**
```
✅ CORRETO
```

### **Teste de Login via API:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.pt","password":"ClientAdmin@123"}'
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "22222222-2222-2222-2222-222222222222",
    "email": "admin@acme.pt",
    "role": "client-admin",
    "name": "Admin ACME",
    "organization": {
      "name": "Empresa Demo"
    }
  }
}
```

✅ **Login bem-sucedido!**

---

## 📁 ARQUIVOS MODIFICADOS

| Arquivo | Mudança | Linha |
|---------|---------|-------|
| `userModel.js` | Adicionar scope `withPassword` | 162-165 |
| `authController.js` | Adicionar logs de debug | 10-35 |
| `authController.js` | Remover scope duplicado | Removido |

---

## 🎯 CREDENCIAIS VÁLIDAS

### **Portal Cliente** (http://localhost:5174)

```
Cliente 1 - ACME:
  ✅ admin@acme.pt / ClientAdmin@123 (client-admin)
  ✅ user@acme.pt / ClientAdmin@123 (client-user)

Cliente 2 - TechSolutions:
  ✅ admin@techsolutions.pt / ClientAdmin@123 (client-admin)
```

---

## 🔄 HISTÓRICO DE PROBLEMAS

### **Problema 1: Export Missing** ✅
- **Causa:** `clientUserService` não exportado em `api.js`
- **Solução:** Adicionar `export { clientUserService } from './clientUserService'`

### **Problema 2: Reload Infinito** ✅
- **Causa:** Interceptor redirecionava em erro de login
- **Solução:** Verificar `isLoginRequest` antes de redirecionar

### **Problema 3: Usuários Não Existiam** ✅
- **Causa:** ENUM sem roles de cliente
- **Solução:** Adicionar roles ao ENUM + criar usuários

### **Problema 4: Hash Duplo de Senha** ✅ (ESTE)
- **Causa:** Script hasheava + hook hasheava novamente
- **Solução:** Passar senha em texto puro para o model

---

## ⚠️ LIÇÕES APRENDIDAS

### **1. Nunca Hashear Senha Antes do Model**

❌ **ERRADO:**
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
await User.create({ password: hashedPassword });
// Hook vai hashear novamente!
```

✅ **CORRETO:**
```javascript
await User.create({ password: plainPassword });
// Hook hasheia automaticamente
```

### **2. Sempre Definir Scopes no Model**

❌ **ERRADO:**
```javascript
// authController.js
User.addScope('withPassword', { ... });
```

✅ **CORRETO:**
```javascript
// userModel.js (após definir o model)
User.addScope('withPassword', { ... });
```

### **3. Usar Logs para Debug de Autenticação**

```javascript
console.log('🔐 Login attempt:', email);
console.log('👤 User found:', user ? details : 'NOT FOUND');
console.log('🔑 Password valid:', isValid);
```

---

## 🧪 TESTE COMPLETO

### **1. Acesse o Portal:**
```
http://localhost:5174/
```

### **2. Faça Login:**
```
Email: admin@acme.pt
Senha: ClientAdmin@123
```

### **3. Resultado Esperado:**
```
✅ Login bem-sucedido
✅ Redirecionado para dashboard
✅ Token JWT gerado
✅ Dados do usuário carregados
```

### **4. Console do Navegador:**
```
🔐 Tentando login com: admin@acme.pt
✅ Resposta do login: { user: {...}, token: "..." }
```

### **5. Console do Backend:**
```
🔐 Login attempt: admin@acme.pt
👤 User found: { id: '222...', email: 'admin@acme.pt', role: 'client-admin', isActive: true, hasPassword: true }
🔑 Comparing passwords...
🔑 Password valid: true
```

---

## ✅ CHECKLIST FINAL

- [x] Scope `withPassword` no userModel
- [x] Usuários deletados e recriados
- [x] Senha em texto puro no script
- [x] Hash correto no banco de dados
- [x] Teste de comparação: ✅ CORRETO
- [x] Login via curl: ✅ SUCESSO
- [x] Logs de debug adicionados
- [x] Scripts temporários removidos

---

## 📊 RESUMO

### **Problema:**
Senha hasheada duas vezes (script + hook)

### **Detecção:**
```javascript
bcrypt.compare('ClientAdmin@123', user.password) → false ❌
```

### **Solução:**
Passar senha em texto puro, deixar hook hashear

### **Resultado:**
```javascript
bcrypt.compare('ClientAdmin@123', user.password) → true ✅
```

---

## 🎉 RESULTADO FINAL

```
✅ Scope withPassword funcionando
✅ Usuários recriados com senha correta
✅ Hash único (não duplo)
✅ Login via API: 200 OK
✅ Token JWT gerado
✅ Portal Cliente 100% operacional
```

---

**Portal Cliente completamente funcional! Login working! 🚀**

**Última atualização:** 05/11/2025 13:36  
**Status:** ✅ OPERACIONAL  
**Usuários:** 3 criados  
**Senhas:** Corretas
