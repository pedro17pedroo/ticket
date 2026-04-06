# Correção dos Modais de Pagamento

## Alterações Realizadas

### 1. RenewModal
✅ Adicionado método E-Kwanza
✅ Campos dinâmicos por método de pagamento:
- E-Kwanza: apenas número de telefone
- Multicaixa Express (GPO): nome, email e telefone
- Referência Multicaixa (REF): nome, email e telefone

### 2. UpgradeModal
Precisa das mesmas alterações do RenewModal:
- Adicionar método ekwanza
- Adicionar campos dinâmicos
- Validações específicas por método

## Métodos de Pagamento Aceitos pelo Backend
- `ekwanza` - E-Kwanza (requer telefone)
- `gpo` - Multicaixa Express (requer dados completos)
- `ref` - Referência Multicaixa (requer dados completos)

## Próximos Passos
1. Aplicar as mesmas alterações no UpgradeModal
2. Testar todos os métodos de pagamento
3. Verificar logs do backend para erro 500

## Status
- RenewModal: ✅ Atualizado
- UpgradeModal: ⏳ Pendente
