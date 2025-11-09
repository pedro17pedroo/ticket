/**
 * Suprime warnings específicos de bibliotecas de terceiros
 * que não podemos controlar (ex: react-quill usando findDOMNode)
 */

// Salvar console.error original
const originalError = console.error;

// Substituir console.error com filtro
console.error = (...args) => {
  // Suprimir warning específico do findDOMNode do react-quill
  if (
    typeof args[0] === 'string' &&
    args[0].includes('findDOMNode') &&
    args[0].includes('deprecated')
  ) {
    // Ignorar este warning específico
    return;
  }
  
  // Chamar console.error original para outros erros
  originalError.call(console, ...args);
};

// Em produção, restaurar comportamento original
if (import.meta.env.PROD) {
  console.error = originalError;
}
