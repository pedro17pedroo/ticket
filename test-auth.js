// Test authentication logic
import { ClientUser, Organization, Client } from './src/modules/models/index.js';

async function testAuth() {
  try {
    console.log('Testing ClientUser authentication...');
    
    const foundUser = await ClientUser.scope('withPassword').findOne({
      where: { email: 'gegad90630@cucadas.com' },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'logo', 'primaryColor', 'secondaryColor']
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'tradeName']
        }
      ]
    });

    if (!foundUser) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      id: foundUser.id,
      email: foundUser.email,
      isActive: foundUser.isActive,
      role: foundUser.role
    });

    if (!foundUser.isActive) {
      console.log('❌ User is not active');
      return;
    }

    console.log('✅ User is active');

    // Test password comparison
    const isPasswordValid = await foundUser.comparePassword('123456');
    console.log('Password comparison result:', isPasswordValid);

    if (isPasswordValid) {
      console.log('✅ Authentication successful!');
    } else {
      console.log('❌ Password is invalid');
    }

  } catch (error) {
    console.error('❌ Error during authentication test:', error.message);
    console.error(error.stack);
  }
}

testAuth();