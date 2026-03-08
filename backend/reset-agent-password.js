import bcrypt from 'bcryptjs';
import { sequelize } from './src/config/database.js';
import { OrganizationUser } from './src/modules/models/index.js';

async function resetPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    const user = await OrganizationUser.findOne({
      where: { email: 'superuser@sistema.com' }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      process.exit(1);
    }

    console.log(`📝 Usuário encontrado: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);

    const newPassword = 'Senha@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({ password: hashedPassword });

    console.log(`✅ Senha resetada para: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

resetPassword();
