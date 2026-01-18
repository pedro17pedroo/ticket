# 🔍 Debug: Atualização de Email em Direções

## Problema
O email da direção não está a ser atualizado. Frontend mostra sucesso mas o backend retorna `email: null`.

## Análise do Problema

### Sintomas
1. Frontend envia: `email: "sellerreview24@gmail.com"`
2. Backend recebe: `email: undefined`
3. Campo `email` está AUSENTE do `req.body` no backend

### Causa Raiz Identificada
O axios pode estar a remover o campo `email` do payload antes de enviar, possivelmente devido a:
- Serialização de valores `null` ou `undefined`
- Algum interceptor ou transformação
- Configuração do axios

## Correções Aplicadas

### 1. Frontend (`portalOrganizaçãoTenant/src/pages/Directions.jsx`)
```javascript
// ✅ ANTES: email: formData.email || ''
// ✅ AGORA: email: String(formData.email || '').trim()

const payload = {
  name: formData.name,
  isActive: formData.isActive,
  description: formData.description || '',
  code: formData.code || '',
  managerId: formData.managerId || '',
  email: String(formData.email || '').trim()  // Garantir que é string
}
```

**Mudanças:**
- Garantir que `email` seja sempre uma string (não null, não undefined)
- Usar `String()` para converter qualquer valor
- Adicionar `.trim()` para remover espaços
- Adicionar logs detalhados do tipo e valor

### 2. Axios Interceptor (`portalOrganizaçãoTenant/src/services/api.js`)
```javascript
// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // 🔍 DEBUG: Log do payload antes de enviar
  if (config.url?.includes('/directions/') && config.method === 'put') {
    console.log('🔍 AXIOS REQUEST - URL:', config.url)
    console.log('🔍 AXIOS REQUEST - Data ANTES:', JSON.stringify(config.data, null, 2))
  }
  
  return config
})
```

**Mudanças:**
- Adicionar logs no interceptor para ver o payload ANTES de enviar
- Verificar se o axios está a modificar o payload

### 3. Backend Controller (`backend/src/modules/directions/directionController.js`)
```javascript
console.log('🔍 ========== DEBUG UPDATE DIRECTION ==========');
console.log('🔍 req.body COMPLETO:', JSON.stringify(req.body, null, 2));
console.log('🔍 req.body.email:', req.body.email);
console.log('🔍 typeof req.body.email:', typeof req.body.email);
console.log('🔍 Object.keys(req.body):', Object.keys(req.body));
console.log('🔍 req.headers["content-type"]:', req.headers['content-type']);
console.log('🔍 ============================================');
```

**Mudanças:**
- Adicionar logs detalhados do `req.body`
- Verificar tipo do email
- Listar todas as chaves do body
- Verificar content-type do request

## Instruções de Teste

### Passo 1: Abrir Portal Organização
```bash
# URL: http://localhost:5173
# Login: tenant-admin@empresademo.com / TenantAdmin@123
```

### Passo 2: Navegar para Direções
1. Ir para menu "Direções"
2. Clicar em "Editar" na direção "TI"

### Passo 3: Adicionar Email
1. No campo "Email da Direção", inserir: `sellerreview24@gmail.com`
2. Clicar em "Atualizar Direção"

### Passo 4: Verificar Logs

#### Console do Browser (Frontend)
Procurar por:
```
📤 Enviando payload: {...}
📧 Email tipo: string valor: sellerreview24@gmail.com
🔍 AXIOS REQUEST - URL: /api/directions/...
🔍 AXIOS REQUEST - Data ANTES: {...}
```

**O que verificar:**
- ✅ `email` está presente no payload?
- ✅ `email` é do tipo `string`?
- ✅ `email` tem o valor correto?
- ✅ Axios não está a remover o campo?

#### Terminal do Backend
Procurar por:
```
🔍 ========== DEBUG UPDATE DIRECTION ==========
🔍 req.body COMPLETO: {...}
🔍 req.body.email: sellerreview24@gmail.com
🔍 typeof req.body.email: string
🔍 Object.keys(req.body): [...]
```

**O que verificar:**
- ✅ `email` está presente no `req.body`?
- ✅ `email` é do tipo `string`?
- ✅ `email` tem o valor correto?
- ✅ `email` está na lista de keys?

### Passo 5: Verificar Resultado
1. Fechar o modal
2. Verificar se o email aparece no card da direção
3. Recarregar a página
4. Verificar se o email persiste

## Cenários de Teste

### Cenário 1: Adicionar Email Novo
- **Estado Inicial:** Direção sem email (`email: null`)
- **Ação:** Adicionar `sellerreview24@gmail.com`
- **Resultado Esperado:** Email aparece no card

### Cenário 2: Atualizar Email Existente
- **Estado Inicial:** Direção com email `old@example.com`
- **Ação:** Mudar para `new@example.com`
- **Resultado Esperado:** Email atualizado no card

### Cenário 3: Remover Email
- **Estado Inicial:** Direção com email `test@example.com`
- **Ação:** Limpar campo de email (deixar vazio)
- **Resultado Esperado:** Email removido, card mostra "—"

## Próximos Passos

### Se o problema persistir:
1. **Verificar se axios está a remover o campo:**
   - Comparar logs do frontend vs backend
   - Se `email` está no frontend mas não no backend → problema no axios

2. **Verificar middleware do Express:**
   - Pode haver algum middleware a filtrar campos
   - Verificar `express.json()` e body-parser

3. **Verificar Content-Type:**
   - Deve ser `application/json`
   - Se for outro tipo, pode causar problemas na serialização

4. **Testar com curl:**
   ```bash
   curl -X PUT http://localhost:4003/api/directions/fbbb1b87-26c5-47df-a58a-8b18e9828c57 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"name":"TI","email":"test@example.com","isActive":true}'
   ```

### Se funcionar:
1. Remover logs de debug (ou deixar comentados)
2. Testar outros cenários (criar direção com email, etc)
3. Verificar se o problema afeta outras entidades (departments, sections)

## Status
- ✅ Backend reiniciado com logs de debug
- ✅ Frontend atualizado com conversão para string
- ✅ Axios interceptor com logs
- ⏳ Aguardando teste do utilizador

## Ficheiros Modificados
1. `backend/src/modules/directions/directionController.js` - Logs detalhados
2. `portalOrganizaçãoTenant/src/pages/Directions.jsx` - String() no email
3. `portalOrganizaçãoTenant/src/services/api.js` - Interceptor com logs
