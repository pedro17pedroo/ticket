import { ServiceRequest, CatalogItem, User, setupAssociations } from '../modules/models/index.js';
import { sequelize } from '../config/database.js';

async function testRequestDetailEndpoint() {
  console.log('🔍 Testando endpoint GET /api/catalog/requests/:id...\n');

  // IMPORTANTE: Configurar associações antes de fazer queries
  setupAssociations();
  console.log('✅ Associações configuradas\n');

  try {
    const requestId = 'e0d6f6d1-458d-4321-bef7-2feea560d707';
    
    console.log(`📋 Buscando Service Request ID: ${requestId}\n`);

    const include = [
      {
        model: CatalogItem,
        as: 'catalogItem',
        attributes: ['id', 'name', 'icon', 'itemType', 'description', 'estimatedCost', 'estimatedDeliveryTime', 'requiresApproval']
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        required: false
      },
      {
        model: User,
        as: 'approvedBy',
        attributes: ['id', 'name', 'email'],
        required: false
      },
      {
        model: User,
        as: 'rejectedBy',
        attributes: ['id', 'name', 'email'],
        required: false
      }
    ];

    const request = await ServiceRequest.findOne({
      where: { id: requestId },
      include
    });

    if (!request) {
      console.log('❌ Service Request não encontrada!\n');
      return;
    }

    console.log('✅ Service Request encontrada!');
    console.log('');

    const plain = request.get({ plain: true });
    
    console.log('📊 Dados Brutos (plain):');
    console.log(`   ID: ${plain.id}`);
    console.log(`   Status: ${plain.status}`);
    console.log(`   User ID: ${plain.userId}`);
    console.log(`   Catalog Item ID: ${plain.catalogItemId}`);
    console.log('');

    console.log('🔗 Relacionamentos:');
    console.log(`   catalogItem: ${plain.catalogItem ? '✓ OK' : '✗ NULL'}`);
    if (plain.catalogItem) {
      console.log(`      - Name: ${plain.catalogItem.name}`);
      console.log(`      - Type: ${plain.catalogItem.itemType}`);
      console.log(`      - Requires Approval: ${plain.catalogItem.requiresApproval}`);
    }
    
    console.log(`   user: ${plain.user ? '✓ OK' : '✗ NULL'}`);
    if (plain.user) {
      console.log(`      - Name: ${plain.user.name}`);
      console.log(`      - Email: ${plain.user.email}`);
    }
    
    console.log(`   approvedBy: ${plain.approvedBy ? '✓ OK' : '✗ NULL (esperado se não aprovado)'}`);
    if (plain.approvedBy) {
      console.log(`      - Name: ${plain.approvedBy.name}`);
    }
    
    console.log(`   rejectedBy: ${plain.rejectedBy ? '✓ OK' : '✗ NULL (esperado se não rejeitado)'}`);
    if (plain.rejectedBy) {
      console.log(`      - Name: ${plain.rejectedBy.name}`);
    }
    console.log('');

    // Serializar como no controller
    const serializedRequest = {
      ...plain,
      requester: plain.user,
      createdAt: plain.createdAt || plain.created_at,
      updatedAt: plain.updatedAt || plain.updated_at
    };

    console.log('📤 Resposta Serializada:');
    console.log(`   ID: ${serializedRequest.id}`);
    console.log(`   Status: ${serializedRequest.status}`);
    console.log(`   Requester: ${serializedRequest.requester?.name || 'N/A'}`);
    console.log(`   Item: ${serializedRequest.catalogItem?.name || 'N/A'}`);
    console.log('');

    console.log('✅ Teste concluído com sucesso!');
    console.log('💡 Se o endpoint continuar falhando, verifique:');
    console.log('   1. Logs do servidor para erro específico');
    console.log('   2. Se as associações do modelo estão corretas');
    console.log('   3. Se há circular references na serialização\n');

  } catch (error) {
    console.error('❌ Erro ao testar endpoint:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  } finally {
    await sequelize.close();
  }
}

testRequestDetailEndpoint();
