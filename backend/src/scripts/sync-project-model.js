/**
 * Script para sincronizar o modelo Project com o banco de dados
 */

import Project from '../modules/projects/projectModel.js';
import { sequelize } from '../config/database.js';

async function syncProjectModel() {
  console.log('🔧 Sincronizando modelo Project\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Verificar estrutura da tabela
    console.log('1️⃣ Verificando estrutura da tabela projects...\n');
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);
    
    console.log('Colunas existentes:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar se client_id existe
    const hasClientId = columns.some(col => col.column_name === 'client_id');
    
    if (hasClientId) {
      console.log('\n✅ Coluna client_id existe na tabela projects');
    } else {
      console.log('\n❌ Coluna client_id NÃO existe na tabela projects');
      console.log('   Execute a migration: migrations/20260302000002-add-client-id-to-projects.sql');
    }
    
    // Testar query simples
    console.log('\n2️⃣ Testando query simples...\n');
    
    try {
      const testProject = await Project.findOne({
        attributes: ['id', 'organizationId', 'clientId', 'code', 'name', 'status'],
        limit: 1
      });
      
      if (testProject) {
        console.log('✅ Query executada com sucesso!');
        console.log('   Projeto encontrado:', {
          id: testProject.id,
          code: testProject.code,
          name: testProject.name,
          clientId: testProject.clientId
        });
      } else {
        console.log('⚠️  Nenhum projeto encontrado no banco de dados');
      }
    } catch (queryError) {
      console.log('❌ Erro ao executar query:');
      console.log('   ', queryError.message);
    }
    
    console.log('\n✅ Sincronização concluída!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

syncProjectModel();
