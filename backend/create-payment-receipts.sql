-- Criar tabela payment_receipts
CREATE TABLE IF NOT EXISTS payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    pdf_path VARCHAR(500),
    pdf_url VARCHAR(500),
    emailed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS payment_receipts_transaction_id ON payment_receipts(transaction_id);
CREATE INDEX IF NOT EXISTS payment_receipts_receipt_number ON payment_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS payment_receipts_created_at ON payment_receipts(created_at);

-- Comentários
COMMENT ON TABLE payment_receipts IS 'Recibos de pagamento gerados';
COMMENT ON COLUMN payment_receipts.transaction_id IS 'Referência à transação de pagamento';
COMMENT ON COLUMN payment_receipts.receipt_number IS 'Número do recibo (único)';
COMMENT ON COLUMN payment_receipts.pdf_path IS 'Caminho do arquivo PDF do recibo';
COMMENT ON COLUMN payment_receipts.pdf_url IS 'URL pública do PDF do recibo';
COMMENT ON COLUMN payment_receipts.emailed_at IS 'Data de envio do recibo por email';
