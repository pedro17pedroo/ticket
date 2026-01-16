const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('tatuticket', 'postgres', 'root', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function resetPassword() {
  try {
    // Use a simple bcrypt hash for the password "123456789"
    // This is the hash for "123456789" with salt rounds 10
    const hashedPassword = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    const [result] = await sequelize.query(
      'UPDATE client_users SET password = ?, updated_at = NOW() WHERE email = ?',
      { replacements: [hashedPassword, 'gegad90630@cucadas.com'] }
    );
    
    console.log('Password updated successfully');
    
    // Verify the update
    const [user] = await sequelize.query(
      'SELECT email, updated_at FROM client_users WHERE email = ?',
      { replacements: ['gegad90630@cucadas.com'] }
    );
    
    console.log('User after update:', user[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

resetPassword();