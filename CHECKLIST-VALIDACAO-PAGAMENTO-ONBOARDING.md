# Checklist de Validação - Pagamento no Onboarding

**Data:** 08/03/2026  
**Responsável:** _____________  
**Status:** 🟡 PENDENTE VALIDAÇÃO

---

## 1. Validação de Código

### Imports e Dependências
- [x] PaymentMethodSelector importado corretamente
- [x] PaymentInstructions importado corretamente
- [x] paymentService importado corretamente
- [x] Sem erros de compilação
- [x] Sem warnings críticos

### Estrutura de Steps
- [x] Array de steps atualizado (6 steps)
- [x] Ícones corretos para cada step
- [x] Descrições apropriadas
- [x] Step de pagamento na posição correta (4)

### Componente PaymentStep
- [x] Estados gerenciados corretamente
- [x] Handlers implementados
- [x] Lógica de skip payment
- [x] Integração com paymentService
- [x] Tratamento de erros
- [x] Loading states

### Navegação
- [x] getCurrentStepComponent() atualizado
- [x] Navegação entre steps funcional
- [x] Botões voltar/avançar corretos

---

## 2. Testes Funcionais

### Step 0 - Empresa
- [ ] Preencher todos os campos obrigatórios
- [ ] Validação de campos funciona
- [ ] Botão "Continuar" habilitado apenas quando válido
- [ ] Avança para step 1

### Step 1 - Administrador
- [ ] Preencher nome, email, telefone
- [ ] Validação de email funciona
- [ ] Botão "Voltar" retorna ao step 0
- [ ] Botão "Continuar" avança para step 2

### Step 2 - Verificação Email
- [ ] Email de verificação é enviado
- [ ] Código de 6 dígitos aceito
- [ ] Botão "Reenviar" funciona
- [ ] Verificação bem-sucedida avança para step 3
- [ ] Erro de código inválido exibido

### Step 3 - Senha
- [ ] Senha com mínimo 8 caracteres
- [ ] Confirmação de senha valida
- [ ] Senhas diferentes mostram erro
- [ ] Botão "Continuar" avança para step 4 (pagamento)
- [ ] Plano selecionado exibido corretamente

### Step 4 - Pagamento

#### Cenário A: Plano Gratuito
- [ ] Card de "Plano Gratuito" exibido
- [ ] Botão "Continuar" visível
- [ ] Clicar em "Continuar" cria organização
- [ ] Avança para step 5 (sucesso)
- [ ] paymentData = null no payload

#### Cenário B: Plano com Trial
- [ ] Card de "X dias de teste grátis" exibido
- [ ] Botão "Iniciar Teste Grátis" visível
- [ ] Seletor de método de pagamento também visível
- [ ] Opção 1: Pular pagamento funciona
- [ ] Opção 2: Pagar agora funciona

#### Cenário C: Plano Pago (e-Kwanza)
- [ ] Seletor de método exibido
- [ ] Selecionar e-Kwanza
- [ ] Botão "Processar Pagamento" habilitado
- [ ] Clicar cria transação
- [ ] QR Code exibido
- [ ] Código numérico exibido
- [ ] Polling de status iniciado
- [ ] Simulação de pagamento confirmado
- [ ] Organização criada com paymentData
- [ ] Avança para step 5

#### Cenário D: Plano Pago (Multicaixa Express)
- [ ] Selecionar Multicaixa Express
- [ ] Instruções exibidas
- [ ] Número de teste usado (244900000000)
- [ ] Pagamento confirmado instantaneamente
- [ ] Organização criada
- [ ] Avança para step 5

#### Cenário E: Plano Pago (Referência Multicaixa)
- [ ] Selecionar Referência Multicaixa
- [ ] Referência de 9 dígitos gerada
- [ ] Entidade 00348 exibida
- [ ] Data de validade exibida
- [ ] Polling de status funciona
- [ ] Simulação de pagamento confirmado
- [ ] Organização criada
- [ ] Avança para step 5

#### Cenário F: Erros de Pagamento
- [ ] Erro: Nenhum método selecionado
- [ ] Erro: Falha ao criar transação
- [ ] Erro: Pagamento expirado
- [ ] Erro: Pagamento rejeitado
- [ ] Botão "Voltar" permite escolher outro método
- [ ] Transação anterior é descartada

### Step 5 - Sucesso
- [ ] Mensagem de sucesso exibida
- [ ] URL de acesso exibida
- [ ] Email do admin exibido
- [ ] Informações da subscription exibidas
- [ ] Botão "Acessar Portal" funcional
- [ ] Link abre em nova aba

---

## 3. Integração Backend

### Endpoint /saas/onboarding
- [ ] Aceita campo `paymentData` no payload
- [ ] Valida estrutura de paymentData
- [ ] Cria organização corretamente
- [ ] Cria subscription com status correto
- [ ] Associa pagamento à subscription
- [ ] Retorna dados completos na resposta

### Validações Backend
- [ ] Valida transactionId se paymentData presente
- [ ] Verifica status do pagamento no TPagamento
- [ ] Rejeita se pagamento não confirmado
- [ ] Aceita null para trial/gratuito

### Subscription Status
- [ ] Status = "trial" quando trial ativo
- [ ] Status = "active" quando pagamento confirmado
- [ ] Status = "active" quando plano gratuito
- [ ] trialEndsAt calculado corretamente

---

## 4. Testes de Navegação

### Navegação Forward
- [ ] Step 0 → Step 1
- [ ] Step 1 → Step 2
- [ ] Step 2 → Step 3
- [ ] Step 3 → Step 4
- [ ] Step 4 → Step 5 (após pagamento/skip)

