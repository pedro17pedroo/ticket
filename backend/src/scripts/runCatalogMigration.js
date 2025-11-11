import { QueryInterface, Sequelize } from 'sequelize';
import { sequelize } from '../config/database.js';

async function runMigration() {
  console.log('🔄 Executando migration de roteamento do catálogo...\n');

  try {
    const queryInterface = sequelize.getQueryInterface();

    // Tornar APENAS direção obrigatória
    console.log('1️⃣  Tornando default_direction_id obrigatório...');
    await queryInterface.changeColumn('catalog_items', 'default_direction_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'directions',
        key: 'id'
      }
    });
    console.log('   ✅ default_direction_id agora é obrigatório\n');

    // Departamento e Secção permanecem opcionais
    console.log('2️⃣  Garantindo que default_department_id seja opcional...');
    await queryInterface.changeColumn('catalog_items', 'default_department_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    });
    console.log('   ✅ default_department_id é opcional\n');

    console.log('3️⃣  Garantindo que default_section_id seja opcional...');
    await queryInterface.changeColumn('catalog_items', 'default_section_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'sections',
        key: 'id'
      }
    });
    console.log('   ✅ default_section_id é opcional\n');

    console.log('✅ Migration executada com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   - Direção: OBRIGATÓRIO');
    console.log('   - Departamento: OPCIONAL');
    console.log('   - Secção: OPCIONAL\n');

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runMigration();
