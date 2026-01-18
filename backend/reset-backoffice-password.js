import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Client } = pg;

const resetPassword = async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'tatuticket',
    user: 'postgres',
    password: 'root'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Definir nova senha
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar super-admin
    const result = await client.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING email, role',
      [hashedPassword, 'superadmin@tatuticket.com']
    );

    if (result.rows.length > 0) {
      console.log('✅ Senha do super-admin atualizada');
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('📋 CREDENCIAIS DO PORTAL BACKOFFICE');
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      console.log('🌐 URL: http://localhost:5175');
      console.log('');
      console.log('👤 Email: superadmin@tatuticket.com');
      console.log('🔑 Senha: Admin@123');
      console.log('');
      console.log('Role:', result.rows[0].role);
      console.log('');
      console.log('═══════════════════════════════════════════════════');
    } else {
      console.log('❌ Usuário super-admin não encontrado');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    await client.end();
    process.exit(1);
  }
};

resetPassword();
