# Checklist de Deploy para Produção

## Data: 04/04/2026

Este checklist garante que todas as implementações estão prontas para produção.

---

## 🔍 PRÉ-DEPLOY

### Backend

#### Dependências
- [ ] Instalar node-cron: `npm install node-cron`
- [ ] Verificar package.json atualizado
- [ ] Executar `npm audit` para verificar vulnerabilidades
- [ ] Executar `npm install` para garantir todas as dependências

#### Variáveis de Ambiente
- [ ] `FRONTEND_URL` configurado
- [ ] `SMTP_HOST` configurado (se usar emails)
- [ ] `SMTP_PORT` configurado
- [ ] `SMTP_USER` configurado
- [ ] `SMTP_PASS` configurado
- [ ] `SMTP_FROM` configurado
- [ ] `DATABASE_URL` configurado
- [ ] `JWT_SECRET` configurado
- [ ] `NODE_ENV=production`

#### Migrações
- [ ] Executar migrações pendentes: `npm run migrate`
- [ ] Verificar tabelas criadas:
  - [ ] `subscriptions`
  - [ ] `plans`
  - [ ] `notifications`
  - [ ] `context_sessions`
  - [ ] `context_audit_logs`

#### Testes Backend
- [ ] Testar endpoint de renovação: `POST /api/subscription/renew`
- [ ] Testar endpoint de subscrição atual: `GET /api/subscription`
- [ ] Testar filtros de tickets: `GET /api/tickets?status=novo`
- [ ] Testar filtro de data: `GET /api/tickets?dateFrom=2026-01-01`
- [ ] Testar filtro de categoria: `GET /api/tickets?categoryId=uuid`
- [ ] Verificar logs do servidor
- [ ] Verificar cron job iniciado

### Frontend

#### Dependências
- [ ] Executar `npm install` no portal
- [ ] Verificar build: `npm run build`
- [ ] Testar build localmente

#### Componentes
- [ ] SubscriptionAlert renderiza corretamente
- [ ] Menu de Subscrição visível apenas para admins
- [ ] Filtros funcionam corretamente
- [ ] Botão de renovação aparece quando necessário

#### Testes Frontend
- [ ] Testar login
- [ ] Testar filtros na página de tickets
- [ ] Testar filtros no Kanban
- [ ] Testar página de subscrição
- [ ] Testar alerta de subscrição
- [ ] Testar renovação de subscrição
- [ ] Verificar console do navegador (sem erros)

---

## 🧪 TESTES FUNCIONAIS

### Filtros

#### Status
- [ ] Selecionar "Novo" → Tickets filtrados corretamente
- [ ] Selecionar "Em Progresso" → Tickets filtrados corretamente
- [ ] Selecionar "Resolvido" → Tickets filtrados corretamente
- [ ] Limpar filtro → Todos os tickets aparecem

#### Prioridade
- [ ] Selecionar "Baixa" → Tickets filtrados corretamente
- [ ] Selecionar "Média" → Tickets filtrados corretamente
- [ ] Selecionar "Alta" → Tickets filtrados corretamente
- [ ] Selecionar "Crítica" → Tickets filtrados corretamente

#### Atribuído a
- [ ] Selecionar usuário → Tickets do usuário aparecem
- [ ] Selecionar "Não atribuído" → Tickets sem assignee aparecem
- [ ] Combinar com outros filtros → Funciona corretamente

#### Solicitante (Cliente)
- [ ] Selecionar empresa cliente → Tickets da empresa aparecem
- [ ] Combinar com outros filtros → Funciona corretamente

#### Data
- [ ] Selecionar "Data De" → Tickets a partir da data aparecem
- [ ] Selecionar "Data Até" → Tickets até a data aparecem
- [ ] Selecionar período completo → Tickets no período aparecem

#### Categoria
- [ ] Selecionar categoria → Tickets da categoria aparecem
- [ ] Combinar com outros filtros → Funciona corretamente

#### Kanban
- [ ] Filtro de cliente funciona
- [ ] Filtro de atribuído funciona
- [ ] Filtro "Meus Tickets" funciona

### Sistema de Subscrição

#### Notificações
- [ ] Criar subscrição em trial com 3 dias
- [ ] Executar cron job manualmente
- [ ] Verificar notificação criada
- [ ] Verificar email enviado (se SMTP configurado)

#### Alerta Visual
- [ ] Trial com 7 dias → Alerta amarelo aparece
- [ ] Trial com 3 dias → Alerta vermelho aparece
- [ ] Trial expirado → Alerta vermelho aparece
- [ ] Subscrição ativa → Sem alerta
- [ ] Dispensar alerta → Não aparece mais hoje

#### Renovação
- [ ] Subscrição expirada → Botão "Renovar Agora" aparece
- [ ] Clicar "Renovar Agora" → Confirmação aparece
- [ ] Confirmar → Status muda para 'active'
- [ ] Período atualizado (+1 mês)
- [ ] Alerta desaparece

#### Controle de Acesso
- [ ] Admin → Menu "Subscrição" visível
- [ ] Agente → Menu "Subscrição" não visível
- [ ] Usuário normal → Menu "Subscrição" não visível

---

## 🔒 SEGURANÇA

### Backend
- [ ] Endpoints protegidos com autenticação
- [ ] Validação de contexto implementada
- [ ] Auditoria de ações críticas
- [ ] Rate limiting configurado
- [ ] CORS configurado corretamente
- [ ] Helmet.js configurado
- [ ] SQL injection prevenido (Sequelize)
- [ ] XSS prevenido

