-- Adicionar novos valores ao enum de ticket_history.action
-- Necessário para suportar ações de aprovação e rejeição

-- Adicionar 'approval' ao enum
ALTER TYPE enum_ticket_history_action ADD VALUE IF NOT EXISTS 'approval';

-- Adicionar 'rejection' ao enum
ALTER TYPE enum_ticket_history_action ADD VALUE IF NOT EXISTS 'rejection';

-- Verificar valores do enum
SELECT unnest(enum_range(NULL::enum_ticket_history_action)) AS action_values;
