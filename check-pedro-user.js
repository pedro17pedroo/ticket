import { ClientUser } from './backend/src/modules/models/index.js';

async function checkUser() {
  try {
    const user = await ClientUser.findOne({
      where: { email: 'pedro17pedroo@gmail.com' },
      raw: true
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log('ID:', user.id);
    console.log('Nome:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Cliente ID:', user.clientId);
    console.log('Direção ID:', user.directionId);
    console.log('Departamento ID:', user.departmentId);
    console.log('Secção ID:', user.sectionId);
    console.log('Ativo:', user.isActive);

    // Verificar se é admin
    if (user.role === 'client-admin') {
      console.log('\n✅ Usuário é CLIENT-ADMIN - deve ver todos os tickets do cliente');
    } else {
      console.log('\n⚠️ Usuário NÃO é CLIENT-ADMIN - role atual:', user.role);
      console.log('Para tornar admin, execute:');
      console.log(`UPDATE "ClientUsers" SET role = 'client-admin' WHERE email = 'pedro17pedroo@gmail.com';`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkUser();
