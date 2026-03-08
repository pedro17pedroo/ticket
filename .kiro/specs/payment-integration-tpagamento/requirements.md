# Requisitos - Integração de Pagamentos TPagamento

## Visão Geral
Implementar integração completa com o gateway de pagamentos TPagamento (Angola) no sistema SaaS, incluindo:
- Processo de onboarding com opção de pagamento ou período de teste
- Gestão de subscrições no portal da organização
- Histórico de pagamentos e recibos

## Métodos de Pagamento Suportados

### 1. E-Kwanza
- Pagamento via código de pagamento
- Requer: valor, código de referência, número de telemóvel

### 2. Multicaixa Express (GPO)
- Pagamento via GPO
- Requer: valor, dados do cliente, descrição
- Expira em 30 minutos

### 3. Referência Multicaixa (REF)
- Pagamento via referência EMIS
- Requer: valor, dados do cliente, descrição
- Expira em 60 minutos

## Requisitos Funcionais

### RF1: Configuração do Gateway
- Adicionar variáveis de ambiente no backend (.env)
- Criar serviço TPagamento no backend
- Implementar endpoints de pagamento

### RF2: Processo de Onboarding (Portal SaaS)
- Adicionar step de pagamento no onboarding
- Se plano tem período de teste (trialDays > 0):
  - Mostrar opção "Pular e iniciar período de teste"
  - Permitir continuar sem pagamento
- Se plano não tem período de teste:
  - Pagamento obrigatório
- Exibir os 3 métodos de pagamento disponíveis
- Processar pagamento e criar subscription

### RF3: Gestão de Subscrição (Portal Organização)
- Página de gestão de subscrição
- Visualizar plano atual e limites
- Adicionar/atualizar método de pagamento
- Upgrade/downgrade de plano
- Histórico de pagamentos
- Download de recibos

### RF4: Webhooks e Confirmação
- Endpoint para receber webhooks do TPagamento
- Atualizar status de pagamento automaticamente
- Polling manual para verificar status
- Notificações de pagamento confirmado/falhado

### RF5: Modelos de Dados
- Criar modelo Payment
- Criar modelo PaymentMethod
- Relacionar com Subscription e Organization

## Requisitos Não-Funcionais

### RNF1: Segurança
- API Key armazenada em variável de ambiente
- Webhook secret para validar requisições
- Dados de pagamento não armazenados (apenas referências)

### RNF2: Confiabilidade
- Retry automático em caso de falha de rede
- Logs detalhados de transações
- Tratamento de erros adequado

### RNF3: Usabilidade
- Interface intuitiva para seleção de método
- Feedback visual do status do pagamento
- Instruções claras para cada método

## Fluxos Principais

### Fluxo 1: Onboarding com Pagamento
1. Usuário completa dados da organização
2. Seleciona plano
3. Se plano tem trial: opção de pular pagamento
4. Se não pular: seleciona método de pagamento
5. Processa pagamento
6. Aguarda confirmação
7. Cria organização e subscription

### Fluxo 2: Onboarding com Trial
1. Usuário completa dados da organização
2. Seleciona plano com trial
3. Clica em "Pular e iniciar período de teste"
4. Cria organização com subscription status='trial'
5. Redireciona para portal

### Fluxo 3: Adicionar Método de Pagamento
1. Org-admin acessa gestão de subscrição
2. Clica em "Adicionar método de pagamento"
3. Seleciona método (E-Kwanza, GPO ou REF)
4. Preenche dados necessários
5. Processa pagamento
6. Salva método como padrão

### Fluxo 4: Upgrade de Plano
1. Org-admin visualiza planos disponíveis
2. Seleciona plano superior
3. Sistema calcula valor proporcional
4. Processa pagamento
5. Atualiza subscription

## Critérios de Aceitação

- [ ] Variáveis de ambiente configuradas
- [ ] Serviço TPagamento implementado
- [ ] Modelos Payment e PaymentMethod criados
- [ ] Step de pagamento no onboarding funcional
- [ ] Opção de pular pagamento quando há trial
- [ ] 3 métodos de pagamento funcionando
- [ ] Página de gestão de subscrição criada
- [ ] Histórico de pagamentos visível
- [ ] Webhooks recebendo confirmações
- [ ] Testes de integração passando
