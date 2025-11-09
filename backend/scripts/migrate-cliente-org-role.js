import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateRoles() {
  try {
    console.log('🔧 Migrando roles antigos...\n');

    // Verificar quantos users têm role cliente-org
    const [clienteOrgUsers] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'cliente-org';
    `);
    console.log(`📊 Encontrados ${clienteOrgUsers[0].count} usuários com role 'cliente-org'`);

    if (clienteOrgUsers[0].count > 0) {
      console.log('⚠️  ATENÇÃO: Estes usuários serão marcados como INATIVO.');
      console.log('   Na nova arquitetura, eles devem ser recriados como Client Users.');
      
      // Marcar como inativo (não deletar)
      await sequelize.query(`
        UPDATE users 
        SET is_active = false
        WHERE role = 'cliente-org';
      `);
      console.log('✅ Usuários cliente-org marcados como inativos');
    }

    // Verificar roles atuais
    const [roles] = await sequelize.query(`
      SELECT DISTINCT role, COUNT(*) as count 
      FROM users 
      WHERE is_active = true
      GROUP BY role 
      ORDER BY role;
    `);

    console.log('\n📋 Roles ativos na tabela users:');
    roles.forEach(r => console.log(`   - ${r.role}: ${r.count} usuários`));

    console.log('\n✅ Migração de roles concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Criar registros na tabela clients para as empresas');
    console.log('   2. Criar registros na tabela client_users para os usuários');
    console.log('   3. Executar seed multi-tenant com dados de exemplo');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

migrateRoles();
