// Simple test to check if the password is correct
const bcrypt = require('bcryptjs');

async function testPassword() {
  // This is a known bcrypt hash for "123456789"
  const knownHash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeOXe/CZWPKN4wqbvdkVpH1P6oi.';
  
  const testPasswords = ['123456789', '123456', 'password', 'admin'];
  
  for (const pwd of testPasswords) {
    const isValid = await bcrypt.compare(pwd, knownHash);
    console.log(`Password "${pwd}" against known hash: ${isValid}`);
  }
}

testPassword().catch(console.error);