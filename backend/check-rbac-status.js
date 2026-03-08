import { sequelize } from './src/config/database.js';

async function checkRBACStatus() {
  try {
    console.log('🔍 Verificando status do RBAC...\n');
    
    // Check permissions
    const [permissions] = await sequelize.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`📝 Permissões: ${permissions[0].count}`);
    
    // Check roles
    const [roles] = await sequelize.query('SELECT COUNT(*) as count FROM roles WHERE "organizationId" IS NULL');
    console.log(`👥 Roles do sistema: ${roles[0].count}`);
    
    // Check role_permissions
    const [rolePerms] = await sequelize.query('SELECT COUNT(*) as count FROM role_permissions');
    console.log(`🔗 Associações role-permissão: ${rolePerms[0].count}`);
    
    // List roles
    const [rolesList] = await sequelize.query('SELECT name, "displayName", priority FROM roles WHERE "organizationId" IS NULL ORDER BY priority DESC');
    console.log('\n📋 Roles disponíveis:');
    rolesList.forEach(role => {
      console.log(`  - ${role.name} (${role.displayName}) - Prioridade: ${role.priority}`);
    });
    
    if (permissions[0].count === 0 || roles[0].count === 0) {
      console.log('\n❌ RBAC NÃO ESTÁ CONFIGURADO!');
      console.log('Execute: node src/scripts/seedRBACPermissions.js');
    } else {
      console.log('\n✅ RBAC está configurado!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkRBACStatus();
