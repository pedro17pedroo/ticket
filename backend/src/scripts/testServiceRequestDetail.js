import { sequelize } from '../config/database.js';

async function testServiceRequestDetail() {
  console.log('🔍 Testando detalhes de service request...\n');

  try {
    // Buscar uma solicitação de teste
    const [requests] = await sequelize.query(`
      SELECT 
        sr.id,
        sr.status,
        sr.created_at,
        sr.organization_id,
        sr.catalog_item_id,
        sr.user_id,
        ci.name as item_name,
        u.name as user_name,
        u.email as user_email
      FROM service_requests sr
      LEFT JOIN catalog_items ci ON sr.catalog_item_id = ci.id
      LEFT JOIN users u ON sr.user_id = u.id
      LIMIT 1
    `);

    if (requests.length === 0) {
      console.log('❌ Nenhuma service request encontrada no banco de dados.\n');
      return;
    }

    const request = requests[0];
    console.log('📋 Service Request encontrada:');
    console.log(`   ID: ${request.id}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Item: ${request.item_name || 'N/A'}`);
    console.log(`   Usuário: ${request.user_name || 'N/A'} (${request.user_email || 'N/A'})`);
    console.log(`   Organization ID: ${request.organization_id}`);
    console.log(`   User ID: ${request.user_id}`);
    console.log(`   Catalog Item ID: ${request.catalog_item_id}`);
    console.log('');

    // Verificar se todos os relacionamentos existem
    const issues = [];
    
    if (!request.catalog_item_id) {
      issues.push('⚠️  catalog_item_id é NULL');
    }
    
    if (!request.user_id) {
      issues.push('⚠️  user_id é NULL');
    }
    
    if (!request.organization_id) {
      issues.push('⚠️  organization_id é NULL');
    }

    if (!request.item_name) {
      issues.push('⚠️  Item do catálogo não encontrado (relacionamento quebrado)');
    }

    if (!request.user_name) {
      issues.push('⚠️  Usuário não encontrado (relacionamento quebrado)');
    }

    if (issues.length > 0) {
      console.log('❌ Problemas detectados:');
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('');
      console.log('💡 Causa provável do erro 500:');
      console.log('   O Sequelize está tentando fazer JOIN com tabelas/registros que não existem.\n');
    } else {
      console.log('✅ Service Request está íntegra, relacionamentos OK.\n');
      console.log('💡 O erro 500 pode ser devido a:');
      console.log('   1. Problema no modelo Sequelize (associações)');
      console.log('   2. Campo sendo acessado que não existe');
      console.log('   3. Erro ao serializar dados JSON\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

testServiceRequestDetail();
