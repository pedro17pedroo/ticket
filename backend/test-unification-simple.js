/**
 * Test script simples para verificar a unificação de tickets
 */

import { sequelize } from './src/config/database.js';
import Ticket from './src/modules/tickets/ticketModel.js';
import { CatalogItem } from './src/modules/catalog/catalogModel.js';

async function main() {
  console.log('🚀 Verificando unificação de tickets...\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar se service_requests existe
    console.log('\n🔍 1. Verificando se tabela service_requests existe...');
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'service_requests'
      );
    `);
    
    const serviceRequestsExists = results[0].exists;
    if (serviceRequestsExists) {
      console.log('⚠️  Tabela service_requests AINDA EXISTE!');
    } else {
      console.log('✅ Tabela service_requests foi REMOVIDA com sucesso!');
    }
    
    // 2. Verificar novos campos em tickets
    console.log('\n🔍 2. Verificando novos campos na tabela tickets...');
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tickets' 
      AND column_name IN (
        'requires_approval',
        'approval_status',
        'approval_comments',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'form_data',
        'estimated_cost',
        'estimated_delivery_days'
      )
      ORDER BY column_name;
    `);
    
    console.log(`✅ Encontrados ${columns.length} novos campos:`);
    columns.forEach(col => {
      console.log(`   - ${col.column_name}`);
    });
    
    if (columns.length !== 11) {
      console.log(`⚠️  Esperados 11 campos, encontrados ${columns.length}`);
    }
    
    // 3. Verificar índices
    console.log('\n🔍 3. Verificando índices criados...');
    const [indexes] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'tickets' 
      AND indexname LIKE '%approval%'
      ORDER BY indexname;
    `);
    
    console.log(`✅ Encontrados ${indexes.length} índices de aprovação:`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    
    // 4. Contar tickets por tipo
    console.log('\n🔍 4. Contando tickets por origem...');
    const [ticketStats] = await sequelize.query(`
      SELECT 
        source,
        COUNT(*) as total,
        COUNT(CASE WHEN catalog_item_id IS NOT NULL THEN 1 END) as with_catalog,
        COUNT(CASE WHEN requires_approval = true THEN 1 END) as requires_approval,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending
      FROM tickets
      GROUP BY source
      ORDER BY total DESC;
    `);
    
    console.log('✅ Estatísticas de tickets:');
    ticketStats.forEach(stat => {
      console.log(`\n   ${stat.source.toUpperCase()}:`);
      console.log(`   - Total: ${stat.total}`);
      console.log(`   - Com catálogo: ${stat.with_catalog}`);
      console.log(`   - Requer aprovação: ${stat.requires_approval}`);
      console.log(`   - Aprovados: ${stat.approved}`);
      console.log(`   - Rejeitados: ${stat.rejected}`);
      console.log(`   - Pendentes: ${stat.pending}`);
    });
    
    // 5. Verificar backup
    console.log('\n🔍 5. Verificando tabela de backup...');
    const [backupExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'service_requests_backup'
      );
    `);
    
    if (backupExists[0].exists) {
      const [backupCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM service_requests_backup;
      `);
      console.log(`✅ Tabela service_requests_backup existe com ${backupCount[0].count} registros`);
    } else {
      console.log('⚠️  Tabela service_requests_backup não encontrada');
    }
    
    // 6. Verificar model Ticket
    console.log('\n🔍 6. Verificando model Ticket...');
    const ticketAttributes = Object.keys(Ticket.rawAttributes);
    const newFields = [
      'requiresApproval',
      'approvalStatus',
      'approvalComments',
      'approvedBy',
      'approvedAt',
      'rejectedBy',
      'rejectedAt',
      'rejectionReason',
      'formData',
      'estimatedCost',
      'estimatedDeliveryDays'
    ];
    
    const missingFields = newFields.filter(field => !ticketAttributes.includes(field));
    if (missingFields.length === 0) {
      console.log('✅ Todos os novos campos estão no model Ticket');
    } else {
      console.log('⚠️  Campos faltando no model:', missingFields.join(', '));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Verificação de unificação concluída!\n');
    
    console.log('📊 RESUMO:');
    console.log(`   ✅ Tabela service_requests: ${serviceRequestsExists ? '❌ EXISTE' : '✅ REMOVIDA'}`);
    console.log(`   ✅ Novos campos: ${columns.length}/11`);
    console.log(`   ✅ Índices: ${indexes.length} criados`);
    console.log(`   ✅ Model atualizado: ${missingFields.length === 0 ? 'Sim' : 'Não'}`);
    console.log(`   ✅ Backup: ${backupExists[0].exists ? 'Criado' : 'Não encontrado'}`);
    
    if (!serviceRequestsExists && columns.length === 11 && missingFields.length === 0) {
      console.log('\n🎉 UNIFICAÇÃO 100% COMPLETA!');
    } else {
      console.log('\n⚠️  Alguns itens precisam de atenção');
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
