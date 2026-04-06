import { sequelize } from '../config/database.js';
import ClientUser from '../models/ClientUser.js';
import logger from '../config/logger.js';

/**
 * Script para atualizar roles dos usuários de clientes
 * Mapeia roles antigos para os novos roles RBAC
 */

const ROLE_MAPPING = {
  'admin': 'client-admin',
  'user': 'client-user',
  'client-admin': 'client-admin', // já está correto
  'client-user': 'client-user',   // já está correto
  // Adicione outros mapeamentos conforme necessário
};

async function updateClientUsersRoles() {
  try {
    logger.info('🔄 Atualizando roles dos usuários de clientes...');
    
    // Buscar todos os usuários de clientes
    const clientUsers = await ClientUser.findAll({
      where: { isActive: true }
    });
    
    logger.info(`📊 Encontrados ${clientUsers.length} usuários de clientes ativos`);
    
    let updatedCount = 0;
    let alreadyCorrectCount = 0;
    
    for (const user of clientUsers) {
      const currentRole = user.role;
      const newRole = ROLE_MAPPING[currentRole] || 'client-user'; // default para client-user
      
      if (currentRole !== newRole) {
        await user.update({ role: newRole });
        logger.info(`  ✅ Atualizado: ${user.email} (${currentRole} → ${newRole})`);
        updatedCount++;
      } else {
        logger.info(`  ⏭️  Já correto: ${user.email} (${currentRole})`);
        alreadyCorrectCount++;
      }
    }
    
    logger.info('');
    logger.info('✅ Atualização concluída!');
    logger.info('');
    logger.info('📊 Resumo:');
    logger.info(`  - Total de usuários: ${clientUsers.length}`);
    logger.info(`  - Atualizados: ${updatedCount}`);
    logger.info(`  - Já corretos: ${alreadyCorrectCount}`);
    logger.info('');
    logger.info('🎯 Próximos passos:');
    logger.info('  1. Reiniciar o backend');
    logger.info('  2. Fazer logout e login novamente no Portal Cliente');
    logger.info('  3. Verificar que as permissões estão carregadas');
    
  } catch (error) {
    logger.error('❌ Erro ao atualizar roles:', error);
    throw error;
  }
}

// Executar atualização
updateClientUsersRoles()
  .then(() => {
    logger.info('✅ Script concluído');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Erro fatal:', error);
    process.exit(1);
  });
