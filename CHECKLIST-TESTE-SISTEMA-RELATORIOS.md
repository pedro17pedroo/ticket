# Checklist de Testes - Sistema de Relatórios

## ✅ Correções Aplicadas

- [x] Erro de referência circular no reportsService.js corrigido
- [x] Warnings de onClick duplicado no Sidebar.jsx resolvidos
- [x] Cache do Vite limpo
- [x] Todos os arquivos sem erros de diagnóstico
- [x] Sintaxe JavaScript validada

## 🧪 Testes a Realizar

### 1. Iniciar Aplicação

```bash
# Terminal 1 - Backend
cd backend
npm start
# Deve iniciar na porta 4003

# Terminal 2 - Frontend
cd portalOrganizaçãoTenant
npm run dev
# Deve iniciar na porta 5173
```

**Verificar:**
- [ ] Backend iniciou sem erros
- [ ] Frontend iniciou sem warnings
- [ ] Não há erros no console do navegador

### 2. Testar Navegação

**Acessar:** http://localhost:5173

**Verificar:**
- [ ] Login funciona corretamente
- [ ] Sidebar carrega sem erros
- [ ] Menu "Relatórios" aparece (se tiver permissão)
- [ ] Submenu de relatórios expande corretamente

### 3. Testar Relatórios Básicos

**Acessar:** `/reports/time`

**Verificar:**
- [ ] Página carrega sem erros
- [ ] Filtros aparecem corretamente
- [ ] Botão "Gerar Relatório" funciona
- [ ] Dados são exibidos na tabela
- [ ] Botão "Exportar CSV" funciona
- [ ] Botão "Exportar PDF" funciona ✨ (PRINCIPAL TESTE)
- [ ] Gráficos aparecem (se habilitados)

**Testar cada tipo de relatório:**
- [ ] Por Ticket
- [ ] Por Usuário
- [ ] Por Cliente
- [ ] Diário

### 4. Testar Dashboard Executivo

**Acessar:** `/reports/dashboard`

**Verificar:**
- [ ] 6 cards de métricas carregam
- [ ] Tendências aparecem (↑ ou ↓)
- [ ] Top 5 tickets exibido
- [ ] Top 5 usuários exibido
- [ ] 3 gráficos renderizam corretamente
- [ ] Insights automáticos aparecem
- [ ] Seletor de período funciona (7, 30, 60, 90 dias)

### 5. Testar Análises Avançadas

**Acessar:** `/reports/analytics`

**Verificar:**
- [ ] 4 cards de comparação carregam
- [ ] Percentuais de variação aparecem
- [ ] Gráfico comparativo renderiza
- [ ] Insights automáticos são gerados
- [ ] 3 indicadores de performance aparecem
- [ ] Seletor de período funciona

### 6. Testar Exportação PDF (CRÍTICO)

**Passos:**
1. Acessar qualquer relatório
2. Gerar relatório com filtros
3. Clicar em "Exportar PDF"

**Verificar:**
- [ ] Arquivo PDF é baixado
- [ ] Nome do arquivo está correto (formato: relatorio-tipo-data.pdf)
- [ ] PDF abre sem erros
- [ ] Título e subtítulo aparecem
- [ ] Período está correto
- [ ] Resumo está presente
- [ ] Tabela de dados está formatada
- [ ] Rodapé com paginação aparece
- [ ] Data de geração está correta

### 7. Testar Exportação CSV

**Passos:**
1. Acessar qualquer relatório
2. Gerar relatório com filtros
3. Clicar em "Exportar CSV"

**Verificar:**
- [ ] Arquivo CSV é baixado
- [ ] Nome do arquivo está correto
- [ ] CSV abre no Excel/LibreOffice
- [ ] Cabeçalhos estão corretos
- [ ] Dados estão formatados
- [ ] Encoding UTF-8 funciona (acentos corretos)

### 8. Testar Gráficos

**Verificar:**
- [ ] Gráfico de barras renderiza
- [ ] Gráfico de pizza renderiza
- [ ] Gráfico de linha renderiza
- [ ] Tooltips aparecem ao passar o mouse
- [ ] Cores estão corretas
- [ ] Legendas aparecem
- [ ] Gráficos são responsivos

### 9. Testar Filtros

**Verificar:**
- [ ] Filtro de data inicial funciona
- [ ] Filtro de data final funciona
- [ ] Filtro de ticket funciona (se aplicável)
- [ ] Filtro de usuário funciona (se aplicável)
- [ ] Filtro de cliente funciona (se aplicável)
- [ ] Botão "Limpar Filtros" funciona

### 10. Testar Permissões RBAC

**Testar com diferentes usuários:**
- [ ] org-admin: Acessa todos os relatórios
- [ ] org-manager: Acessa todos os relatórios
- [ ] org-agent: Acessa todos os relatórios
- [ ] Outros roles: Não veem menu de relatórios

### 11. Testar Responsividade

**Verificar em diferentes tamanhos:**
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### 12. Testar Performance

**Verificar:**
- [ ] Relatórios carregam em menos de 3 segundos
- [ ] Gráficos renderizam rapidamente
- [ ] Exportação PDF é rápida (< 5 segundos)
- [ ] Não há travamentos na interface

## 🐛 Problemas Conhecidos Resolvidos

- ✅ Erro de referência circular no exportToPDF
- ✅ Warnings de onClick duplicado
- ✅ Cache do Vite causando problemas

## 📝 Notas Importantes

1. **Backend deve estar rodando na porta 4003**
2. **Apenas registros com status='stopped' são contabilizados**
3. **Permissão 'reports:read' é necessária**
4. **Bibliotecas necessárias:**
   - recharts (gráficos)
   - jspdf (PDF)
   - jspdf-autotable (tabelas PDF)

## 🚀 Próximos Passos Após Testes

Se todos os testes passarem:
1. Fazer commit das correções
2. Fazer push para o repositório
3. Atualizar documentação de produção
4. Notificar equipe sobre novo sistema

Se houver problemas:
1. Anotar o erro específico
2. Verificar console do navegador
3. Verificar logs do backend
4. Consultar documentação criada

## 📚 Documentação de Referência

- `SISTEMA-RELATORIOS-HORAS.md` - Visão geral
- `GUIA-TESTE-RELATORIOS.md` - Guia detalhado
- `CORRECAO-ERRO-REFERENCIA-CIRCULAR.md` - Correção aplicada
- `RESUMO-CORRECOES-FINAIS.md` - Resumo completo

---

**Data:** 09/03/2026  
**Status:** Pronto para testes  
**Prioridade:** Alta - Testar exportação PDF
