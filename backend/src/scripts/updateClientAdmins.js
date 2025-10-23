import { sequelize } from '../config/database.js';
import { User } from '../modules/models/index.js';

const updateClientAdmins = async () => {
  try {
    console.log('🔄 Atualizando admins de clientes existentes...');
    
    // Buscar todos os utilizadores cliente-org que não têm clientId (são os admins principais)
    const clientAdmins = await User.findAll({
      where: {
        role: 'cliente-org',
        clientId: null // Utilizadores principais (criados via /api/clients)
      }
    });

    console.log(`📌 Encontrados ${clientAdmins.length} utilizadores principais de clientes`);

    for (const admin of clientAdmins) {
      // Atualizar settings para adicionar clientAdmin = true
      const currentSettings = admin.settings || {};
      const updatedSettings = {
        ...currentSettings,
        notifications: true,
        emailNotifications: true,
        theme: 'light',
        language: 'pt',
        clientAdmin: true // Define como admin do cliente
      };

      await admin.update({ settings: updatedSettings });
      console.log(`✅ Atualizado: ${admin.name} (${admin.email}) - clientAdmin: true`);
    }

    console.log('✅ Todos os admins de clientes foram atualizados!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao atualizar admins:', error);
    process.exit(1);
  }
};

updateClientAdmins();
