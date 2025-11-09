/**
 * RemoteAccessNotifications - Gerencia notificações de acesso remoto
 * Vanilla JS para integração com Electron Desktop Agent
 */

export class RemoteAccessNotifications {
  constructor(container, apiUrl, token) {
    this.container = container;
    this.apiUrl = apiUrl;
    this.token = token;
    this.requests = [];
    this.responding = null;
  }

  /**
   * Inicializar notificações
   */
  async initialize() {
    await this.loadPendingRequests();
    this.render();
  }

  /**
   * Carregar solicitações pendentes
   */
  async loadPendingRequests() {
    try {
      const result = await window.electronAPI.getRemoteAccessPending();
      if (result.success) {
        this.requests = result.requests || [];
        this.render();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar solicitações:', error);
    }
  }

  /**
   * Adicionar nova solicitação
   */
  addRequest(request) {
    this.requests.push(request);
    this.render();
    this.playNotificationSound();
    
    // Mostrar notificação nativa
    if (window.electronAPI && window.electronAPI.showNotification) {
      window.electronAPI.showNotification({
        title: '🔔 Solicitação de Acesso Remoto',
        body: `${request.requester?.name || 'Um técnico'} está solicitando acesso remoto para o ticket ${request.ticket?.ticketNumber || ''}`
      });
    }
  }

  /**
   * Remover solicitação
   */
  removeRequest(requestId) {
    this.requests = this.requests.filter(r => r.id !== requestId);
    this.render();
  }

  /**
   * Aceitar acesso remoto
   */
  async handleAccept(requestId) {
    this.responding = requestId;
    this.render();

    try {
      const result = await window.electronAPI.acceptRemoteAccess(requestId);
      
      if (result.success) {
        this.removeRequest(requestId);
        this.showToast('✅ Acesso remoto aceito! Conexão estabelecida.', 'success');
      } else {
        throw new Error(result.error || 'Erro ao aceitar acesso');
      }
    } catch (error) {
      console.error('❌ Erro ao aceitar acesso:', error);
      this.showToast('❌ Erro ao aceitar acesso remoto', 'error');
    } finally {
      this.responding = null;
      this.render();
    }
  }

  /**
   * Rejeitar acesso remoto
   */
  async handleReject(requestId) {
    this.responding = requestId;
    this.render();

    try {
      const result = await window.electronAPI.rejectRemoteAccess(requestId, 'Recusado pelo usuário');
      
      if (result.success) {
        this.removeRequest(requestId);
        this.showToast('❌ Acesso remoto recusado', 'info');
      } else {
        throw new Error(result.error || 'Erro ao rejeitar acesso');
      }
    } catch (error) {
      console.error('❌ Erro ao rejeitar acesso:', error);
      this.showToast('❌ Erro ao rejeitar acesso remoto', 'error');
    } finally {
      this.responding = null;
      this.render();
    }
  }

  /**
   * Dispensar notificação
   */
  dismissRequest(requestId) {
    this.removeRequest(requestId);
  }

  /**
   * Tocar som de notificação
   */
  playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2W89euZTQ0OTqni7q5iGggrhM3y0nwsAwBG');
      audio.play().catch(() => {});
    } catch (error) {
      // Som falhou, não faz nada
    }
  }

  /**
   * Mostrar toast
   */
  showToast(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Renderizar notificações
   */
  render() {
    if (this.requests.length === 0) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = this.requests.map(request => `
      <div class="remote-access-notification" data-request-id="${request.id}">
        <div class="notification-header">
          <div class="notification-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <h4>Solicitação de Acesso Remoto</h4>
          <button class="dismiss-btn" onclick="remoteAccessNotifications.dismissRequest('${request.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="notification-body">
          <p class="requester-name">
            <strong>${request.requester?.name || 'Um técnico'}</strong> está solicitando acesso remoto
          </p>

          <div class="ticket-info">
            <p><strong>Ticket:</strong> ${request.ticket?.ticketNumber || 'N/A'}</p>
            <p class="ticket-subject">${request.ticket?.subject || ''}</p>
          </div>

          <div class="warning-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>O técnico terá acesso temporário ao seu computador. Você pode encerrar a qualquer momento.</span>
          </div>

          <div class="notification-actions">
            <button 
              class="btn-reject" 
              onclick="remoteAccessNotifications.handleReject('${request.id}')"
              ${this.responding === request.id ? 'disabled' : ''}
            >
              Recusar
            </button>
            <button 
              class="btn-accept" 
              onclick="remoteAccessNotifications.handleAccept('${request.id}')"
              ${this.responding === request.id ? 'disabled' : ''}
            >
              ${this.responding === request.id ? 'Aceitando...' : 'Aceitar'}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Estilos CSS
export const remoteAccessNotificationsStyles = `
.remote-access-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  background: white;
  border: 2px solid #9333ea;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.notification-icon {
  width: 40px;
  height: 40px;
  background: #f3e8ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9333ea;
  flex-shrink: 0;
}

.notification-header h4 {
  flex: 1;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.dismiss-btn:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.notification-body {
  padding: 16px;
}

.requester-name {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #4b5563;
}

.ticket-info {
  background: #f9fafb;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
}

.ticket-info p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.ticket-subject {
  margin-top: 4px !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
}

.warning-box svg {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-box span {
  font-size: 11px;
  color: #92400e;
  line-height: 1.4;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-reject {
  background: #f3f4f6;
  color: #374151;
}

.btn-reject:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-accept {
  background: #16a34a;
  color: white;
}

.btn-accept:hover:not(:disabled) {
  background: #15803d;
}

.notification-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
