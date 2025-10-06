import React from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'

// Couleurs pour les graphiques - NotifCar Design System
const COLORS = ['#2633E1', '#1E9B7E', '#26C29E', '#7DDAC5', '#F97316', '#EF4444', '#10B981']

// Graphique des signalisations par jour
export const SignalizationsChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>📊 Signalisations des 7 derniers jours</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '300px',
          color: '#6B7280',
          fontSize: '1.1rem'
        }}>
          Aucune donnée de signalisation disponible
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3>📊 Signalisations des 7 derniers jours</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dayName" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [value, name === 'total' ? 'Total' : name === 'urgent' ? 'Urgentes' : 'Normales']}
            labelFormatter={(label) => `Jour: ${label}`}
          />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#2633E1" strokeWidth={3} name="Total" />
          <Line type="monotone" dataKey="urgent" stroke="#F97316" strokeWidth={2} name="Urgentes" />
          <Line type="monotone" dataKey="normal" stroke="#10B981" strokeWidth={2} name="Normales" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Graphique en barres des types de signalisations
export const SignalizationTypesChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>🚨 Types de signalisations</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '300px',
          color: '#6B7280',
          fontSize: '1.1rem'
        }}>
          Aucune donnée de type de signalisation disponible
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3>🚨 Types de signalisations</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              value, 
              name === 'total' ? 'Total' : name === 'urgent' ? 'Urgentes' : 'Normales'
            ]}
          />
          <Legend />
          <Bar dataKey="total" fill="#2633E1" name="Total" />
          <Bar dataKey="urgent" fill="#F97316" name="Urgentes" />
          <Bar dataKey="normal" fill="#10B981" name="Normales" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Graphique circulaire des marques populaires
export const BrandsPieChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>🏆 Répartition des marques</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '300px',
          color: '#6B7280',
          fontSize: '1.1rem'
        }}>
          Aucune donnée de marque disponible
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3>🏆 Répartition des marques</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ brand, count }) => `${brand} (${count})`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, 'Véhicules']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Graphique d'engagement par heure
export const EngagementChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="chart-container">
      <h3>⏰ Activité par heure (7 derniers jours)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip formatter={(value) => [value, 'Messages']} />
          <Bar dataKey="messages" fill="#2633E1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Graphique de croissance
export const GrowthChart: React.FC<{ data: any }> = ({ data }) => {
  const chartData = [
    {
      period: 'Semaine',
      growth: data.weeklyGrowth,
      value: data.vehiclesThisWeek,
      color: data.weeklyGrowth >= 0 ? '#10B981' : '#EF4444'
    },
    {
      period: 'Mois',
      growth: data.monthlyGrowth,
      value: data.vehiclesThisMonth,
      color: data.monthlyGrowth >= 0 ? '#10B981' : '#EF4444'
    }
  ]

  return (
    <div className="chart-container">
      <h3>📈 Croissance des véhicules</h3>
      <div className="growth-cards">
        {chartData.map((item, index) => (
          <div key={index} className="growth-card">
            <div className="growth-period">{item.period}</div>
            <div className="growth-value">{item.value}</div>
            <div className={`growth-percentage ${item.growth >= 0 ? 'positive' : 'negative'}`}>
              {item.growth >= 0 ? '↗️' : '↘️'} {Math.abs(item.growth)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
