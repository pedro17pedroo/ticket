import { useState } from 'react';
import { Monitor, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { collectBrowserInventory, sendInventoryToServer } from '../utils/browserInventory';
import api from '../services/api';
import toast from 'react-hot-toast';

const BrowserInventoryCollector = () => {
  const [collecting, setCollecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [inventory, setInventory] = useState(null);
  const [sent, setSent] = useState(false);

  const handleCollect = async () => {
    setCollecting(true);
    try {
      const data = await collectBrowserInventory();
      setInventory(data);
      toast.success('Informações coletadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao coletar informações');
      console.error(error);
    } finally {
      setCollecting(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await sendInventoryToServer(api);
      setSent(true);
      toast.success('Inventário enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar inventário');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Atualizar Inventário Automaticamente
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Clique no botão abaixo para coletar informações do seu computador diretamente pelo navegador. 
            <strong> Seguro e automático</strong> - não precisa baixar scripts!
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 space-y-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
              📋 Informações que serão coletadas:
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4">
              <li>✓ Sistema Operativo (Windows, macOS, Linux)</li>
              <li>✓ Versão do SO</li>
              <li>✓ Navegador e versão</li>
              <li>✓ Memória RAM aproximada</li>
              <li>✓ Número de núcleos do processador</li>
              <li>✓ Placa gráfica (GPU)</li>
              <li>✓ Resolução de tela</li>
              <li>✓ Timezone e idioma</li>
            </ul>
          </div>

          {/* Informações Coletadas */}
          {inventory && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-3">
                📊 Informações Coletadas:
              </h4>
              
              <div className="space-y-3 text-xs">
                {/* Sistema */}
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Sistema:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {inventory.os} {inventory.osVersion} ({inventory.architecture})
                  </span>
                </div>

                {/* Navegador */}
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Navegador:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {inventory.browser} {inventory.browserVersion}
                  </span>
                </div>

                {/* Hardware */}
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">CPU:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {inventory.hardware.cpuCores} cores
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">RAM:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {inventory.hardware.memory}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">GPU:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {inventory.hardware.gpu}
                  </span>
                </div>

                {/* Tela */}
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Tela:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {inventory.hardware.screenResolution} - {inventory.hardware.colorDepth}bit
                  </span>
                </div>

                {/* Localização */}
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Localização:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {inventory.locale.timezone} - {inventory.locale.language}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Avisos */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800 dark:text-yellow-300">
                <strong>Nota:</strong> Por segurança do navegador, não é possível coletar:
                lista de software instalado, número de série do hardware, ou drivers.
                Para inventário completo, contacte o administrador.
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={handleCollect}
              disabled={collecting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {collecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Coletando...
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4" />
                  Coletar Informações
                </>
              )}
            </button>

            {inventory && !sent && (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar para Servidor
                  </>
                )}
              </button>
            )}

            {sent && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">
                <Check className="w-4 h-4" />
                Enviado com sucesso!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserInventoryCollector;
