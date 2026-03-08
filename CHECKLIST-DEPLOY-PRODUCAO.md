# ✅ Checklist de Deploy para Produção

**Data**: ___/___/______  
**Responsável**: _______________________  
**Horário Início**: _____:_____  
**Horário Fim**: _____:_____

---

## 📋 PRÉ-DEPLOY

### Preparação (1-2 dias antes)
- [ ] Ler `GUIA-DEPLOY-PRODUCAO.md` completamente
- [ ] Ler `DEPLOY-QUICK-REFERENCE.md`
- [ ] Testar deploy em ambiente de staging
- [ ] Verificar que staging está funcionando após deploy
- [ ] Agendar horário de baixo tráfego
- [ ] Notificar equipe sobre manutenção programada
- [ ] Preparar plano de comunicação com usuários

### Verificações Técnicas (1 hora antes)
- [ ] Verificar espaço em disco no servidor (mínimo 2x tamanho da BD)
- [ ] Verificar conectividade com base de dados de produção
- [ ] Verificar credenciais de acesso à base de dados
- [ ] Verificar que aplicação está rodando normalmente
- [ ] Verificar logs atuais (sem erros críticos)
- [ ] Ter acesso SSH ao servidor
- [ ] Ter acesso ao painel de controle da BD

### Equipe e Comunicação
- [ ] Equipe de desenvolvimento disponível
- [ ] Equipe de suporte notificada
- [ ] Canal de comunicação aberto (Slack/Teams/etc)
- [ ] Contatos de emergência acessíveis

---

## 🚀 EXECUÇÃO DO DEPLOY

### Passo 1: Configuração (2 minutos)
```bash
export PROD_DB_HOST="_______________"
export PROD_DB_USER="_______________"
export PROD_DB_NAME="_______________"
export PROD_DB_PASSWORD="_______________"
```

- [ ] Variáveis de ambiente configuradas
- [ ] Credenciais testadas (conexão bem-sucedida)

### Passo 2: Backup (1-5 minutos)
```bash
./deploy_to_production.sh
```

- [ ] Script iniciado
- [ ] Backup criado com sucesso
- [ ] Tamanho do backup verificado: _______ MB/GB
- [ ] Localização do backup anotada: `backups/backup_______________.dump`

### Passo 3: Execução das Migrações (10-30 segundos)
- [ ] Migrações iniciadas
- [ ] Mensagem "Criando tabela clients..." exibida
- [ ] Mensagem "Criando tabela client_users..." exibida
- [ ] Mensagem "Criando tabelas de controle de acesso..." exibida
- [ ] Mensagem "Criando tabelas de contexto..." exibida
- [ ] Mensagem "DEPLOY CONCLUÍDO COM SUCESSO!" exibida
- [ ] Nenhum erro exibido

### Passo 4: Verificação (10 segundos)
```bash
./verify_production_deployment.sh
```

- [ ] Script de verificação executado
- [ ] Mensagem "✅ Todas as 6 tabelas criadas" exibida
- [ ] Tabelas listadas:
  - [ ] clients
  - [ ] client_users
  - [ ] client_catalog_access
  - [ ] client_user_catalog_access
  - [ ] context_sessions
  - [ ] context_audit_logs
- [ ] ENUM client_user_role criado (3 valores)
- [ ] Constraints verificadas
- [ ] Índices criados
- [ ] Dados existentes preservados

### Passo 5: Reinício da Aplicação (10-30 segundos)
```bash
# Escolher comando apropriado:
pm2 restart backend
# OU
docker-compose restart backend
# OU
sudo systemctl restart tatuticket-backend
```

- [ ] Aplicação reiniciada
- [ ] Aplicação iniciou sem erros
- [ ] Logs verificados (sem erros críticos)

---

## ✅ PÓS-DEPLOY

### Verificações Imediatas (5 minutos)
- [ ] Health check: `curl https://dominio.com/api/health`
- [ ] Login no Portal Backoffice funciona
- [ ] Login no Portal Organização funciona
- [ ] Dashboard carrega corretamente
- [ ] Nenhum erro 500 nos logs
- [ ] Nenhum erro de base de dados nos logs