### Frontend
- [ ] Tokens armazenados com segurança
- [ ] Logout limpa dados sensíveis
- [ ] Rotas protegidas
- [ ] Validação de inputs
- [ ] Sanitização de dados

---

## 📊 PERFORMANCE

### Backend
- [ ] Índices de banco de dados criados
- [ ] Queries otimizadas
- [ ] Cache configurado (Redis)
- [ ] Logs configurados
- [ ] Monitoramento configurado

### Frontend
- [ ] Build otimizado
- [ ] Lazy loading implementado
- [ ] Imagens otimizadas
- [ ] Bundle size aceitável

---

## 🚀 DEPLOY

### Preparação
- [ ] Backup do banco de dados
- [ ] Backup dos arquivos
- [ ] Plano de rollback preparado
- [ ] Documentação atualizada

### Backend
- [ ] Código commitado no Git
- [ ] Tag de versão criada
- [ ] Build executado
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] Migrações executadas
- [ ] Servidor reiniciado
- [ ] Logs verificados

### Frontend
- [ ] Código commitado no Git
- [ ] Build executado: `npm run build`
- [ ] Arquivos enviados para servidor
- [ ] Cache limpo
- [ ] Aplicação acessível

### Verificação Pós-Deploy
- [ ] Aplicação carrega corretamente
- [ ] Login funciona
- [ ] Filtros funcionam
- [ ] Subscrição funciona
- [ ] Cron job está rodando
- [ ] Logs sem erros críticos
- [ ] Performance aceitável

---

## 📝 DOCUMENTAÇÃO

### Para Desenvolvedores
- [ ] README.md atualizado
- [ ] CHANGELOG.md atualizado
- [ ] Documentação de API atualizada
- [ ] Comentários no código

### Para Usuários
- [ ] Manual de usuário atualizado
- [ ] Guia de filtros criado
- [ ] Guia de subscrição criado
- [ ] FAQ atualizado

### Para Administradores
- [ ] Guia de instalação
- [ ] Guia de configuração
- [ ] Guia de troubleshooting
- [ ] Guia de backup/restore

---

## 🔧 MONITORAMENTO

### Logs
- [ ] Logs de aplicação configurados
- [ ] Logs de erro configurados
- [ ] Logs de acesso configurados
- [ ] Rotação de logs configurada

### Alertas
- [ ] Alertas de erro configurados
- [ ] Alertas de performance configurados
- [ ] Alertas de disco configurados
- [ ] Alertas de memória configurados

### Métricas
- [ ] Uptime monitorado
- [ ] Response time monitorado
- [ ] Taxa de erro monitorada
- [ ] Uso de recursos monitorado

---

## 🆘 PLANO DE CONTINGÊNCIA

### Rollback
- [ ] Procedimento de rollback documentado
- [ ] Backup testado
- [ ] Tempo de rollback estimado
- [ ] Responsáveis definidos

### Suporte
- [ ] Equipe de suporte notificada
- [ ] Canais de comunicação definidos
- [ ] Escalação definida
- [ ] Horário de suporte definido

---

## ✅ APROVAÇÕES

### Técnica
- [ ] Code review realizado
- [ ] Testes aprovados
- [ ] Performance aprovada
- [ ] Segurança aprovada

### Negócio
- [ ] Product Owner aprovou
- [ ] Stakeholders notificados
- [ ] Usuários-chave treinados
- [ ] Comunicação preparada

---

## 📅 CRONOGRAMA

### Pré-Deploy
- [ ] Data: ___/___/______
- [ ] Horário: ___:___
- [ ] Responsável: _______________

### Deploy
- [ ] Data: ___/___/______
- [ ] Horário: ___:___
- [ ] Responsável: _______________
- [ ] Janela de manutenção: ___ horas

### Pós-Deploy
- [ ] Verificação: ___/___/______ ___:___
- [ ] Monitoramento: ___ horas
- [ ] Responsável: _______________

---

## 🎯 CRITÉRIOS DE SUCESSO

### Funcional
- [ ] Todos os filtros funcionam
- [ ] Sistema de subscrição funciona
- [ ] Notificações são enviadas
- [ ] Renovação funciona

### Performance
- [ ] Tempo de resposta < 2s
- [ ] Uptime > 99%
- [ ] Taxa de erro < 1%

### Negócio
- [ ] Usuários conseguem filtrar tickets
- [ ] Admins recebem alertas de expiração
- [ ] Renovações são processadas
- [ ] Satisfação do usuário mantida

---

## 📞 CONTATOS DE EMERGÊNCIA

### Técnico
- **DevOps:** _______________
- **Backend:** _______________
- **Frontend:** _______________
- **DBA:** _______________

### Negócio
- **Product Owner:** _______________
- **Gerente de Projeto:** _______________
- **Suporte:** _______________

---

## 📋 NOTAS FINAIS

### Observações
```
[Adicionar observações específicas do deploy]
```

### Riscos Identificados
```
[Listar riscos e mitigações]
```

### Lições Aprendidas
```
[Documentar após o deploy]
```

---

**Preparado por:** _______________ **Data:** ___/___/______  
**Revisado por:** _______________ **Data:** ___/___/______  
**Aprovado por:** _______________ **Data:** ___/___/______

---

## 🎉 PÓS-DEPLOY

Após completar todos os itens acima:

1. ✅ Marcar deploy como concluído
2. ✅ Notificar stakeholders
3. ✅ Atualizar documentação
4. ✅ Celebrar! 🎊

**Status:** [ ] Pendente [ ] Em Progresso [ ] Concluído

**Data de Conclusão:** ___/___/______
