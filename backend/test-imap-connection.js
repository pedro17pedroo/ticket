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

async function testImapConnection() {
  console.log('🔍 Testando conexão IMAP...');
  console.log('📧 Configuração:', {
    host: config.imap.host,
    port: config.imap.port,
    user: config.imap.user,
    password: config.imap.password ? '***' + config.imap.password.slice(-4) : 'não configurado'
  });

  try {
    console.log('\n⏳ Conectando ao servidor IMAP...');
    const connection = await Imap.connect(config);
    console.log('✅ Conexão estabelecida com sucesso!');

    console.log('\n⏳ Abrindo caixa de entrada...');
    await connection.openBox('INBOX');
    console.log('✅ Caixa de entrada aberta com sucesso!');

    console.log('\n⏳ Buscando emails não lidos...');
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER'],
      markSeen: false
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`✅ Encontrados ${messages.length} emails não lidos`);

    if (messages.length > 0) {
      console.log('\n📬 Primeiros 5 emails:');
      messages.slice(0, 5).forEach((msg, i) => {
        const header = msg.parts.find(p => p.which === 'HEADER');
        if (header) {
          console.log(`\n${i + 1}. Email:`);
          console.log('   Subject:', header.body.subject?.[0] || 'Sem assunto');
          console.log('   From:', header.body.from?.[0] || 'Desconhecido');
          console.log('   Date:', header.body.date?.[0] || 'Sem data');
        }
      });
    }

    console.log('\n⏳ Fechando conexão...');
    await connection.end();
    console.log('✅ Conexão fechada com sucesso!');

    console.log('\n✅ TESTE COMPLETO - IMAP está funcionando corretamente!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO ao testar IMAP:');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    console.error('Stack:', error.stack);

    console.log('\n💡 Possíveis soluções:');
    console.log('1. Verificar se as credenciais estão corretas no .env');
    console.log('2. Verificar se o servidor IMAP está acessível');
    console.log('3. Verificar se a porta está correta (993 para SSL/TLS)');
    console.log('4. Verificar se o firewall não está bloqueando a conexão');
    console.log('5. Para Gmail: ativar "Acesso a apps menos seguros" ou usar App Password');
    console.log('6. Para Titan/outros: verificar se IMAP está habilitado na conta');

    process.exit(1);
  }
}

testImapConnection();
