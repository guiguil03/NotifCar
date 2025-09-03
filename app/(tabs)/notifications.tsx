import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'urgent';
  title: string;
  message: string;
  vehicle: string;
  timestamp: Date;
  isRead: boolean;
  location?: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([
    // Données de démonstration
    {
      id: '1',
      type: 'warning',
      title: 'Véhicule mal garé',
      message: 'Votre véhicule gêne la circulation. Veuillez le déplacer.',
      vehicle: 'Renault Clio - AB-123-CD',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
      isRead: false,
      location: 'Rue de la Paix, Paris',
    },
    {
      id: '2',
      type: 'info',
      title: 'Feu de position allumé',
      message: 'Les feux de position de votre véhicule sont restés allumés.',
      vehicle: 'Renault Clio - AB-123-CD',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
    },
    {
      id: '3',
      type: 'urgent',
      title: 'Accident mineur',
      message: 'Votre véhicule a été touché par un autre véhicule. Aucun dégât visible.',
      vehicle: 'Renault Clio - AB-123-CD',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isRead: true,
      location: 'Parking Centre Commercial',
    },
  ]);

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const warningColor = useThemeColor({}, 'warning');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return errorColor;
      case 'warning':
        return warningColor;
      case 'info':
        return primaryColor;
      default:
        return primaryColor;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `Il y a ${minutes} min`;
    } else if (hours < 24) {
      return `Il y a ${hours}h`;
    } else {
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      'Supprimer la notification',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setNotifications(notifications.filter(notification => notification.id !== id));
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <ThemedView style={[styles.header, { backgroundColor: primaryColor }]}>
        <ThemedView style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
          {unreadCount > 0 && (
            <ThemedView style={[styles.badge, { backgroundColor: secondaryColor }]}>
              <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <ThemedText style={styles.markAllText}>Tout marquer</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* Statistiques rapides */}
      <ThemedView style={styles.statsContainer}>
        <ThemedView style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
          <Ionicons name="notifications-outline" size={24} color={primaryColor} />
          <ThemedText style={styles.statNumber}>{notifications.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
        </ThemedView>
        
        <ThemedView style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
          <Ionicons name="mail-unread-outline" size={24} color={warningColor} />
          <ThemedText style={styles.statNumber}>{unreadCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Non lues</ThemedText>
        </ThemedView>
        
        <ThemedView style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
          <Ionicons name="alert-circle-outline" size={24} color={errorColor} />
          <ThemedText style={styles.statNumber}>
            {notifications.filter(n => n.type === 'urgent').length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Urgentes</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Liste des notifications */}
      <ThemedView style={styles.notificationsList}>
        {notifications.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={primaryColor} />
            <ThemedText style={styles.emptyTitle}>Aucune notification</ThemedText>
            <ThemedText style={styles.emptyText}>
              Vous recevrez des notifications lorsque quelqu'un scannera votre QR code
            </ThemedText>
          </ThemedView>
        ) : (
          notifications.map((notification) => (
            <ThemedView
              key={notification.id}
              style={[
                styles.notificationCard,
                { 
                  backgroundColor: cardColor, 
                  borderColor,
                  borderLeftColor: getNotificationColor(notification.type),
                  borderLeftWidth: 4,
                }
              ]}
            >
              <ThemedView style={styles.notificationHeader}>
                <ThemedView style={styles.notificationIcon}>
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={24}
                    color={getNotificationColor(notification.type)}
                  />
                </ThemedView>
                
                <ThemedView style={styles.notificationContent}>
                  <ThemedView style={styles.notificationTitleRow}>
                    <ThemedText style={[
                      styles.notificationTitle,
                      !notification.isRead && styles.unreadTitle
                    ]}>
                      {notification.title}
                    </ThemedText>
                    {!notification.isRead && (
                      <ThemedView style={[styles.unreadDot, { backgroundColor: primaryColor }]} />
                    )}
                  </ThemedView>
                  
                  <ThemedText style={styles.notificationMessage}>
                    {notification.message}
                  </ThemedText>
                  
                  <ThemedText style={styles.vehicleInfo}>
                    {notification.vehicle}
                  </ThemedText>
                  
                  {notification.location && (
                    <ThemedView style={styles.locationRow}>
                      <Ionicons name="location-outline" size={16} color={primaryColor} />
                      <ThemedText style={styles.locationText}>
                        {notification.location}
                      </ThemedText>
                    </ThemedView>
                  )}
                  
                  <ThemedText style={styles.timestamp}>
                    {formatTimestamp(notification.timestamp)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.notificationActions}>
                {!notification.isRead && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: primaryColor }]}
                    onPress={() => handleMarkAsRead(notification.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                    <ThemedText style={styles.actionButtonText}>Marquer lu</ThemedText>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: errorColor }]}
                  onPress={() => handleDeleteNotification(notification.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  notificationsList: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  notificationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  vehicleInfo: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.7,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.5,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
