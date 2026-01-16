const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize('tatuticket', 'postgres', 'root', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function fixClientPassword() {
  try {
    const email = 'gegad90630@cucadas.com';
    const newPassword = '123456789';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the client_users table
    const [results] = await sequelize.query(
      'UPDATE client_users SET password = ?, updated_at = NOW() WHERE email = ?',
      { replacements: [hashedPassword, email] }
    );
    
    console.log('Password updated successfully for client user:', email);
    
    // Verify the update
    const [user] = await sequelize.query(
      'SELECT id, email, is_active FROM client_users WHERE email = ?',
      { replacements: [email] }
    );
    
    if (user.length > 0) {
      console.log('User verified:', user[0]);
      
      // Test the password
      const isValid = await bcrypt.compare(newPassword, hashedPassword);
      console.log('Password validation test:', isValid);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixClientPassword();