import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Script para adicionar permissões básicas aos client users
 * Client users precisam de permissões para acessar seus próprios recursos
 */

async function addClientUserPermissions() {
  try {
    logger.info('=== Adicionando permissões para client users ===\n');

    // 1. Buscar todos os client users
    const [clientUsers] = await sequelize.query(`
      SELECT id, email, role, client_id, organization_id
      FROM client_users
      WHERE is_active = true
      ORDER BY email;
    `);

    logger.info(`Encontrados ${clientUsers.length} client users ativos`);

    if (clientUsers.length === 0) {
      logger.info('Nenhum client user encontrado');
      process.exit(0);
    }

    // 2. Definir permissões básicas que client users precisam
    const basicPermissions = [
      // Leitura de recursos organizacionais
      { resource: 'client_users', action: 'read' },
      { resource: 'directions', action: 'read' },
      { resource: 'departments', action: 'read' },
      { resource: 'sections', action: 'read' },
      
      // Recursos próprios
      { resource: 'tickets', action: 'read' },
      { resource: 'tickets', action: 'create' },
      { resource: 'tickets', action: 'update' },
      
      { resource: 'knowledge', action: 'read' },
      
      { resource: 'inventory', action: 'read' },
      { resource: 'assets', action: 'read' },
      
      { resource: 'catalog', action: 'read' },
      { resource: 'service_requests', action: 'create' },
      { resource: 'service_requests', action: 'read' },
      
      { resource: 'todos', action: 'read' },
      { resource: 'todos', action: 'create' },
      { resource: 'todos', action: 'update' },
      { resource: 'todos', action: 'delete' }
    ];

    logger.info(`\nPermissões a serem adicionadas: ${basicPermissions.length}`);
    basicPermissions.forEach(p => {
      logger.info(`  - ${p.resource}.${p.action}`);
    });

    // 3. Criar permissões se não existirem
    logger.info('\n📝 Criando permissões no banco...');
    for (const perm of basicPermissions) {
      const [existing] = await sequelize.query(`
        SELECT id FROM permissions
        WHERE resource = :resource AND action = :action
        LIMIT 1;
      `, {
        replacements: { resource: perm.resource, action: perm.action }
      });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO permissions (resource, action, display_name, description, scope, category, is_system)
          VALUES (
            :resource,
            :action,
            :displayName,
            :description,
            'own',
            'client',
            false
          );
        `, {
          replacements: {
            resource: perm.resource,
            action: perm.action,
            displayName: `${perm.action.charAt(0).toUpperCase() + perm.action.slice(1)} ${perm.resource}`,
            description: `Permissão para ${perm.action} em ${perm.resource}`
          }
        });
        logger.info(`  ✅ Criada: ${perm.resource}.${perm.action}`);
      } else {
        logger.info(`  ⏭️  Já existe: ${perm.resource}.${perm.action}`);
      }
    }

    // 4. Adicionar permissões aos client users
    logger.info('\n👥 Adicionando permissões aos client users...');
    
    for (const user of clientUsers) {
      logger.info(`\n📧 ${user.email} (${user.role})`);
      
      // Buscar permissões atuais do usuário
      let currentPermissions = [];
      try {
        currentPermissions = user.permissions ? JSON.parse(user.permissions) : [];
      } catch (e) {
        currentPermissions = [];
      }

      // Adicionar novas permissões
      const newPermissions = [...currentPermissions];
      let addedCount = 0;

      for (const perm of basicPermissions) {
        const permString = `${perm.resource}.${perm.action}`;
        if (!newPermissions.includes(permString)) {
          newPermissions.push(permString);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        // Atualizar usuário
        await sequelize.query(`
          UPDATE client_users
          SET permissions = :permissions,
              updated_at = NOW()
          WHERE id = :userId;
        `, {
          replacements: {
            userId: user.id,
            permissions: JSON.stringify(newPermissions)
          }
        });

        logger.info(`  ✅ Adicionadas ${addedCount} novas permissões`);
        logger.info(`  📊 Total de permissões: ${newPermissions.length}`);
      } else {
        logger.info(`  ⏭️  Já possui todas as permissões`);
      }
    }

    // 5. Verificação final
    logger.info('\n\n📊 Verificação Final:');
    for (const user of clientUsers) {
      const [updated] = await sequelize.query(`
        SELECT email, role, permissions
        FROM client_users
        WHERE id = :userId;
      `, {
        replacements: { userId: user.id }
      });

      if (updated.length > 0) {
        let perms = [];
        try {
          perms = updated[0].permissions ? JSON.parse(updated[0].permissions) : [];
        } catch (e) {
          // Se for string simples, tentar como array
          perms = updated[0].permissions ? [updated[0].permissions] : [];
        }
        
        logger.info(`\n${updated[0].email}:`);
        logger.info(`  Role: ${updated[0].role}`);
        logger.info(`  Permissões: ${perms.length}`);
        
        // Verificar se tem as permissões básicas
        const hasBasic = basicPermissions.every(p => 
          perms.includes(`${p.resource}.${p.action}`)
        );
        logger.info(`  Tem permissões básicas: ${hasBasic ? '✅' : '❌'}`);
      }
    }

    logger.info('\n\n✅ Permissões adicionadas com sucesso!');
    logger.info('\n⚠️  IMPORTANTE: Os usuários precisam fazer LOGOUT e LOGIN novamente para carregar as novas permissões!');
    
    process.exit(0);

  } catch (error) {
    logger.error('❌ Erro ao adicionar permissões:', error);
    console.error(error);
    process.exit(1);
  }
}

addClientUserPermissions();
