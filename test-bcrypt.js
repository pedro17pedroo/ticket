const bcrypt = require('bcryptjs');

async function testBcrypt() {
  try {
    const password = '123456789';
    
    // Create a hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Generated hash:', hash);
    
    // Test comparison
    const isValid = await bcrypt.compare(password, hash);
    console.log('Comparison result:', isValid);
    
    // Test with the hash from database
    const dbHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ4/Of/Th/X/pVMwxnIT8Q/LRN10Tr3C';
    const isDbValid = await bcrypt.compare(password, dbHash);
    console.log('DB hash comparison:', isDbValid);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBcrypt();