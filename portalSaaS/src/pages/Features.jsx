import { Link } from 'react-router-dom';
import { 
  Check, Zap, Shield, Users, Globe, BarChart, 
  Webhook, MessageSquare, Bell, Lock, FileText, Smartphone 
} from 'lucide-react';

export default function Features() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
              <span className="text-xl font-bold">TatuTicket</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-blue-600 font-medium">Funcionalidades</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900">Preços</Link>
              <Link to="/trial" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Trial Gratuito
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Funcionalidades Completas
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Tudo o que você precisa para gerenciar tickets, clientes e suporte em uma única plataforma
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap />}
              title="Ultra Rápido"
              description="Performance otimizada com cache inteligente e carregamento instantâneo"
              features={['Cache Redis', 'CDN Global', 'Load Balancing']}
            />
            
            <FeatureCard
              icon={<Shield />}
              title="Segurança Avançada"
              description="Proteção completa com criptografia e conformidade GDPR"
              features={['SSL/TLS', 'IP Whitelist', 'Audit Logs', '2FA']}
            />
            
            <FeatureCard
              icon={<Users />}
              title="Multi-Tenant B2B2C"
              description="Arquitetura hierárquica com segregação total de dados"
              features={['Provider', 'Tenants', 'Clientes B2B', 'Usuários']}
            />
            
            <FeatureCard
              icon={<Globe />}
              title="Multi-Regional"
              description="Deploy em qualquer região do mundo"
              features={['Cloud', 'On-Premise', 'Híbrido']}
            />
            
            <FeatureCard
              icon={<BarChart />}
              title="Analytics Avançado"
              description="Dashboards e relatórios em tempo real"
              features={['KPIs', 'Forecasting', 'Export CSV/Excel', 'Widgets']}
            />
            
            <FeatureCard
              icon={<Webhook />}
              title="Integrações"
              description="Conecte com suas ferramentas favoritas"
              features={['Slack', 'Teams', 'Jira', 'Webhooks', 'API REST']}
            />
            
            <FeatureCard
              icon={<MessageSquare />}
              title="Comunicação"
              description="Múltiplos canais de atendimento"
              features={['Email', 'Chat', 'WhatsApp', 'Portal']}
            />
            
            <FeatureCard
              icon={<Bell />}
              title="Automação"
              description="Workflows inteligentes e automações"
              features={['SLA', 'Escalação', 'Macros', 'Templates']}
            />
            
            <FeatureCard
              icon={<Lock />}
              title="Controle de Acesso"
              description="Permissões granulares por role"
              features={['7 Roles', 'Permissões', 'RBAC', 'SSO']}
            />
            
            <FeatureCard
              icon={<FileText />}
              title="Knowledge Base"
              description="Base de conhecimento completa"
              features={['Artigos', 'Categorias', 'Busca', 'Markdown']}
            />
            
            <FeatureCard
              icon={<Smartphone />}
              title="Mobile Ready"
              description="Totalmente responsivo em qualquer dispositivo"
              features={['iOS', 'Android', 'PWA', 'Offline']}
            />
            
            <FeatureCard
              icon={<Users />}
              title="Desktop Agent"
              description="Acesso remoto aos equipamentos"
              features={['Remote Desktop', 'File Transfer', 'Inventory', 'Logs']}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Experimente gratuitamente por 14 dias
          </p>
          <Link
            to="/trial"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
          >
            Iniciar Trial Gratuito
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2025 TatuTicket. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, features }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
