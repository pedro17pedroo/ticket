import { sequelize } from '../config/database.js';

async function fixCatalogItems() {
  console.log('🔄 Corrigindo catalog_items sem direção...\n');

  try {
    // 1. Verificar quantos items não têm direção
    const [nullItems] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM catalog_items 
      WHERE default_direction_id IS NULL
    `);
    console.log(`📊 Items sem direção: ${nullItems[0].count}\n`);

    if (nullItems[0].count === 0) {
      console.log('✅ Todos os items já têm direção definida!');
      return;
    }

    // 2. Buscar primeira direção disponível
    const [directions] = await sequelize.query(`
      SELECT id, name FROM directions LIMIT 1
    `);

    if (directions.length === 0) {
      console.error('❌ Erro: Não há nenhuma direção cadastrada!');
      console.log('\n💡 Crie pelo menos uma direção antes de executar esta migração.');
      return;
    }

    const defaultDirection = directions[0];
    console.log(`🎯 Usando direção padrão: "${defaultDirection.name}" (${defaultDirection.id})\n`);

    // 3. Atualizar items sem direção
    const [result] = await sequelize.query(`
      UPDATE catalog_items 
      SET default_direction_id = :directionId
      WHERE default_direction_id IS NULL
      RETURNING id, name
    `, {
      replacements: { directionId: defaultDirection.id }
    });

    console.log(`✅ ${result.length} items atualizados:\n`);
    result.forEach(item => {
      console.log(`   - ${item.name} (${item.id})`);
    });

    console.log('\n✅ Correção concluída! Agora você pode executar a migration.');

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

fixCatalogItems();
