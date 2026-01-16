import { ClientUser } from './src/modules/models/index.js';

async function testModel() {
  try {
    console.log('Testing ClientUser model...');
    
    const user = await ClientUser.findOne({
      where: { email: 'gegad90630@cucadas.com' }
    });
    
    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        role: user.role
      });
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testModel();