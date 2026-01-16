import bcrypt from 'bcryptjs';

async function createHash() {
  try {
    const password = '123456789';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash validation:', isValid);
    
    // Test with wrong password
    const isInvalid = await bcrypt.compare('wrongpassword', hash);
    console.log('Wrong password validation:', isInvalid);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createHash();