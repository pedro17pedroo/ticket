# Teste de Pagamento e-Kwanza

## Visão Geral

Este documento descreve o teste específico para o método de pagamento e-Kwanza, que retorna um QR Code para pagamento.

## Estrutura de Resposta Esperada

```json
{
  "success": true,
  "data": {
    "id": "UUID",
    "reference": "TRX071921307055",
    "status": "pending",
    "amount": 2500,
    "currency": "AOA",
    "paymentMethod": "ekwanza_qr",
    "code": "687479301",
    "qrCode": "Qk1MAAAAAAAAABoAAAAMAAAA4QDhAAEAGAD...",
    "providerStatus": 0,
    "expirationDate": "/Date(1772907493640)/",
    "message": "Código de pagamento criado com sucesso",
    "provider": "eKwanza Integrado",
    "createdAt": "2026-03-07T18:13:12.131Z",
    "fees": {
      "amount": 150,
      "netAmount": 2350
    },
    "_system_info": {
      "transaction_table_id": "UUID",
      "payment_reference": "TRX071921307055",
      "provider_external_id": "687479301"
    }
  }
}
```

## Campos Obrigatórios

### Nível Principal
- `success` (boolean): Indica se a operação foi bem-sucedida
- `data` (object): Dados do pagamento

### Nível data
- `id` (string/UUID): Identificador único da transação
- `reference` (string): Referência do pagamento
- `status` (string): Status do pagamento (pending, completed, failed)
- `amount` (number): Valor do pagamento em centavos
- `currency` (string): Moeda (AOA)
- `paymentMethod` (string): Método de pagamento (ekwanza_qr)
- `code` (string): Código de pagamento para o cliente
- `qrCode` (string): QR Code em base64 (formato BMP)
- `message` (string): Mensagem descritiva
- `provider` (string): Nome do provedor
- `createdAt` (string/ISO8601): Data de criação

### Campos Opcionais
- `providerStatus` (number): Status interno do provedor
- `expirationDate` (string): Data de expiração do código
- `fees` (object): Informações de taxas
  - `amount` (number): Valor da taxa
  - `netAmount` (number): Valor líquido (amount - fees.amount)
- `_system_info` (object): Informações internas do sistema
  - `transaction_table_id` (string): ID na tabela de transações
  - `payment_reference` (string): Referência do pagamento
  - `provider_external_id` (string): ID externo do provedor

## Validações Realizadas

### 1. Validação de Estrutura
- ✓ Presença de todos os campos obrigatórios
- ✓ Tipos de dados corretos
- ✓ Valores dentro dos ranges esperados

### 2. Validação de QR Code
- ✓ QR Code é uma string base64 válida
- ✓ Tamanho mínimo do QR Code (> 100 caracteres)
- ✓ Formato da imagem (BMP, PNG ou JPEG)

### 3. Validação de Taxas
- ✓ Cálculo correto: netAmount = amount - fees.amount
- ✓ Percentual de taxa razoável (< 10%)

### 4. Validação de Datas
- ✓ createdAt em formato ISO8601
- ✓ expirationDate presente e válida

## Como Executar o Teste

### Opção 1: Script Bash (Recomendado)
```bash
cd backend
./test-ekwanza.sh
```

### Opção 2: Node.js Direto
```bash
cd backend
node test-ekwanza-payment.js
```

### Opção 3: Com variáveis de ambiente customizadas
```bash
cd backend
API_BASE_URL=http://localhost:5000 TEST_TOKEN=seu_token node test-ekwanza-payment.js
```

## Pré-requisitos

1. **Servidor Backend Rodando**
   ```bash
   cd backend
   npm run dev
   ```

2. **Variáveis de Ambiente Configuradas**
   - `API_BASE_URL`: URL da API (padrão: http://localhost:5000)
   - `TEST_TOKEN`: Token de autenticação válido
   - `TPAGAMENTO_API_KEY`: Chave da API TPagamento
   - `TPAGAMENTO_API_URL`: URL da API TPagamento

3. **Dependências Instaladas**
   ```bash
   cd backend
   npm install
   ```

## Testes Executados

### Teste 1: Criar Pagamento e-Kwanza
- Envia requisição POST para `/api/payments/create`
- Valida estrutura completa da resposta
- Verifica formato do QR Code
- Valida cálculo de taxas

### Teste 2: Consultar Status do Pagamento
- Envia requisição GET para `/api/payments/{id}/status`
- Verifica se o status é retornado corretamente

### Teste 3: Validar Estrutura Mock
- Valida a estrutura de resposta fornecida como exemplo
- Garante que o formato esperado está correto

## Interpretação dos Resultados

### ✓ Teste Passou
- Todos os campos obrigatórios presentes
- Tipos de dados corretos
- QR Code válido
- Cálculos de taxas corretos

### ✗ Teste Falhou
- Campos obrigatórios ausentes
- Tipos de dados incorretos
- QR Code inválido ou ausente
- Erros de cálculo

### ⚠ Avisos
- Campos opcionais ausentes
- Valores fora do esperado mas não críticos
- Formatos alternativos mas válidos

## Exemplo de Saída

```
================================================================================
TESTE 1: Criar Pagamento e-Kwanza
================================================================================

ℹ Enviando requisição para criar pagamento...
✓ Pagamento criado com sucesso!

Resposta completa:
{
  "success": true,
  "data": {
    "id": "0788e968-fd86-472d-898d-734b252f8899",
    "reference": "TRX071921307055",
    ...
  }
}

ℹ Validando estrutura da resposta...
✓ Estrutura da resposta válida!

ℹ Informações do QR Code:
  - Código: 687479301
  - Tamanho do QR Code: 15000 caracteres
  - Formato: BMP (Bitmap) em base64

ℹ Informações de Taxas:
  - Valor total: 2500 AOA
  - Taxa: 150 AOA
  - Valor líquido: 2350 AOA
  - Percentual de taxa: 6.00%

================================================================================
RESUMO DOS TESTES
================================================================================

Total de testes: 3
✓ Testes aprovados: 3
Taxa de sucesso: 100.00%

✓ Todos os testes passaram!
```

## Troubleshooting

### Erro: "Arquivo .env não encontrado"
**Solução**: Crie o arquivo `.env` baseado no `.env.example`

### Erro: "Token de autenticação inválido"
**Solução**: Gere um novo token fazendo login na aplicação

### Erro: "Conexão recusada"
**Solução**: Verifique se o servidor backend está rodando

### Erro: "QR Code inválido"
**Solução**: Verifique a integração com a API TPagamento

## Próximos Passos

Após validar o e-Kwanza, testar os outros métodos:
1. ✓ e-Kwanza (QR Code)
2. ⏳ Multicaixa Express (Referência)
3. ⏳ Transferência Bancária (Dados bancários)
4. ⏳ Cartão de Crédito (Gateway)

## Referências

- [Documentação TPagamento](https://tpagamento.ao/docs)
- [Especificação e-Kwanza](https://ekwanza.ao/docs)
- [Guia de Testes de Pagamento](./GUIA-TESTE-PAGAMENTOS.md)
