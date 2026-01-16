import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { SocketProvider } from './contexts/SocketContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import TicketsKanban from './pages/TicketsKanban'
import TicketDetail from './pages/TicketDetail'
import NewTicket from './pages/NewTicket'
import Clients from './pages/Clients'
import ClientDetails from './pages/ClientDetails'
import Users from './pages/Users'
import Departments from './pages/Departments'
import Sections from './pages/Sections'
import Directions from './pages/Directions'
import Categories from './pages/Categories'
import Knowledge from './pages/Knowledge'
import SLAs from './pages/SLAs'
import Priorities from './pages/Priorities'
import Types from './pages/Types'
import HoursBank from './pages/HoursBank'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import ServiceCatalog from './pages/ServiceCatalog'
import CatalogCategories from './pages/CatalogCategories'
import CatalogApprovals from './pages/CatalogApprovals'
import CatalogAnalytics from './pages/CatalogAnalytics'
import Tags from './pages/Tags'
import Templates from './pages/Templates'
import Inventory from './pages/Inventory'
import InventoryDashboard from './pages/InventoryDashboard'
import InventoryDetail from './pages/InventoryDetail'
import AssetForm from './pages/AssetForm'
import Licenses from './pages/Licenses'
import LicenseForm from './pages/LicenseForm'
import OrganizationInventory from './pages/OrganizationInventory'
import ClientsInventory from './pages/ClientsInventory'
import UserInventoryDetail from './pages/UserInventoryDetail'
import ClientInventoryDetail from './pages/ClientInventoryDetail'
import Reports from './pages/Reports'
import RoleManagement from './pages/Settings/RoleManagement'
import DesktopAgent from './pages/DesktopAgent'
import Projects from './pages/Projects'
import ProjectForm from './pages/ProjectForm'
import ProjectDetail from './pages/ProjectDetail'
import ProjectKanban from './pages/ProjectKanban'
import ProjectGantt from './pages/ProjectGantt'
import ProjectReports from './pages/ProjectReports'

