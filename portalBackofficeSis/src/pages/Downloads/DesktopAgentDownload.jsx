import { useState, useEffect } from 'react';
import { Download, Monitor, Apple, Terminal, Shield, CheckCircle, XCircle, Info, Cpu, HardDrive, Wifi, Bell, MessageSquare, BookOpen } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import api from '../../services/api';

const DesktopAgentDownload = () => {
  const [agentInfo, setAgentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadAgentInfo();
  }, []);

  const loadAgentInfo = async () => {
    try {
      const response = await api.get('/downloads/agent/info');
      setAgentInfo(response.data.agent);
    } catch (error) {
      console.error('Erro ao carregar informações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (platform) => {
    setDownloading(platform);
    try {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:4003/api'}/downloads/agent/${platform}`, '_blank');
    } catch (error) {
      console.error('Erro ao baixar:', error);
    } finally {
      setTimeout(() => setDownloading(null), 2000);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'windows': return <Monitor className="w-8 h-8" />;
      case 'mac': return <Apple className="w-8 h-8" />;
      case 'linux': return <Terminal className="w-8 h-8" />;
      default: return <Monitor className="w-8 h-8" />;
    }
  };

  const getBenefitIcon = (iconName) => {
    const icons = {
      '📊': <Cpu className="w-6 h-6 text-indigo-500" />,
      '🎫': <MessageSquare className="w-6 h-6 text-green-500" />,
      '💬': <MessageSquare className="w-6 h-6 text-blue-500" />,
      '📚': <BookOpen className="w-6 h-6 text-purple-500" />,
      '🔔': <Bell className="w-6 h-6 text-yellow-500" />,
      '🔒': <Shield className="w-6 h-6 text-red-500" />,
      '📡': <Wifi className="w-6 h-6 text-cyan-500" />,
      '⚡': <HardDrive className="w-6 h-6 text-orange-500" />
    };
    return icons[iconName] || <Info className="w-6 h-6 text-gray-500" />;
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
          <Monitor className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {agentInfo?.name || 'TatuTicket Desktop Agent'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {agentInfo?.description || 'Agente desktop para inventário automático, gestão de tickets e acesso remoto'}
        </p>
        <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
          Versão {agentInfo?.version || '1.0.0'}
        </span>
      </div>

      {/* Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Windows */}
        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Monitor className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-white">Windows</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {agentInfo?.requirements?.windows?.os || 'Windows 10 ou superior'}
          </p>
          {agentInfo?.downloads?.windows ? (
            <>
              <p className="text-xs text-gray-400 mb-3">
                {agentInfo.downloads.windows.sizeFormatted}
              </p>
              <Button
                onClick={() => handleDownload('windows')}
                loading={downloading === 'windows'}
                icon={<Download className="w-4 h-4" />}
                className="w-full"
              >
                Download .exe
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Em breve</p>
          )}
        </Card>

        {/* macOS */}
        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Apple className="w-8 h-8 text-gray-700 dark:text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-white">macOS</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {agentInfo?.requirements?.mac?.os || 'macOS 10.14+'}
          </p>
          {agentInfo?.downloads?.mac ? (
            <>
              <p className="text-xs text-gray-400 mb-3">
                {agentInfo.downloads.mac.sizeFormatted}
              </p>
              <Button
                onClick={() => handleDownload('mac')}
                loading={downloading === 'mac'}
                icon={<Download className="w-4 h-4" />}
                className="w-full"
              >
                Download .dmg
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Em breve</p>
          )}
        </Card>

        {/* Linux */}
        <Card className="text-center p-6 hover:shadow-lg transition-shadow">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
            <Terminal className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-white">Linux</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {agentInfo?.requirements?.linux?.os || 'Ubuntu 18.04+'}
          </p>
          {agentInfo?.downloads?.linux ? (
            <>
              <p className="text-xs text-gray-400 mb-3">
                {agentInfo.downloads.linux.sizeFormatted}
              </p>
              <Button
                onClick={() => handleDownload('linux')}
                loading={downloading === 'linux'}
                icon={<Download className="w-4 h-4" />}
                className="w-full"
              >
                Download .AppImage
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Em breve</p>
          )}
        </Card>
      </div>

      {/* Benefícios */}
      <Card className="mb-10">
        <h2 className="text-xl font-semibold mb-6 dark:text-white">Por que usar o Desktop Agent?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agentInfo?.benefits?.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center text-center p-4">
              <div className="mb-3">
                {getBenefitIcon(benefit.icon)}
              </div>
              <h4 className="font-medium mb-1 dark:text-white">{benefit.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Instruções */}
      <Card className="mb-10">
        <h2 className="text-xl font-semibold mb-6 dark:text-white">Como Instalar</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {agentInfo?.instructions?.map((instruction) => (
            <div key={instruction.step} className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{instruction.step}</span>
              </div>
              <h4 className="font-medium mb-1 dark:text-white">{instruction.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{instruction.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Privacidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <CheckCircle className="w-5 h-5 text-green-500" />
            O que é coletado
          </h3>
          <ul className="space-y-2">
            {agentInfo?.privacy?.collected?.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <XCircle className="w-5 h-5 text-red-500" />
            O que NÃO é coletado
          </h3>
          <ul className="space-y-2">
            {agentInfo?.privacy?.notCollected?.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Requisitos */}
      <Card>
        <h2 className="text-xl font-semibold mb-6 dark:text-white">Requisitos do Sistema</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium dark:text-white">Sistema</th>
                <th className="text-left py-3 px-4 font-medium dark:text-white">Versão Mínima</th>
                <th className="text-left py-3 px-4 font-medium dark:text-white">RAM</th>
                <th className="text-left py-3 px-4 font-medium dark:text-white">Espaço em Disco</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-400">
              <tr className="border-b dark:border-gray-700">
                <td className="py-3 px-4 flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> Windows
                </td>
                <td className="py-3 px-4">{agentInfo?.requirements?.windows?.os}</td>
                <td className="py-3 px-4">{agentInfo?.requirements?.windows?.ram}</td>
                <td className="py-3 px-4">{agentInfo?.requirements?.windows?.storage}</td>
              </tr>
              <tr className="border-b dark:border-gray-700">
                <td className="py-3 px-4 flex items-center gap-2">
                  <Apple className="w-4 h-4" /> macOS
                </td>
                <td className="py-3 px-4">{agentInfo?.requirements?.mac?.os}</td>
                <td className="py-3 px-4">{agentInfo?.requirements?.mac?.ram}</td>
                <td className="py-3 px-4">{agentInfo?.requirements?.mac?.storage}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Linux
                </td>
                <td className="py-3 px-4">{agentInfo?.requirements?.linux?.os}</td>
                <td className="py-3 px-4">{agentInfo?.requirements?.linux?.ram}</td>
                <td className="py-3 px-4">{agentInfo?.requirements?.linux?.storage}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DesktopAgentDownload;
