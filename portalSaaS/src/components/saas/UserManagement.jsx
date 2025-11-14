import { Users, UserPlus } from 'lucide-react';

const UserManagement = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie usuários da plataforma SaaS</p>
        </div>
        
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gestão de Usuários em Desenvolvimento
          </h3>
          <p className="text-gray-600">
            Esta seção estará disponível em breve com gestão completa de usuários SaaS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
