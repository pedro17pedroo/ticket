-- Migration: Add reference fields to hours_transactions table
-- Date: 2026-02-21
-- Description: Adds fields to support multiple consumption types (ticket, project, manual)

-- Add new columns to hours_transactions
ALTER TABLE hours_transactions
ADD COLUMN IF NOT EXISTS reference_type VARCHAR(20) CHECK (reference_type IN ('ticket', 'project', 'manual')),
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS activity_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS original_hours DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS adjustment_note TEXT;

-- Add comment to columns
COMMENT ON COLUMN hours_transactions.reference_type IS 'Tipo de referência do consumo (ticket, project, manual)';
COMMENT ON COLUMN hours_transactions.reference_id IS 'ID do ticket ou projeto referenciado';
COMMENT ON COLUMN hours_transactions.activity_name IS 'Nome da atividade (para tipo manual)';
COMMENT ON COLUMN hours_transactions.original_hours IS 'Horas originais antes de ajuste manual';
COMMENT ON COLUMN hours_transactions.adjustment_note IS 'Nota de ajuste se horas foram modificadas';

-- Create index for reference lookups
CREATE INDEX IF NOT EXISTS idx_hours_transactions_reference 
ON hours_transactions(reference_type, reference_id);

-- Update existing records to have reference_type = 'ticket' where ticket_id is not null
UPDATE hours_transactions
SET reference_type = 'ticket',
    reference_id = ticket_id
WHERE ticket_id IS NOT NULL AND reference_type IS NULL;

-- Update existing records to have reference_type = 'manual' where ticket_id is null and type = 'consumo'
UPDATE hours_transactions
SET reference_type = 'manual'
WHERE ticket_id IS NULL AND type = 'consumo' AND reference_type IS NULL;
