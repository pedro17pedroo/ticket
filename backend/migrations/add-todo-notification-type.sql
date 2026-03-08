-- Migration: Adicionar tipo de notificação para To-Do
-- Data: 2026-02-21
-- Descrição: Adiciona 'todo_collaboration_added' ao enum de tipos de notificação

-- Adicionar novo valor ao enum de tipos de notificação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'todo_collaboration_added' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_notifications_type')
  ) THEN
    ALTER TYPE enum_notifications_type ADD VALUE 'todo_collaboration_added';
  END IF;
END
$$;

-- Verificar se foi adicionado
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_notifications_type')
ORDER BY enumlabel;
