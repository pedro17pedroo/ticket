import AccessDenied from '../components/AccessDenied'

/**
 * CatalogAccessDenied Page
 * 
 * Dedicated page for catalog access denied errors.
 * Shown when a user tries to access a catalog item they don't have permission for.
 * 
 * Feature: catalog-access-control
 * Requirements: 4.3
 */
const CatalogAccessDenied = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Catálogo de Serviços
        </h1>
      </div>

      {/* Access Denied Component */}
      <AccessDenied
        title="Acesso ao Serviço Restrito"
        message="Não tem permissão para aceder a este serviço do catálogo. A sua empresa pode não ter acesso a este item específico."
        redirectPath="/catalog"
        redirectLabel="Ver Catálogo Disponível"
        showBackButton={true}
      />
    </div>
  )
}

export default CatalogAccessDenied
