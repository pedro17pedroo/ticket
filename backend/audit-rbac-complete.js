/**
 * AUDITORIA COMPLETA DO SISTEMA RBAC
 * 
 * Verifica:
 * 1. Estrutura do banco de dados (tabelas, colunas, constraints)
 * 2. Permissões cadastradas e sua distribuição por roles
 * 3. Consistência entre permissões e código
 * 4. Middlewares de permissão
 * 5. Rotas protegidas
 * 6. Frontend - hooks de permissão
 */

import { sequelize } from './src/config/database.js';
import fs from 'fs';
import path from 'path';

const REPORT_FILE = 'AUDITORIA-RBAC-COMPLETA.md';

let report = [];

function log(message, level = 'info') {
  const prefix = {
    'info': 'ℹ️',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌',
    'section': '📋'
  }[level] || 'ℹ️';
  
  const line = `${prefix} ${message}`;
  console.log(line);
  report.push(line);
}

function section(title) {
  const line = `\n${'='.repeat(80)}\n${title}\n${'='.repeat(80)}`;
  console.log(line);
  report.push(line);
}

async function auditDatabase() {
  section('1. AUDITORIA DO BANCO DE DADOS');
  
  try {
    // 1.1 Verificar tabelas RBAC
    log('\n1.1 Verificando tabelas RBAC...', 'section');
    
    const tables = ['roles', 'permissions', 'role_permissions', 'user_permissions'];
    
    for (const table of tables) {
      const [result] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        );
      `);
      
      if (result[0].exists) {
        log(`Tabela ${table} existe`, 'success');
        
        // Contar registros
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        log(`  └─ ${count[0].count} registros`);
      } else {
        log(`Tabela ${table} NÃO existe`, 'error');
      }
    }
    
    // 1.2 Verificar estrutura da tabela permissions
    log('\n1.2 Estrutura da tabela permissions...', 'section');
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'permissions'
      ORDER BY ordinal_position;
    `);
    
    const requiredColumns = ['id', 'resource', 'action', 'display_name', 'description', 'applicable_to'];
    
    for (const col of requiredColumns) {
      const exists = columns.find(c => c.column_name === col);
      if (exists) {
        log(`Coluna ${col} existe (${exists.data_type})`, 'success');
      } else {
        log(`Coluna ${col} NÃO existe`, 'error');
      }
    }
    
    // 1.3 Verificar constraints
    log('\n1.3 Verificando constraints...', 'section');
    
    const [constraints] = await sequelize.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name IN ('roles', 'permissions', 'role_permissions')
      ORDER BY table_name, constraint_type;
    `);
    
    log(`Total de constraints: ${constraints.length}`);
    
    const fkCount = constraints.filter(c => c.constraint_type === 'FOREIGN KEY').length;
    const pkCount = constraints.filter(c => c.constraint_type === 'PRIMARY KEY').length;
    const uniqueCount = constraints.filter(c => c.constraint_type === 'UNIQUE').length;
    
    log(`  ├─ Primary Keys: ${pkCount}`);
    log(`  ├─ Foreign Keys: ${fkCount}`);
    log(`  └─ Unique Constraints: ${uniqueCount}`);
    
  } catch (error) {
    log(`Erro na auditoria do banco: ${error.message}`, 'error');
  }
}

async function auditPermissions() {
  section('2. AUDITORIA DE PERMISSÕES');
  
  try {
    // 2.1 Listar todos os recursos
    log('\n2.1 Recursos cadastrados...', 'section');
    
    const [resources] = await sequelize.query(`
      SELECT DISTINCT resource, COUNT(*) as permission_count
      FROM permissions
      GROUP BY resource
      ORDER BY resource;
    `);
    
    log(`Total de recursos: ${resources.length}`);
    
    for (const res of resources) {
      log(`  ├─ ${res.resource}: ${res.permission_count} permissões`);
    }
    
    // 2.2 Listar todas as ações
    log('\n2.2 Ações por recurso...', 'section');
    
    const [actions] = await sequelize.query(`
      SELECT resource, action, display_name, description
      FROM permissions
      ORDER BY resource, action;
    `);
    
    const groupedActions = {};
    for (const action of actions) {
      if (!groupedActions[action.resource]) {
        groupedActions[action.resource] = [];
      }
      groupedActions[action.resource].push(action);
    }
    
    for (const [resource, acts] of Object.entries(groupedActions)) {
      log(`\n${resource}:`);
      for (const act of acts) {
        log(`  ├─ ${act.action}: ${act.display_name || act.description}`);
      }
    }
    
    // 2.3 Verificar permissões sem display_name
    log('\n2.3 Verificando integridade...', 'section');
    
    const [missingDisplayName] = await sequelize.query(`
      SELECT resource, action
      FROM permissions
      WHERE display_name IS NULL OR display_name = '';
    `);
    
    if (missingDisplayName.length > 0) {
      log(`Permissões sem display_name: ${missingDisplayName.length}`, 'warning');
      for (const perm of missingDisplayName) {
        log(`  ├─ ${perm.resource}.${perm.action}`);
      }
    } else {
      log('Todas as permissões têm display_name', 'success');
    }
    
    // 2.4 Verificar applicable_to
    const [invalidApplicableTo] = await sequelize.query(`
      SELECT resource, action, applicable_to
      FROM permissions
      WHERE applicable_to IS NULL 
         OR NOT (applicable_to ?| array['system', 'organization', 'client']);
    `);
    
    if (invalidApplicableTo.length > 0) {
      log(`Permissões com applicable_to inválido: ${invalidApplicableTo.length}`, 'warning');
    } else {
      log('Todas as permissões têm applicable_to válido', 'success');
    }
    
  } catch (error) {
    log(`Erro na auditoria de permissões: ${error.message}`, 'error');
  }
}

async function auditRoles() {
  section('3. AUDITORIA DE ROLES');
  
  try {
    // 3.1 Listar todos os roles
    log('\n3.1 Roles cadastrados...', 'section');
    
    const [roles] = await sequelize.query(`
      SELECT id, name, level, display_name, description
      FROM roles
      ORDER BY level, name;
    `);
    
    log(`Total de roles: ${roles.length}`);
    
    for (const role of roles) {
      log(`\n${role.name} (${role.level}):`);
      log(`  ├─ Display: ${role.display_name || 'N/A'}`);
      log(`  └─ Descrição: ${role.description || 'N/A'}`);
      
      // Contar permissões do role
      const [permCount] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM role_permissions
        WHERE role_id = '${role.id}';
      `);
      
      log(`  └─ Permissões: ${permCount[0].count}`);
    }
    
    // 3.2 Distribuição de permissões por role
    log('\n3.2 Distribuição de permissões...', 'section');
    
    const [distribution] = await sequelize.query(`
      SELECT 
        r.name as role_name,
        r.level,
        COUNT(rp.id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.level
      ORDER BY permission_count DESC;
    `);
    
    for (const dist of distribution) {
      log(`${dist.role_name} (${dist.level}): ${dist.permission_count} permissões`);
    }
    
    // 3.3 Verificar roles sem permissões
    const rolesWithoutPerms = distribution.filter(d => d.permission_count === 0);
    
    if (rolesWithoutPerms.length > 0) {
      log(`\nRoles sem permissões: ${rolesWithoutPerms.length}`, 'warning');
      for (const role of rolesWithoutPerms) {
        log(`  ├─ ${role.role_name}`);
      }
    } else {
      log('\nTodos os roles têm permissões', 'success');
    }
    
    // 3.4 Permissões críticas por role
    log('\n3.4 Permissões críticas...', 'section');
    
    const criticalPermissions = [
      'tickets.assign_self',
      'tickets.assign_team',
      'tickets.assign_all',
      'users.read',
      'users.create',
      'users.update',
      'users.delete'
    ];
    
    for (const perm of criticalPermissions) {
      const [resource, action] = perm.split('.');
      
      const [rolesWithPerm] = await sequelize.query(`
        SELECT r.name
        FROM roles r
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE p.resource = '${resource}' AND p.action = '${action}'
        ORDER BY r.name;
      `);
      
      if (rolesWithPerm.length > 0) {
        log(`${perm}: ${rolesWithPerm.map(r => r.name).join(', ')}`);
      } else {
        log(`${perm}: NENHUM ROLE`, 'warning');
      }
    }
    
  } catch (error) {
    log(`Erro na auditoria de roles: ${error.message}`, 'error');
  }
}