// Componente de rota protegida básica (apenas autenticação)
const PrivateRoute = ({ children }) => {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <SocketProvider>
        <NotificationProvider>
          <Toaster
            position="top-right"
            containerStyle={{
              zIndex: 99999,
            }}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<ProtectedRoute permission="dashboard.view"><Dashboard /></ProtectedRoute>} />
                      <Route path="/tickets" element={<ProtectedRoute permission="tickets.view"><Tickets /></ProtectedRoute>} />
                      <Route path="/tickets/kanban" element={<ProtectedRoute permission="tickets.view"><TicketsKanban /></ProtectedRoute>} />
                      <Route path="/tickets/new" element={<ProtectedRoute permission="tickets.create"><NewTicket /></ProtectedRoute>} />
                      <Route path="/tickets/:id" element={<ProtectedRoute permission="tickets.view"><TicketDetail /></ProtectedRoute>} />
                      <Route path="/clients" element={<ProtectedRoute permission="clients.view"><Clients /></ProtectedRoute>} />
                      <Route path="/clients/:id" element={<ProtectedRoute permission="clients.view"><ClientDetails /></ProtectedRoute>} />
                      <Route path="/users" element={<ProtectedRoute permission="users.view"><Users /></ProtectedRoute>} />
                      <Route path="/directions" element={<ProtectedRoute permission="directions.view"><Directions /></ProtectedRoute>} />
                      <Route path="/departments" element={<ProtectedRoute permission="departments.view"><Departments /></ProtectedRoute>} />
                      <Route path="/sections" element={<ProtectedRoute permission="sections.view"><Sections /></ProtectedRoute>} />
                      {/* Rotas antigas (compatibilidade) - podem ser removidas futuramente */}
                      <Route path="/categories" element={<ProtectedRoute permission="categories.view"><Categories /></ProtectedRoute>} />
                      <Route path="/slas" element={<ProtectedRoute permission="slas.view"><SLAs /></ProtectedRoute>} />
                      <Route path="/priorities" element={<ProtectedRoute permission="priorities.view"><Priorities /></ProtectedRoute>} />
                      <Route path="/types" element={<ProtectedRoute permission="types.view"><Types /></ProtectedRoute>} />

                      {/* Rotas novas com prefixo /system/ */}
                      <Route path="/system/categories" element={<ProtectedRoute permission="categories.view"><Categories /></ProtectedRoute>} />
                      <Route path="/system/slas" element={<ProtectedRoute permission="slas.view"><SLAs /></ProtectedRoute>} />
                      <Route path="/system/priorities" element={<ProtectedRoute permission="priorities.view"><Priorities /></ProtectedRoute>} />
                      <Route path="/system/types" element={<ProtectedRoute permission="types.view"><Types /></ProtectedRoute>} />
                      <Route path="/system/roles" element={<ProtectedRoute permission="roles.view"><RoleManagement /></ProtectedRoute>} />

                      <Route path="/knowledge" element={<ProtectedRoute permission="knowledge.view"><Knowledge /></ProtectedRoute>} />
                      <Route path="/hours-bank" element={<ProtectedRoute permission="hours_bank.view"><HoursBank /></ProtectedRoute>} />
                      <Route path="/reports" element={<ProtectedRoute permission="reports.view"><Reports /></ProtectedRoute>} />
                      <Route path="/catalog" element={<ProtectedRoute permission="catalog.view"><ServiceCatalog /></ProtectedRoute>} />
                      <Route path="/catalog/categories" element={<ProtectedRoute permission="catalog.view"><CatalogCategories /></ProtectedRoute>} />
                      <Route path="/catalog/approvals" element={<ProtectedRoute permission="catalog.approve"><CatalogApprovals /></ProtectedRoute>} />
                      <Route path="/catalog/analytics" element={<ProtectedRoute permission="catalog.view"><CatalogAnalytics /></ProtectedRoute>} />
                      <Route path="/tags" element={<ProtectedRoute permission="tags.view"><Tags /></ProtectedRoute>} />
                      <Route path="/templates" element={<ProtectedRoute permission="templates.view"><Templates /></ProtectedRoute>} />
                      <Route path="/inventory" element={<ProtectedRoute permission="inventory.view"><InventoryDashboard /></ProtectedRoute>} />
                      <Route path="/inventory/organization" element={<ProtectedRoute permission="inventory.view"><OrganizationInventory /></ProtectedRoute>} />
                      <Route path="/inventory/organization/:userId" element={<ProtectedRoute permission="inventory.view"><UserInventoryDetail /></ProtectedRoute>} />
                      <Route path="/inventory/clients" element={<ProtectedRoute permission="inventory.view"><ClientsInventory /></ProtectedRoute>} />
                      <Route path="/inventory/clients/:clientId" element={<ProtectedRoute permission="inventory.view"><ClientInventoryDetail /></ProtectedRoute>} />
                      <Route path="/inventory/clients/:clientId/users/:userId" element={<ProtectedRoute permission="inventory.view"><UserInventoryDetail /></ProtectedRoute>} />
                      <Route path="/inventory/assets" element={<ProtectedRoute permission="inventory.view"><Inventory /></ProtectedRoute>} />
                      <Route path="/inventory/new" element={<ProtectedRoute permission="inventory.create"><AssetForm /></ProtectedRoute>} />
                      <Route path="/inventory/licenses" element={<ProtectedRoute permission="licenses.view"><Licenses /></ProtectedRoute>} />
                      <Route path="/inventory/licenses/new" element={<ProtectedRoute permission="licenses.create"><LicenseForm /></ProtectedRoute>} />
                      <Route path="/inventory/licenses/:id/edit" element={<ProtectedRoute permission="licenses.update"><LicenseForm /></ProtectedRoute>} />
                      <Route path="/inventory/:id" element={<ProtectedRoute permission="inventory.view"><InventoryDetail /></ProtectedRoute>} />
                      <Route path="/inventory/:id/edit" element={<ProtectedRoute permission="inventory.update"><AssetForm /></ProtectedRoute>} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/desktop-agent" element={<ProtectedRoute permission="desktop_agent.view"><DesktopAgent /></ProtectedRoute>} />
                      <Route path="/projects" element={<ProtectedRoute permission="projects.view"><Projects /></ProtectedRoute>} />
                      <Route path="/projects/reports" element={<ProtectedRoute permission="projects.view"><ProjectReports /></ProtectedRoute>} />
                      <Route path="/projects/new" element={<ProtectedRoute permission="projects.create"><ProjectForm /></ProtectedRoute>} />
                      <Route path="/projects/:id" element={<ProtectedRoute permission="projects.view"><ProjectDetail /></ProtectedRoute>} />
                      <Route path="/projects/:id/edit" element={<ProtectedRoute permission="projects.update"><ProjectForm /></ProtectedRoute>} />
                      <Route path="/projects/:id/kanban" element={<ProtectedRoute permission="projects.view"><ProjectKanban /></ProtectedRoute>} />
                      <Route path="/projects/:id/gantt" element={<ProtectedRoute permission="projects.view"><ProjectGantt /></ProtectedRoute>} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </NotificationProvider>
      </SocketProvider>
    </Router>
  )
}

export default App