### Testes Funcionais (10 minutos)
- [ ] Criar nova organização (se aplicável)
- [ ] Criar novo usuário de organização
- [ ] Testar login com usuário existente
- [ ] Testar navegação entre páginas
- [ ] Verificar que dados existentes estão acessíveis
- [ ] Testar criação de ticket (se aplicável)

### Testes de Novas Funcionalidades (15 minutos)
- [ ] Criar empresa cliente (tabela `clients`)
- [ ] Criar usuário de empresa cliente (tabela `client_users`)
- [ ] Testar login com usuário de empresa cliente
- [ ] Testar multi-contexto (se usuário tem múltiplos contextos)
- [ ] Testar troca de contexto
- [ ] Verificar controle de acesso ao catálogo

### Monitoramento (1 hora)
- [ ] Monitorar logs em tempo real
- [ ] Verificar uso de CPU/memória
- [ ] Verificar tempo de resposta da aplicação
- [ ] Verificar queries lentas na base de dados
- [ ] Verificar erros reportados por usuários

---

## 🔄 ROLLBACK (Se Necessário)

### Indicadores para Rollback
- [ ] Erros críticos nos logs
- [ ] Aplicação não inicia
- [ ] Dados corrompidos ou inacessíveis
- [ ] Performance degradada significativamente
- [ ] Funcionalidades críticas não funcionam

### Procedimento de Rollback
```bash
# 1. Parar aplicação
pm2 stop backend

# 2. Restaurar backup
PGPASSWORD=$PROD_DB_PASSWORD pg_restore \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -c backups/backup_______________.dump

# 3. Reiniciar aplicação
pm2 start backend
```

- [ ] Aplicação parada
- [ ] Backup restaurado
- [ ] Aplicação reiniciada
- [ ] Sistema funcionando normalmente
- [ ] Usuários notificados

---

## 📊 MÉTRICAS

### Tempo de Execução
- Início: _____:_____
- Backup: _____:_____ (duração: _____ min)
- Migrações: _____:_____ (duração: _____ seg)
- Verificação: _____:_____ (duração: _____ seg)
- Reinício: _____:_____ (duração: _____ seg)
- Fim: _____:_____
- **Tempo Total**: _____ minutos

### Tamanhos
- Tamanho da BD antes: _______ MB/GB
- Tamanho do backup: _______ MB/GB
- Tamanho da BD depois: _______ MB/GB

### Contagens
- Organizações: _______ (antes) → _______ (depois)
- Usuários de organização: _______ (antes) → _______ (depois)
- Empresas clientes: _______ (antes) → _______ (depois)
- Usuários de empresas: _______ (antes) → _______ (depois)

---

## 📝 NOTAS E OBSERVAÇÕES

### Problemas Encontrados
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### Soluções Aplicadas
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### Melhorias para Próximo Deploy
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## ✅ APROVAÇÃO FINAL

### Critérios de Sucesso
- [ ] Deploy executado sem erros
- [ ] Todas as tabelas criadas
- [ ] Dados existentes preservados
- [ ] Aplicação funcionando normalmente
- [ ] Novas funcionalidades operacionais
- [ ] Nenhum erro crítico nos logs
- [ ] Performance aceitável
- [ ] Usuários conseguem acessar o sistema

### Assinaturas
- **Responsável pelo Deploy**: _______________________ Data: ___/___/___
- **Aprovação Técnica**: _______________________ Data: ___/___/___
- **Aprovação Gerencial**: _______________________ Data: ___/___/___

---

## 📞 CONTATOS DE EMERGÊNCIA

- **Desenvolvedor Principal**: _______________________
- **DBA**: _______________________
- **DevOps**: _______________________
- **Gerente de Projeto**: _______________________

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

- `GUIA-DEPLOY-PRODUCAO.md` - Guia completo
- `DEPLOY-QUICK-REFERENCE.md` - Referência rápida
- `RESTAURACAO-ARQUITETURA-SAAS.md` - Arquitetura
- `backend/docs/API-CONTEXT-SWITCHING.md` - API

---

**Status Final**: ⬜ SUCESSO | ⬜ ROLLBACK | ⬜ PARCIAL

**Observações Finais**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

