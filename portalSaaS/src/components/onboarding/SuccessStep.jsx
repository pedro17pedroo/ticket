import { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, ExternalLink, Mail, BookOpen, Users, Download, Copy, Check, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

const SuccessStep = ({ data }) => {
  const [copiedItems, setCopiedItems] = useState({});

  useEffect(() => {
    // Trigger confetti animation
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = async (text, item) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [item]: true }));
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [item]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const nextSteps = [
    {
      icon: Users,
      title: 'Convide sua Equipe',
      description: 'Adicione membros da equipe e configure suas permissões',
      action: 'Gerenciar Usuários',
      color: 'bg-blue-500'
    },
    {
      icon: BookOpen,
      title: 'Configure o Catálogo',
      description: 'Crie categorias e itens de serviço para seus clientes',
      action: 'Configurar Catálogo',
      color: 'bg-purple-500'
    },
    {
      icon: Download,
      title: 'Desktop Agent',
      description: 'Instale o agente para coleta automática de inventário',
      action: 'Baixar Agent',
      color: 'bg-green-500'
    }
  ];

  const resources = [
    {
      title: 'Guia de Início Rápido',
      description: 'Aprenda o básico em 10 minutos',
      url: '/docs/quick-start',
      icon: '🚀'
    },
    {
      title: 'Documentação Completa',
      description: 'Todas as funcionalidades explicadas',
      url: '/docs',
      icon: '📖'
    },
    {
      title: 'Video Tutoriais',
      description: 'Assista e aprenda no seu ritmo',
      url: '/tutorials',
      icon: '🎥'
    },
    {
      title: 'Comunidade',
      description: 'Conecte-se com outros usuários',
      url: '/community',
      icon: '👥'
    }
  ];

  return (
    <div className="text-center space-y-8">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg"
      >
        <Rocket className="h-12 w-12 text-white" />
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Parabéns! Sua organização foi criada!
        </h2>
        <p className="text-xl text-gray-600 mb-6">
          <strong>{data.organizationName}</strong> está pronta para uso
        </p>
      </motion.div>

      {/* Access Information */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Informações de Acesso
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">URL de Acesso</p>
              <p className="text-lg font-mono text-blue-600">{data.loginUrl}</p>
            </div>
            <button
              onClick={() => copyToClipboard(data.loginUrl, 'url')}
              className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              {copiedItems.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">E-mail de Login</p>
              <p className="text-lg font-mono text-blue-600">{data.email}</p>
            </div>
            <button
              onClick={() => copyToClipboard(data.email, 'email')}
              className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              {copiedItems.email ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="p-3 bg-white rounded-lg border">
            <p className="text-sm font-medium text-gray-700 mb-1">Senha</p>
            <p className="text-sm text-gray-600">Use a senha que você criou durante o onboarding</p>
          </div>
        </div>

        <div className="mt-6">
          <a
            href={data.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Acessar Portal
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Próximos Passos Recomendados
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {nextSteps.map((step, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className={`inline-flex items-center justify-center w-12 h-12 ${step.color} rounded-lg shadow-lg mb-4`}>
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{step.description}</p>
              <button className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                {step.action}
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Resources */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Recursos Úteis
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-4">{resource.icon}</span>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">{resource.title}</h4>
                <p className="text-sm text-gray-600">{resource.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Support */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6"
      >
        <div className="flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-green-600 mr-2" />
          <h4 className="font-semibold text-green-900">Suporte Dedicado</h4>
        </div>
        <p className="text-sm text-green-800 mb-4">
          Tem alguma dúvida ou precisa de ajuda? Nossa equipe de suporte está pronta para ajudar!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:suporte@tatuticket.com"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Mail className="h-4 w-4 mr-2" />
            suporte@tatuticket.com
          </a>
          <a
            href="/contact"
            className="inline-flex items-center px-4 py-2 bg-white text-green-700 text-sm font-medium rounded-lg border border-green-300 hover:bg-green-50 transition-colors"
          >
            Central de Ajuda
          </a>
        </div>
      </motion.div>

      {/* Trial Information */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
      >
        <p className="text-sm text-yellow-800">
          <strong>Lembrete:</strong> Você está no período de trial de 14 dias. 
          Aproveite para explorar todas as funcionalidades sem nenhum custo!
        </p>
      </motion.div>
    </div>
  );
};

export default SuccessStep;
