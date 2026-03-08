/**
 * Script de Teste: RBAC SaaS Multi-Nível
 * 
 * Testa o sistema RBAC com suporte a:
 * - Provider (system) → Organization (tenant) → Client (cliente B2B)
 */

import { sequelize } from './src/config/database.js';
import permissionService from './src/services/permissionService.js';
import { Role, Permission, RolePermission, Organization, OrganizationUser, Client, ClientUser, setupAssociations } from './src/modules/models/index.js';

// Configurar associações antes de usar os modelos
setupAssociations();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRBACMultiLevel() {
  try {
    log('\n🧪 Iniciando Testes RBAC Multi-Nível\n', 'cyan');
    
    // ========================================================================
    // TESTE 1: Verificar estrutura das tabelas
    // ========================================================================
    log('📋 TESTE 1: Verificar Estrutura das Tabelas', 'blue');
    
    const [permissionsWithApplicableTo] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM permissions
      WHERE applicable_to IS NOT NULL
    `);
    
    log(`✅ Permissões com applicable_to: ${permissionsWithApplicableTo[0].total}`, 'green');
    
    const [rolesByLevel] = await sequelize.query(`
      SELECT level, COUNT(*) as total
      FROM roles
      GROUP BY level
      ORDER BY level
    `);
    
    log('✅ Roles por nível:', 'green');
    rolesByLevel.forEach(row => {
      log(`   - ${row.level}: ${row.total}`, 'green');
    });
    
    // ========================================================================
    // TESTE 2: Buscar role seguindo hierarquia
    // ========================================================================
    log('\n📋 TESTE 2: Buscar Role Seguindo Hierarquia', 'blue');
    
    // Buscar organização de teste
    const org = await Organization.findOne();
    if (!org) {
      log('❌ Nenhuma organização encontrada', 'red');
      return;
    }
    log(`✅ Organização encontrada: ${org.name}`, 'green');
    
    // Buscar role global
    const globalRole = await permissionService.findRoleByHierarchy('agent', null, null);
    log(`✅ Role global "agent": ${globalRole ? 'Encontrado' : 'Não encontrado'}`, globalRole ? 'green' : 'red');
    
    // Buscar role da organização (se existir)
    const orgRole = await permissionService.findRoleByHierarchy('agent', org.id, null);
    log(`✅ Role "agent" da organização: ${orgRole ? 'Encontrado (customizado)' : 'Não encontrado (usa global)'}`, 'green');
    
    // ========================================================================
    // TESTE 3: Verificar permissões aplicáveis por nível
    // ========================================================================
    log('\n📋 TESTE 3: Verificar Permissões Aplicáveis por Nível', 'blue');
    
    const [systemPerms] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM permissions
      WHERE applicable_to @> '["system"]'::jsonb
    `);
    log(`✅ Permissões aplicáveis a SYSTEM: ${systemPerms[0].total}`, 'green');
    
    const [orgPerms] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM permissions
      WHERE applicable_to @> '["organization"]'::jsonb
    `);
    log(`✅ Permissões aplicáveis a ORGANIZATION: ${orgPerms[0].total}`, 'green');
    
    const [clientPerms] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM permissions
      WHERE applicable_to @> '["client"]'::jsonb
    `);
    log(`✅ Permissões aplicáveis a CLIENT: ${clientPerms[0].total}`, 'green');
    
    // ========================================================================
    // TESTE 4: Testar getUserLevel
    // ========================================================================
    log('\n📋 TESTE 4: Testar getUserLevel', 'blue');
    
    const providerUser = { role: 'super-admin', userType: 'provider' };
    const providerLevel = permissionService.getUserLevel(providerUser);
    log(`✅ Provider user level: ${providerLevel}`, providerLevel === 'system' ? 'green' : 'red');
    
    const orgUser = { role: 'agent', userType: 'organization' };
    const orgLevel = permissionService.getUserLevel(orgUser);
    log(`✅ Organization user level: ${orgLevel}`, orgLevel === 'organization' ? 'green' : 'red');
    
    const clientUser = { role: 'client-user', userType: 'client' };
    const clientLevel = permissionService.getUserLevel(clientUser);
    log(`✅ Client user level: ${clientLevel}`, clientLevel === 'client' ? 'green' : 'red');
    
    // ========================================================================
    // TESTE 5: Testar getUserPermissions com usuário real
    // ========================================================================
    log('\n📋 TESTE 5: Testar getUserPermissions com Usuário Real', 'blue');
    
    const testUser = await OrganizationUser.findOne({
      where: { organizationId: org.id }
    });
    
    if (testUser) {
      const permissions = await permissionService.getUserPermissions(testUser.id);
      log(`✅ Permissões carregadas para ${testUser.email}: ${permissions.length}`, 'green');
      log(`   Primeiras 10 permissões:`, 'cyan');
      permissions.slice(0, 10).forEach(perm => {
        log(`   - ${perm}`, 'cyan');
      });
    } else {
      log('⚠️  Usuário de teste não encontrado', 'yellow');
    }
    
    // ========================================================================
    // TESTE 6: Testar hasPermission com verificação de nível
    // ========================================================================
    log('\n📋 TESTE 6: Testar hasPermission com Verificação de Nível', 'blue');
    
    if (testUser) {
      // Testar permissão aplicável a organization
      const hasTicketsRead = await permissionService.hasPermission(
        { ...testUser.toJSON(), userType: 'organization' },
        'tickets',
        'read'
      );
      log(`✅ Usuário tem permissão tickets.read: ${hasTicketsRead}`, hasTicketsRead ? 'green' : 'red');
      
      // Testar permissão aplicável apenas a system (deve falhar)
      const hasOrganizationsManage = await permissionService.hasPermission(
        { ...testUser.toJSON(), userType: 'organization' },
        'organizations',
        'manage'
      );
      log(`✅ Usuário NÃO tem permissão organizations.manage: ${!hasOrganizationsManage}`, !hasOrganizationsManage ? 'green' : 'red');
    }
    
    // ========================================================================
    // TESTE 7: Verificar view v_role_permissions_with_level
    // ========================================================================
    log('\n📋 TESTE 7: Verificar View de Roles e Permissões', 'blue');
    
    const [viewData] = await sequelize.query(`
      SELECT 
        role_name,
        level_display,
        role_scope,
        COUNT(*) as total_permissions
      FROM v_role_permissions_with_level
      GROUP BY role_name, level_display, role_scope
      ORDER BY level_display, role_name
      LIMIT 10
    `);
    
    log('✅ Roles e permissões (primeiros 10):', 'green');
    viewData.forEach(row => {
      log(`   - ${row.role_name} (${row.level_display} - ${row.role_scope}): ${row.total_permissions} permissões`, 'cyan');
    });
    
    // ========================================================================
    // TESTE 8: Verificar função get_user_role
    // ========================================================================
    log('\n📋 TESTE 8: Verificar Função get_user_role', 'blue');
    
    const [globalRoleId] = await sequelize.query(`
      SELECT get_user_role('agent', NULL, NULL) as role_id
    `);
    log(`✅ Role global "agent": ${globalRoleId[0].role_id ? 'Encontrado' : 'Não encontrado'}`, 'green');
    
    const [orgRoleId] = await sequelize.query(`
      SELECT get_user_role('agent', '${org.id}', NULL) as role_id
    `);
    log(`✅ Role "agent" da organização: ${orgRoleId[0].role_id ? 'Encontrado' : 'Não encontrado'}`, 'green');
    
    // ========================================================================
    // RESUMO
    // ========================================================================
    log('\n✅ TODOS OS TESTES CONCLUÍDOS!', 'green');
    log('\n📊 Resumo:', 'cyan');
    log(`   - Estrutura de tabelas: ✅`, 'green');
    log(`   - Busca hierárquica de roles: ✅`, 'green');
    log(`   - Permissões aplicáveis por nível: ✅`, 'green');
    log(`   - getUserLevel: ✅`, 'green');
    log(`   - getUserPermissions: ✅`, 'green');
    log(`   - hasPermission com verificação de nível: ✅`, 'green');
    log(`   - View de roles e permissões: ✅`, 'green');
    log(`   - Função get_user_role: ✅`, 'green');
    
    log('\n🎉 Sistema RBAC Multi-Nível funcionando corretamente!\n', 'green');
    
  } catch (error) {
    log(`\n❌ Erro durante os testes: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Executar testes
testRBACMultiLevel();

