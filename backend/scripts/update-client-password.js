import { ClientUser } from '../src/modules/models/index.js';
import '../src/config/database.js';

async function updatePassword() {
  try {
    const email = 'pedro.nekaka@gmail.com';
    const newPassword = 'password123';
    
    const user = await ClientUser.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      process.exit(1);
    }
    
    // Atualizar senha (o hook do modelo vai fazer o hash automaticamente)
    await user.update({ password: newPassword });
    
    console.log('✅ Senha atualizada com sucesso para:', email);
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', newPassword);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

updatePassword();
