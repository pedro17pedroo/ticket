import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function completeTable() {
  try {
    console.log('🔧 Completando tabela organizations...\n');

    // Adicionar colunas que faltam
    const columns = [
      { name: 'trade_name', type: 'VARCHAR(255)', comment: 'Nome fantasia' },
      { name: 'tax_id', type: 'VARCHAR(50)', comment: 'NIF/CNPJ' },
      { name: 'logo', type: 'VARCHAR(255)', comment: 'URL do logo' },
      { name: 'primary_color', type: 'VARCHAR(50) DEFAULT \'#3B82F6\'', comment: 'Cor primária' },
      { name: 'secondary_color', type: 'VARCHAR(50) DEFAULT \'#10B981\'', comment: 'Cor secundária' },
      { name: 'email', type: 'VARCHAR(255)', comment: 'Email de contato' },
      { name: 'phone', type: 'VARCHAR(50)', comment: 'Telefone' },
      { name: 'address', type: 'TEXT', comment: 'Endereço' },
      { name: 'subscription', type: 'JSONB DEFAULT \'{}\'::jsonb', comment: 'Dados de assinatura' },
      { name: 'deployment', type: 'JSONB DEFAULT \'{}\'::jsonb', comment: 'Config deployment' },
      { name: 'settings', type: 'JSONB DEFAULT \'{}\'::jsonb', comment: 'Configurações' },
      { name: 'suspended_at', type: 'TIMESTAMP', comment: 'Data suspensão' },
      { name: 'suspended_reason', type: 'TEXT', comment: 'Motivo suspensão' }
    ];

    for (const col of columns) {
      try {
        await sequelize.query(`
          ALTER TABLE organizations 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
        `);
        console.log(`✅ Coluna ${col.name} adicionada`);

        if (col.comment) {
          await sequelize.query(`
            COMMENT ON COLUMN organizations.${col.name} IS '${col.comment}';
          `);
        }
      } catch (error) {
        console.log(`⚠️  Coluna ${col.name}: ${error.message}`);
      }
    }

    console.log('\n🎉 Tabela organizations completa!');

    // Verificar resultado
    const [cols] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organizations'
      ORDER BY ordinal_position;
    `);

    console.log(`\n📋 Total de colunas: ${cols.length}`);
    cols.forEach(c => console.log(`   - ${c.column_name}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

completeTable();
