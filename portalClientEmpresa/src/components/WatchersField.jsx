import { useState } from 'react';
import { X, Plus, Mail } from 'lucide-react';

const WatchersField = ({ watchers = [], onChange, placeholder = "Digite emails para notificar..." }) => {
  const [inputValue, setInputValue] = useState('');

  // Adicionar email à lista
  const addWatcher = () => {
    const email = inputValue.trim().toLowerCase();
    
    // Validar email simples
    if (!email || !email.includes('@') || !email.includes('.')) {
      alert('Digite um email válido');
      return;
    }

    // Evitar duplicatas
    if (watchers.includes(email)) {
      alert('Este email já foi adicionado');
      return;
    }

    onChange([...watchers, email]);
    setInputValue('');
  };

  // Remover email da lista
  const removeWatcher = (emailToRemove) => {
    onChange(watchers.filter(email => email !== emailToRemove));
  };

  // Adicionar com Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWatcher();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <Mail className="inline w-4 h-4 mr-2" />
        Notificar também
      </label>
      
      {/* Input para adicionar emails */}
      <div className="flex space-x-2">
        <input
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                   focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white 
                   text-sm"
        />
        <button
          type="button"
          onClick={addWatcher}
          disabled={!inputValue.trim()}
          className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   flex items-center space-x-1 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Lista de emails adicionados */}
      {watchers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {watchers.length} {watchers.length === 1 ? 'pessoa será notificada' : 'pessoas serão notificadas'}:
          </p>
          <div className="flex flex-wrap gap-2">
            {watchers.map((email) => (
              <span
                key={email}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                         bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
              >
                <Mail className="w-3 h-3 mr-1" />
                {email}
                <button
                  type="button"
                  onClick={() => removeWatcher(email)}
                  className="ml-2 text-primary-400 hover:text-primary-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 Essas pessoas receberão notificações sobre atualizações deste ticket por email e no sistema.
      </p>
    </div>
  );
};

export default WatchersField;
