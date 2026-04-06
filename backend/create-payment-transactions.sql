-- Criar ENUM para status
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela payment_transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON UPDATE CASCADE ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255),
    transaction_id VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS payment_transactions_organization_id ON payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS payment_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS payment_transactions_payment_method ON payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS payment_transactions_created_at ON payment_transactions(created_at);

-- Comentários
COMMENT ON TABLE payment_transactions IS 'Histórico de transações de pagamento';
COMMENT ON COLUMN payment_transactions.amount IS 'Valor do pagamento';
COMMENT ON COLUMN payment_transactions.currency IS 'Moeda (EUR, USD, AOA, etc.)';
COMMENT ON COLUMN payment_transactions.status IS 'Status do pagamento';
COMMENT ON COLUMN payment_transactions.payment_method IS 'Método de pagamento';
COMMENT ON COLUMN payment_transactions.payment_reference IS 'Referência do pagamento';
COMMENT ON COLUMN payment_transactions.transaction_id IS 'ID da transação no gateway';
COMMENT ON COLUMN payment_transactions.metadata IS 'Metadados adicionais';
COMMENT ON COLUMN payment_transactions.paid_at IS 'Data de confirmação do pagamento';