async function auditBackendRoutes() {
  section('4. AUDITORIA DE ROTAS DO BACKEND');
  
  try {
    log('\n4.1 Analisando arquivo de rotas...', 'section');
    
    const routesFile = './src/routes/index.js';
    
    if (!fs.existsSync(routesFile)) {
      log('Arquivo de rotas não encontrado', 'error');
      return;
    }
    
    const content = fs.readFileSync(routesFile, 'utf-8');
    
    // Contar uso de middlewares de permissão
    const requirePermissionCount = (content.match(/requirePermission/g) || []).length;
    const requireSmartPermissionCount = (content.match(/requireSmartPermission/g) || []).length;
    const requireAnyPermissionCount = (content.match(/requireAnyPermission/g) || []).length;
    const authorizeCount = (content.match(/authorize\(/g) || []).length;
    
    log(`requirePermission: ${requirePermissionCount} usos`);
    log(`requireSmartPermission: ${requireSmartPermissionCount} usos`);
    log(`requireAnyPermission: ${requireAnyPermissionCount} usos`);
    log(`authorize (role-based): ${authorizeCount} usos`, authorizeCount > 0 ? 'warning' : 'success');
    
    if (authorizeCount > 0) {
      log('\n⚠️  ATENÇÃO: Encontrado uso de authorize() (verificação por role)', 'warning');
      log('   Recomendação: Migrar para requirePermission() quando possível');
    }
    
    // Extrair rotas protegidas
    log('\n4.2 Rotas protegidas por permissão...', 'section');
    
    const permissionRoutes = content.match(/router\.(get|post|put|patch|delete)\([^)]+requirePermission\([^)]+\)/g) || [];
    
    log(`Total de rotas com requirePermission: ${permissionRoutes.length}`);
    
    // Extrair recursos usados
    const resourceMatches = content.match(/requirePermission\('([^']+)',\s*'([^']+)'/g) || [];
    const resources = new Set();
    
    for (const match of resourceMatches) {
      const [, resource] = match.match(/requirePermission\('([^']+)'/);
      resources.add(resource);
    }
    
    log(`\nRecursos protegidos: ${resources.size}`);
    for (const resource of Array.from(resources).sort()) {
      log(`  ├─ ${resource}`);
    }
    
  } catch (error) {
    log(`Erro na auditoria de rotas: ${error.message}`, 'error');
  }
}

async function auditFrontendPermissions() {
  section('5. AUDITORIA DE PERMISSÕES NO FRONTEND');
  
  try {
    const frontends = [
      { name: 'Portal Organização', path: './portalOrganizaçãoTenant' },
      { name: 'Portal Cliente', path: './portalClientEmpresa' },
      { name: 'Portal Backoffice', path: './portalBackofficeSis' },
      { name: 'Portal SaaS', path: './portalSaaS' }
    ];
    
    for (const frontend of frontends) {
      log(`\n5.${frontends.indexOf(frontend) + 1} ${frontend.name}...`, 'section');
      
      if (!fs.existsSync(frontend.path)) {
        log(`Diretório não encontrado: ${frontend.path}`, 'warning');
        continue;
      }
      
      // Verificar hook usePermissions
      const hookPath = path.join(frontend.path, 'src/hooks/usePermissions.js');
      
      if (fs.existsSync(hookPath)) {
        log('Hook usePermissions.js encontrado', 'success');
        
        const hookContent = fs.readFileSync(hookPath, 'utf-8');
        
        // Verificar se usa fallback hardcoded
        if (hookContent.includes('fallbackPermissions') || hookContent.includes('FALLBACK')) {
          log('  ⚠️  Hook usa fallback hardcoded de permissões', 'warning');
        }
        
        // Verificar se busca permissões do backend
        if (hookContent.includes('/auth/profile') || hookContent.includes('user.permissions')) {
          log('  ✅ Hook busca permissões do backend', 'success');
        }
        
      } else {
        log('Hook usePermissions.js NÃO encontrado', 'error');
      }
      
      // Verificar componentes que usam permissões
      const srcPath = path.join(frontend.path, 'src');
      
      if (fs.existsSync(srcPath)) {
        let filesWithPermissions = 0;
        let filesWithHardcodedRoles = 0;
        
        function scanDirectory(dir) {
          const files = fs.readdirSync(dir);
          
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !file.includes('node_modules')) {
              scanDirectory(filePath);
            } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
              const content = fs.readFileSync(filePath, 'utf-8');
              
              if (content.includes('usePermissions') || content.includes('hasPermission')) {
                filesWithPermissions++;
              }
              
              if (content.match(/user\.role\s*===|role\s*===\s*['"]/) && 
                  !filePath.includes('usePermissions')) {
                filesWithHardcodedRoles++;
              }
            }
          }
        }
        
        scanDirectory(srcPath);
        
        log(`  ├─ Arquivos usando usePermissions: ${filesWithPermissions}`);
        
        if (filesWithHardcodedRoles > 0) {
          log(`  └─ Arquivos com verificação hardcoded de role: ${filesWithHardcodedRoles}`, 'warning');
        } else {
          log(`  └─ Nenhum arquivo com verificação hardcoded de role`, 'success');
        }
      }
    }
    
  } catch (error) {
    log(`Erro na auditoria de frontend: ${error.message}`, 'error');
  }
}