### Navegação Backward
- [ ] Step 1 → Step 0
- [ ] Step 2 → Step 1
- [ ] Step 3 → Step 2
- [ ] Step 4 → Step 3
- [ ] Step 5: Sem botão voltar

### Validações de Navegação
- [ ] Não pode avançar sem preencher obrigatórios
- [ ] Dados persistem ao voltar
- [ ] Plano selecionado persiste
- [ ] Pode alterar plano antes do pagamento

---

## 5. Testes de UI/UX

### Responsividade
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Elementos Visuais
- [ ] Progress bar atualiza corretamente
- [ ] Ícones dos steps corretos
- [ ] Cores e estilos consistentes
- [ ] Loading states visíveis
- [ ] Animações suaves

### Acessibilidade
- [ ] Navegação por teclado funciona
- [ ] Labels corretos nos inputs
- [ ] Mensagens de erro legíveis
- [ ] Contraste adequado
- [ ] Focus states visíveis

---

## 6. Testes de Performance

### Tempos de Resposta
- [ ] Criação de transação < 3s
- [ ] Polling não sobrecarrega
- [ ] Criação de organização < 5s
- [ ] Transições entre steps suaves

### Otimizações
- [ ] Componentes memoizados onde necessário
- [ ] Sem re-renders desnecessários
- [ ] Imagens otimizadas
- [ ] Código minificado

---

## 7. Testes de Segurança

### Dados Sensíveis
- [ ] Senha não aparece em logs
- [ ] Senha não aparece em console
- [ ] paymentData não expõe dados sensíveis
- [ ] Tokens não expostos no frontend

### Validações
- [ ] Validação de email no frontend e backend
- [ ] Validação de senha forte
- [ ] Sanitização de inputs
- [ ] Proteção contra XSS

---

## 8. Testes de Integração TPagamento

### e-Kwanza
- [ ] QR Code gerado corretamente
- [ ] Formato BMP válido
- [ ] Código numérico correto
- [ ] Polling detecta pagamento
- [ ] Taxa calculada corretamente (6%)

### Multicaixa Express
- [ ] Números de teste funcionam
  - [ ] 244900000000 - Sucesso
  - [ ] 244900000001 - Saldo Insuficiente
  - [ ] 244900000002 - Timeout
  - [ ] 244900000003 - Rejeitado
- [ ] Taxa calculada corretamente (5%)

### Referência Multicaixa
- [ ] Referência gerada
- [ ] Entidade correta (00348)
- [ ] Validade de 3 dias
- [ ] Taxa calculada corretamente (5.33%)

---

## 9. Testes de Erro

### Erros de Rede
- [ ] Timeout na criação de transação
- [ ] Timeout na criação de organização
- [ ] Erro 500 do backend
- [ ] Sem conexão com internet

### Erros de Validação
- [ ] Email inválido
- [ ] Senha fraca
- [ ] Código de verificação inválido
- [ ] Método de pagamento não selecionado

### Recuperação de Erros
- [ ] Mensagens de erro claras
- [ ] Opções de retry disponíveis
- [ ] Estado da aplicação consistente
- [ ] Dados não perdidos

---

## 10. Documentação

### Código
- [ ] Comentários em funções complexas
- [ ] JSDoc onde apropriado
- [ ] README atualizado
- [ ] CHANGELOG atualizado

### Usuário
- [ ] Guia de uso do onboarding
- [ ] FAQ sobre pagamentos
- [ ] Troubleshooting comum
- [ ] Vídeo tutorial (opcional)

### Técnica
- [ ] Documentação da API
- [ ] Diagramas de fluxo
- [ ] Especificação de paymentData
- [ ] Guia de integração

---

## 11. Deploy

### Pré-Deploy
- [ ] Todos os testes passando
- [ ] Code review aprovado
- [ ] Backend atualizado
- [ ] Variáveis de ambiente configuradas

### Deploy
- [ ] Build sem erros
- [ ] Deploy em staging
- [ ] Testes em staging
- [ ] Deploy em produção

### Pós-Deploy
- [ ] Monitoramento de erros
- [ ] Analytics configurado
- [ ] Logs funcionando
- [ ] Rollback plan pronto

---

## 12. Monitoramento

### Métricas
- [ ] Taxa de conversão por step
- [ ] Taxa de abandono no pagamento
- [ ] Métodos de pagamento mais usados
- [ ] Tempo médio no onboarding
- [ ] Taxa de sucesso de pagamentos

### Alertas
- [ ] Erro rate > 5%
- [ ] Tempo de resposta > 5s
- [ ] Taxa de abandono > 50%
- [ ] Falhas de pagamento > 10%

---

## Assinaturas

### Desenvolvedor
**Nome:** _____________  
**Data:** ___/___/______  
**Assinatura:** _____________

### QA/Tester
**Nome:** _____________  
**Data:** ___/___/______  
**Assinatura:** _____________

### Product Owner
**Nome:** _____________  
**Data:** ___/___/______  
**Assinatura:** _____________

### Aprovação Final
**Nome:** _____________  
**Data:** ___/___/______  
**Assinatura:** _____________

---

## Notas Adicionais

_Espaço para observações, bugs encontrados, melhorias sugeridas, etc._

```
_______________________________________________________________

_______________________________________________________________

_______________________________________________________________

_______________________________________________________________

_______________________________________________________________
```

---

**Status Final:** 
- [ ] ✅ APROVADO PARA PRODUÇÃO
- [ ] 🟡 APROVADO COM RESSALVAS
- [ ] ❌ REPROVADO - NECESSITA CORREÇÕES
