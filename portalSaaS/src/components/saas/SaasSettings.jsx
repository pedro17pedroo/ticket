import { Settings, Save } from 'lucide-react';

const SaasSettings = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Configurações gerais da plataforma SaaS</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Configurações em Desenvolvimento
          </h3>
          <p className="text-gray-600">
            Esta seção estará disponível em breve com configurações avançadas da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SaasSettings;
