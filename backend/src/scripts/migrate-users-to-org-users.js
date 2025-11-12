import { sequelize } from '../config/database.js';
import { User, OrganizationUser } from '../modules/models/index.js';
import logger from '../config/logger.js';

/**
 * Script para migrar usuários da tabela 'users' para 'organization_users'
 * 
 * Migra apenas usuários com roles de organização tenant:
 * - admin-org → org-admin
 * - agente → agent
 * - gestor → org-manager
 * - tecnico → technician
 */

const ROLE_MAPPING = {
  'admin-org': 'org-admin',
  'agente': 'agent',
  'agent': 'agent',
  'gestor': 'org-manager',
  'tecnico': 'technician',
  'technician': 'technician'
};

async function migrateUsersToOrgUsers() {
  try {
    logger.info('🔄 Iniciando migração de usuários...');

    // 1. Buscar todos os usuários com roles de organização (SQL direto)
    const [usersToMigrate] = await sequelize.query(`
      SELECT * FROM users 
      WHERE role IN ('admin-org', 'agente', 'agent')
    `);

    logger.info(`📊 Encontrados ${usersToMigrate.length} usuários para migrar`);

    if (usersToMigrate.length === 0) {
      logger.info('✅ Nenhum usuário para migrar');
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // 2. Migrar cada usuário
    for (const user of usersToMigrate) {
      try {
        // Verificar se já existe em organization_users
        const [existingCheck] = await sequelize.query(`
          SELECT id FROM organization_users 
          WHERE email = :email AND organization_id = :orgId
        `, {
          replacements: { 
            email: user.email, 
            orgId: user.organization_id 
          }
        });

        if (existingCheck.length > 0) {
          logger.warn(`⚠️ Usuário ${user.email} já existe em organization_users - pulando`);
          skipped++;
          continue;
        }

        // Mapear role
        const newRole = ROLE_MAPPING[user.role] || 'agent';

        // Criar em organization_users
        const permissions = user.permissions || {
          canManageTickets: true,
          canManageUsers: newRole === 'org-admin',
          canManageClients: newRole === 'org-admin',
          canViewReports: true,
          canManageSettings: newRole === 'org-admin'
        };

        const settings = user.settings || {
          notifications: true,
          emailNotifications: true,
          theme: 'light',
          language: 'pt',
          timezone: 'Europe/Lisbon'
        };

        await sequelize.query(`
          INSERT INTO organization_users (
            id, organization_id, name, email, password, role,
            avatar, phone, direction_id, department_id, section_id,
            permissions, settings, is_active, last_login,
            created_at, updated_at
          )
          VALUES (
            :id, :organizationId, :name, :email, :password, :role,
            :avatar, :phone, :directionId, :departmentId, :sectionId,
            :permissions::jsonb, :settings::jsonb, :isActive, :lastLogin,
            :createdAt, :updatedAt
          )
        `, {
          replacements: {
            id: user.id,
            organizationId: user.organization_id,
            name: user.name,
            email: user.email,
            password: user.password,
            role: newRole,
            avatar: user.avatar,
            phone: user.phone,
            directionId: user.direction_id,
            departmentId: user.department_id,
            sectionId: user.section_id,
            permissions: JSON.stringify(permissions),
            settings: JSON.stringify(settings),
            isActive: user.is_active !== false,
            lastLogin: user.last_login,
            createdAt: user.created_at || new Date(),
            updatedAt: user.updated_at || new Date()
          }
        });

        logger.info(`✅ Migrado: ${user.email} (${user.role} → ${newRole})`);
        migrated++;

      } catch (error) {
        logger.error(`❌ Erro ao migrar ${user.email}:`, error.message);
        errors++;
      }
    }

    // 3. Relatório final
    logger.info('');
    logger.info('📊 RELATÓRIO DE MIGRAÇÃO:');
    logger.info(`   ✅ Migrados: ${migrated}`);
    logger.info(`   ⚠️ Pulados: ${skipped}`);
    logger.info(`   ❌ Erros: ${errors}`);
    logger.info(`   📝 Total: ${usersToMigrate.length}`);
    logger.info('');

    if (migrated > 0) {
      logger.info('⚠️ IMPORTANTE:');
      logger.info('   Os usuários foram copiados para organization_users');
      logger.info('   Os registros originais em "users" NÃO foram removidos');
      logger.info('   Verifique se tudo está OK antes de remover os registros antigos');
      logger.info('');
      logger.info('   Para remover os usuários antigos (CUIDADO!):');
      logger.info(`   DELETE FROM users WHERE role IN ('admin-org', 'agente', 'agent');`);
    }

  } catch (error) {
    logger.error('❌ Erro na migração:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsersToOrgUsers()
    .then(() => {
      logger.info('✅ Migração concluída!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Migração falhou:', error);
      process.exit(1);
    });
}

export default migrateUsersToOrgUsers;