async function auditMiddlewares() {
  section('6. AUDITORIA DE MIDDLEWARES');
  
  try {
    log('\n6.1 Verificando middlewares de permissão...', 'section');
    
    const middlewares = [
      { name: 'permission.js', path: './src/middleware/permission.js' },
      { name: 'smartPermission.js', path: './src/middleware/smartPermission.js' },
      { name: 'validateHierarchy.js', path: './src/middleware/validateHierarchy.js' }
    ];
    
    for (const middleware of middlewares) {
      if (fs.existsSync(middleware.path)) {
        log(`${middleware.name} encontrado`, 'success');
        
        const content = fs.readFileSync(middleware.path, 'utf-8');
        
        // Verificar se usa permissionService
        if (content.includes('permissionService')) {
          log(`  ✅ Usa permissionService`, 'success');
        } else {
          log(`  ⚠️  NÃO usa permissionService`, 'warning');
        }
        
        // Verificar se tem verificação hardcoded de roles
        if (content.match(/user\.role\s*===|role\s*===\s*['"]/)) {
          log(`  ⚠️  Contém verificação hardcoded de roles`, 'warning');
        } else {
          log(`  ✅ Não contém verificação hardcoded de roles`, 'success');
        }
        
      } else {
        log(`${middleware.name} NÃO encontrado`, 'error');
      }
    }
    
  } catch (error) {
    log(`Erro na auditoria de middlewares: ${error.message}`, 'error');
  }
}

async function generateRecommendations() {
  section('7. RECOMENDAÇÕES');
  
  log('\n7.1 Melhorias sugeridas...', 'section');
  
  try {
    // Verificar roles sem permissões
    const [rolesWithoutPerms] = await sequelize.query(`
      SELECT r.name, r.level
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      WHERE rp.id IS NULL;
    `);
    
    if (rolesWithoutPerms.length > 0) {
      log('\n📌 Roles sem permissões:', 'warning');
      for (const role of rolesWithoutPerms) {
        log(`   • ${role.name} (${role.level})`);
      }
      log('   Ação: Adicionar permissões ou remover roles não utilizados');
    }
    
    // Verificar permissões não utilizadas
    const [unusedPerms] = await sequelize.query(`
      SELECT p.resource, p.action
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.id IS NULL;
    `);
    
    if (unusedPerms.length > 0) {
      log('\n📌 Permissões não atribuídas a nenhum role:', 'warning');
      for (const perm of unusedPerms) {
        log(`   • ${perm.resource}.${perm.action}`);
      }
      log('   Ação: Atribuir a roles ou remover se não forem necessárias');
    }
    
    log('\n7.2 Checklist de segurança...', 'section');
    
    const checklist = [
      'Todas as rotas críticas estão protegidas por middlewares de permissão',
      'Frontend verifica permissões antes de renderizar componentes',
      'Não há verificações hardcoded de roles no código',
      'Permissões são carregadas do backend, não hardcoded no frontend',
      'Logs de auditoria estão habilitados para ações sensíveis',
      'Permissões são verificadas no backend, não apenas no frontend'
    ];
    
    for (const item of checklist) {
      log(`☐ ${item}`);
    }
    
  } catch (error) {
    log(`Erro ao gerar recomendações: ${error.message}`, 'error');
  }
}

async function runAudit() {
  console.log('\n🔍 INICIANDO AUDITORIA COMPLETA DO SISTEMA RBAC\n');
  
  try {
    await sequelize.authenticate();
    log('Conexão com banco de dados estabelecida', 'success');
    
    await auditDatabase();
    await auditPermissions();
    await auditRoles();
    await auditBackendRoutes();
    await auditFrontendPermissions();
    await auditMiddlewares();
    await generateRecommendations();
    
    section('AUDITORIA CONCLUÍDA');
    
    // Salvar relatório
    const reportContent = `# Auditoria Completa do Sistema RBAC

Data: ${new Date().toLocaleString('pt-BR')}

${report.join('\n')}

---

## Próximos Passos

1. Revisar warnings e errors identificados
2. Implementar recomendações de segurança
3. Atualizar documentação conforme necessário
4. Executar testes de permissões
5. Validar com usuários reais

## Comandos Úteis

\`\`\`bash
# Executar auditoria novamente
node backend/audit-rbac-complete.js

# Ver permissões de um role específico
psql -U postgres -d tatuticket -c "SELECT p.resource, p.action FROM role_permissions rp JOIN roles r ON rp.role_id = r.id JOIN permissions p ON rp.permission_id = p.id WHERE r.name = 'agent';"

# Ver roles de um usuário
psql -U postgres -d tatuticket -c "SELECT role FROM organization_users WHERE email = 'user@example.com';"
\`\`\`
`;
    
    fs.writeFileSync(REPORT_FILE, reportContent);
    log(`\nRelatório salvo em: ${REPORT_FILE}`, 'success');
    
  } catch (error) {
    log(`Erro fatal na auditoria: ${error.message}`, 'error');
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Executar auditoria
runAudit();
