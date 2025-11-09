-- Marcar migrações antigas como executadas
INSERT INTO "SequelizeMeta" (name) VALUES ('20251023-add-client-id-to-structure.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251023-add-client-id-to-users.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251023-create-attachments.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251024-add-direction-id-to-users.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251024-add-section-id-to-users.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251024-improve-hours-bank.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251025-create-catalog.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251025-create-response-templates.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251025-create-tags.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251025-create-time-tracking.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251029-add-missing-software-columns.cjs')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('20251101_add_comment_id_to_attachments.js')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "SequelizeMeta" (name) VALUES ('updateCommentsOrganization.js')
ON CONFLICT (name) DO NOTHING;
