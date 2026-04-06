# Correção dos Filtros de Status e Prioridade

## Data: 04/04/2026

## Problema Identificado

Os filtros de Status e Prioridade no componente `AdvancedSearch` estavam usando valores incorretos que não correspondiam aos dados reais armazenados no banco de dados.

## Correções Realizadas

### 1. Filtro de Status

**Arquivo:** `portalOrganizaçãoTenant/src/components/AdvancedSearch.jsx`

**Valores INCORRETOS (antes):**
- `aberto` → ❌ Não existe no sistema
- `em-progresso` → ❌ Formato incorreto (hífen em vez de underscore)
- `cancelado` → ❌ Não existe no sistema

**Valores CORRETOS (depois):**
- `novo` ✅
- `aguardando_aprovacao` ✅
- `em_progresso` ✅ (com underscore)
- `aguardando_cliente` ✅
- `resolvido` ✅
- `fechado` ✅

**Fonte:** Campo `status` no model `Ticket` (ENUM definido em `backend/src/modules/tickets/ticketModel.js` linha 40)

### 2. Filtro de Prioridade

**Arquivo:** `portalOrganizaçãoTenant/src/components/AdvancedSearch.jsx`

**Valores INCORRETOS (antes):**
- `baixa` → ❌ Primeira letra minúscula
- `media` → ❌ Primeira letra minúscula
- `alta` → ❌ Primeira letra minúscula
- `critica` → ❌ Primeira letra minúscula

**Valores CORRETOS (depois):**
- `Baixa` ✅ (primeira letra maiúscula)
- `Média` ✅ (primeira letra maiúscula + acento)
- `Alta` ✅ (primeira letra maiúscula)
- `Crítica` ✅ (primeira letra maiúscula + acento)

**Fonte:** Campo `priority` no model `Ticket` (STRING) + Seeds em `backend/src/services/organizationSeedService.js`

## Detalhes Técnicos

### Como o Backend Processa os Filtros

```javascript
// backend/src/modules/tickets/ticketController.js (linha 42)
if (priority) where.priority = priority;
```

O backend faz comparação **case-sensitive** direta, sem conversão de maiúsculas/minúsculas. Por isso é crucial que os valores enviados pelo frontend correspondam exatamente aos valores armazenados no banco.

### Estrutura do Campo Priority

- **Tipo:** `STRING` (não é ENUM)
- **Valores padrão criados no seed:** `Baixa`, `Média`, `Alta`, `Crítica`
- **Comparação:** Case-sensitive (diferencia maiúsculas de minúsculas)

### Estrutura do Campo Status

- **Tipo:** `ENUM`
- **Valores permitidos:** `novo`, `aguardando_aprovacao`, `em_progresso`, `aguardando_cliente`, `resolvido`, `fechado`
- **Formato:** snake_case (underscore)

## Impacto

✅ Os filtros agora funcionam corretamente e retornam os tickets esperados
✅ Alinhamento entre frontend e backend
✅ Experiência do usuário melhorada

## Arquivos Modificados

1. `portalOrganizaçãoTenant/src/components/AdvancedSearch.jsx`
   - Linha ~143-151: Filtro de Status
   - Linha ~153-163: Filtro de Prioridade
