import { sequelize } from '../config/database.js';

/**
 * Migração: Adicionar organizationId aos comentários existentes
 * 
 * Este script preenche o campo organizationId dos comentários
 * com base na organização do ticket relacionado
 */

export const updateCommentsOrganization = async () => {
  try {
    console.log('🔄 Iniciando migração de organizationId em comments...');

    // Atualizar comentários existentes com organizationId do ticket
    const [results] = await sequelize.query(`
      UPDATE comments 
      SET organization_id = tickets.organization_id
      FROM tickets
      WHERE comments.ticket_id = tickets.id
      AND comments.organization_id IS NULL
    `);

    console.log(`✅ ${results.rowCount || 0} comentários atualizados com organization_id`);

    // Verificar se ainda existem comentários sem organizationId
    const [remaining] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM comments 
      WHERE organization_id IS NULL
    `);

    if (remaining[0].count > 0) {
      console.log(`⚠️  Ainda existem ${remaining[0].count} comentários sem organization_id`);
      console.log('   Estes podem ser comentários órfãos que devem ser investigados.');
    } else {
      console.log('✅ Todos os comentários têm organization_id!');
    }

    return true;
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    return false;
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updateCommentsOrganization()
    .then(() => {
      console.log('✅ Migração concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}
