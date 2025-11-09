import Imap from 'imap-simple';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASS,
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false,
      servername: process.env.IMAP_HOST || 'imap.gmail.com',
      minVersion: 'TLSv1.2'
    },
    authTimeout: 10000,
    connTimeout: 10000
  }
};

async function testConnection() {
  console.log('🔍 Testando conexão IMAP...');
  console.log('📧 Host:', config.imap.host);
  console.log('🔌 Port:', config.imap.port);
  console.log('👤 User:', config.imap.user);
  
  try {
    console.log('\n⏳ Conectando ao servidor IMAP...');
    const connection = await Imap.connect({ imap: config.imap });
    console.log('✅ Conexão IMAP estabelecida com sucesso!');
    
    console.log('\n📂 Abrindo caixa de entrada...');
    await connection.openBox('INBOX');
    console.log('✅ Caixa de entrada aberta!');
    
    console.log('\n🔍 Verificando e-mails não lidos...');
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER'],
      markSeen: false
    };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`✅ Encontrados ${messages.length} e-mails não lidos`);
    
    await connection.end();
    console.log('\n✅ Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro na conexão IMAP:');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

testConnection();
