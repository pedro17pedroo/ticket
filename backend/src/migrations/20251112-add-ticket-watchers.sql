-- Adicionar colunas para watchers/observadores nos tickets
ALTER TABLE "tickets" 
ADD COLUMN "client_watchers" TEXT[], -- Emails de clientes que devem receber notificações
ADD COLUMN "org_watchers" UUID[];    -- IDs de usuários da organização que devem receber notificações

-- Comentários para documentação
COMMENT ON COLUMN "tickets"."client_watchers" IS 'Array de emails de usuários do lado cliente que devem receber notificações sobre este ticket';
COMMENT ON COLUMN "tickets"."org_watchers" IS 'Array de UUIDs de usuários da organização que devem receber notificações sobre este ticket';

-- Índices para performance
CREATE INDEX "idx_tickets_client_watchers" ON "tickets" USING GIN ("client_watchers");
CREATE INDEX "idx_tickets_org_watchers" ON "tickets" USING GIN ("org_watchers");
