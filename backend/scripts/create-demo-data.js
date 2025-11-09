import { sequelize } from '../src/config/database.js';
import Client from '../src/modules/clients/clientModel.js';
import ClientUser from '../src/modules/clients/clientUserModel.js';
import Organization from '../src/modules/organizations/organizationModel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createDemoData() {
  try {
    console.log('🎨 Criando dados de demonstração...\n');

    // Buscar tenant existente
    const tenant = await Organization.findOne({ where: { type: 'tenant' } });
    if (!tenant) {
      console.log('❌ Nenhum tenant encontrado. Execute o seed multi-tenant primeiro.');
      process.exit(1);
    }
    console.log(`✅ Tenant encontrado: ${tenant.name}`);

    // Criar cliente demo
    const [client1, created1] = await Client.findOrCreate({
      where: { email: 'contato@acme.pt' },
      defaults: {
        organizationId: tenant.id,
        name: 'ACME Technologies Lda',
        tradeName: 'ACME Tech',
        taxId: '123456789',
        industryType: 'technology',
        email: 'contato@acme.pt',
        phone: '+351 210 000 100',
        website: 'https://acme.pt',
        address: {
          street: 'Rua das Tecnologias, 100',
          city: 'Lisboa',
          postalCode: '1000-001',
          country: 'PT'
        },
        contract: {
          status: 'active',
          slaLevel: 'premium',
          supportHours: '24x7',
          maxUsers: 50,
          maxTicketsPerMonth: 500
        },
        billing: {
          currency: 'EUR',
          billingCycle: 'monthly',
          monthlyValue: 2500,
          paymentMethod: 'bank-transfer'
        },
        primaryContact: {
          name: 'João Silva',
          email: 'joao.silva@acme.pt',
          phone: '+351 910 000 100',
          position: 'CTO'
        }
      }
    });
    console.log(`${created1 ? '✅ Cliente criado' : '⏭️  Cliente já existe'}: ${client1.name}`);

    // Criar client-admin para ACME
    const hashedPassword = await bcrypt.hash('ClientAdmin@123', 10);
    const [admin1, created2] = await ClientUser.findOrCreate({
      where: { email: 'admin@acme.pt' },
      defaults: {
        organizationId: tenant.id,
        clientId: client1.id,
        name: 'Admin ACME',
        email: 'admin@acme.pt',
        password: hashedPassword,
        role: 'client-admin',
        phone: '+351 910 000 101',
        position: 'IT Manager',
        departmentName: 'TI',
        permissions: {
          canCreateTickets: true,
          canViewAllClientTickets: true,
          canApproveRequests: true,
          canAccessKnowledgeBase: true,
          canRequestServices: true
        }
      }
    });
    console.log(`${created2 ? '✅ Client Admin criado' : '⏭️  Client Admin já existe'}: ${admin1.email}`);

    // Criar client-user para ACME
    const [user1, created3] = await ClientUser.findOrCreate({
      where: { email: 'user@acme.pt' },
      defaults: {
        organizationId: tenant.id,
        clientId: client1.id,
        name: 'Maria Santos',
        email: 'user@acme.pt',
        password: hashedPassword,
        role: 'client-user',
        phone: '+351 910 000 102',
        position: 'Developer',
        departmentName: 'Desenvolvimento'
      }
    });
    console.log(`${created3 ? '✅ Client User criado' : '⏭️  Client User já existe'}: ${user1.email}\n`);

    // Segundo cliente
    const [client2, created4] = await Client.findOrCreate({
      where: { email: 'info@techsolutions.pt' },
      defaults: {
        organizationId: tenant.id,
        name: 'Tech Solutions Portugal',
        tradeName: 'TechSolutions',
        taxId: '987654321',
        industryType: 'consulting',
        email: 'info@techsolutions.pt',
        phone: '+351 220 000 200',
        address: {
          street: 'Avenida da Boavista, 500',
          city: 'Porto',
          postalCode: '4100-100',
          country: 'PT'
        },
        contract: {
          status: 'active',
          slaLevel: 'standard',
          supportHours: 'business-hours',
          maxUsers: 20,
          maxTicketsPerMonth: 100
        }
      }
    });
    console.log(`${created4 ? '✅ Cliente criado' : '⏭️  Cliente já existe'}: ${client2.name}`);

    const [admin2, created5] = await ClientUser.findOrCreate({
      where: { email: 'admin@techsolutions.pt' },
      defaults: {
        organizationId: tenant.id,
        clientId: client2.id,
        name: 'Pedro Costa',
        email: 'admin@techsolutions.pt',
        password: hashedPassword,
        role: 'client-admin',
        position: 'Operations Manager'
      }
    });
    console.log(`${created5 ? '✅ Client Admin criado' : '⏭️  Client Admin já existe'}: ${admin2.email}`);

    console.log('\n🎉 Dados de demonstração criados com sucesso!');
    console.log('\n📋 Credenciais:');
    console.log('   Cliente 1 (ACME):');
    console.log('     Admin: admin@acme.pt / ClientAdmin@123');
    console.log('     User:  user@acme.pt / ClientAdmin@123');
    console.log('   Cliente 2 (TechSolutions):');
    console.log('     Admin: admin@techsolutions.pt / ClientAdmin@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createDemoData();
