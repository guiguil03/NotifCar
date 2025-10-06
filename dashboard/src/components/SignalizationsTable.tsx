export default function SignalizationsTable({ signalizations }: { signalizations: any[] }) {
  return (
    <div className="signalizations">
      <h2> Gestion des Signalisations</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Véhicule</th>
              <th>Signaleur</th>
              <th>Urgence</th>
              <th>Date</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {signalizations.length > 0 ? signalizations.map((s: any, index: number) => (
              <tr key={index}>
                <td>{s.type || 'N/A'}</td>
                <td>{s.vehiclePlate || 'N/A'}</td>
                <td>{s.reporterEmail || 'Anonyme'}</td>
                <td>
                  <span className={`status ${s.urgency || 'normal'}`}>
                    {s.urgency || 'Normal'}
                  </span>
                </td>
                <td>{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                  <span className={`status ${s.status || 'pending'}`}>
                    {s.status || 'En attente'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280' }}>
                  Aucune signalisation trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


