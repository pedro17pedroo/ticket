import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { SocketProvider } from './contexts/SocketContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout'
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
import ServiceCatalog from './pages/ServiceCatalog'
import Tags from './pages/Tags'
import Templates from './pages/Templates'
import Inventory from './pages/Inventory'
import InventoryDashboard from './pages/InventoryDashboard'
import InventoryDetail from './pages/InventoryDetail'
import AssetForm from './pages/AssetForm'
import Licenses from './pages/Licenses'

// Componente de rota protegida
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
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/tickets/kanban" element={<TicketsKanban />} />
                  <Route path="/tickets/new" element={<NewTicket />} />
                  <Route path="/tickets/:id" element={<TicketDetail />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/:id" element={<ClientDetails />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/directions" element={<Directions />} />
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/sections" element={<Sections />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/knowledge" element={<Knowledge />} />
                  <Route path="/slas" element={<SLAs />} />
                  <Route path="/priorities" element={<Priorities />} />
                  <Route path="/types" element={<Types />} />
                  <Route path="/hours-bank" element={<HoursBank />} />
                  <Route path="/catalog" element={<ServiceCatalog />} />
                  <Route path="/tags" element={<Tags />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/inventory" element={<InventoryDashboard />} />
                  <Route path="/inventory/assets" element={<Inventory />} />
                  <Route path="/inventory/new" element={<AssetForm />} />
                  <Route path="/inventory/licenses" element={<Licenses />} />
                  <Route path="/inventory/:id" element={<InventoryDetail />} />
                  <Route path="/inventory/:id/edit" element={<AssetForm />} />
                  <Route path="/settings" element={<Settings />} />
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
