import React from 'react';

interface Conversation {
  id: string;
  vehicle_id: string | null;
  reporter_id: string | null;
  owner_id: string | null;
  status: 'active' | 'resolved' | 'archived' | string;
  created_at: string;
  vehicle_name?: string;
  reporter_name?: string;
  owner_name?: string;
}

interface ConversationsTableProps {
  conversations: Conversation[];
}

const ConversationsTable: React.FC<ConversationsTableProps> = ({ conversations }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'resolved':
        return '✅';
      case 'archived':
        return '📦';
      default:
        return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'resolved':
        return 'Résolue';
      case 'archived':
        return 'Archivée';
      default:
        return status;
    }
  };

  return (
    <div className="conversations">
      <h2>💬 Gestion des Conversations</h2>
      <div className="table-container">
        {conversations.length === 0 ? (
          <div className="no-data">
            <p>Aucune conversation trouvée</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Véhicule</th>
                <th>Signaleur</th>
                <th>Propriétaire</th>
                <th>Statut</th>
                <th>Date création</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map(conversation => (
                <tr key={conversation.id}>
                  <td>{conversation.id.substring(0, 8)}...</td>
                  <td>
                    {conversation.vehicle_name || 
                     (conversation.vehicle_id ? `${conversation.vehicle_id.substring(0, 8)}...` : 'N/A')}
                  </td>
                  <td>
                    {conversation.reporter_name || 
                     (conversation.reporter_id ? `${conversation.reporter_id.substring(0, 8)}...` : 'N/A')}
                  </td>
                  <td>
                    {conversation.owner_name || 
                     (conversation.owner_id ? `${conversation.owner_id.substring(0, 8)}...` : 'N/A')}
                  </td>
                  <td>
                    <span className={`status ${conversation.status}`}>
                      {getStatusIcon(conversation.status)} {getStatusText(conversation.status)}
                    </span>
                  </td>
                  <td>{new Date(conversation.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {conversations.length > 0 && (
        <div className="conversations-summary">
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Total conversations:</span>
              <span className="summary-value">{conversations.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Actives:</span>
              <span className="summary-value">
                {conversations.filter(c => c.status === 'active').length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Résolues:</span>
              <span className="summary-value">
                {conversations.filter(c => c.status === 'resolved').length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Archivées:</span>
              <span className="summary-value">
                {conversations.filter(c => c.status === 'archived').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationsTable