const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function checkUser() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'tatuticket',
    user: 'postgres',
    password: 'postgres123'
  });
  
  try {
    await client.connect();
    const result = await client.query('SELECT id, email, password, "isActive" FROM clients WHERE email = $1', ['gegad90630@cucadas.com']);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User found:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('IsActive:', user.isActive);
      console.log('Password hash:', user.password);
      
      // Test password
      const isValid = await bcrypt.compare('123456789', user.password);
      console.log('Password 123456789 is valid:', isValid);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUser();