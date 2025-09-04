import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'urgent';
  title: string;
  message: string;
  vehicle: string;
  location?: string;
  timestamp: Date;
  isRead: boolean;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([
    // Données de démonstration
    {
      id: '1',
      type: 'urgent',
      title: 'Incident détecté',
      message: 'Votre véhicule a été heurté par un autre véhicule',
      vehicle: 'Renault Clio - AB-123-CD',
      location: 'Rue de la Paix, Paris',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Stationnement irrégulier',
      message: 'Votre véhicule gêne la circulation',
      vehicle: 'Renault Clio - AB-123-CD',
      location: 'Boulevard Saint-Germain, Paris',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: false,
    },
    {
      id: '3',
      type: 'info',
      title: 'Notification de test',
      message: 'Ceci est une notification de test pour vérifier le système',
      vehicle: 'Renault Clio - AB-123-CD',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isRead: true,
    },
  ]);

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const warningColor = useThemeColor({}, 'warning');
  const errorColor = useThemeColor({}, 'error');
  const successColor = useThemeColor({}, 'success');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animations en cascade pour les cartes
    cardAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 200 + (index * 100),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent': return errorColor;
      case 'warning': return warningColor;
      case 'info': return primaryColor;
      default: return primaryColor;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent': return 'alert-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'notifications';
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      
      {/* Header avec gradient violet moderne */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#4C1D95', '#7C3AED']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <LinearGradient
                    colors={[secondaryColor, '#FB923C']}
                    style={styles.badge}
                  >
                    <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
                  </LinearGradient>
                </View>
              )}
            </View>
            
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={handleMarkAllAsRead}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.markAllButtonGradient}
                >
                  <Ionicons name="checkmark-done" size={16} color="white" />
                  <ThemedText style={styles.markAllText}>Tout marquer</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Statistiques avec design sophistiqué */}
        <View style={styles.statsContainer}>
          <Animated.View
            style={[
              styles.statsRow,
              {
                opacity: cardAnimations[0],
                transform: [{
                  translateY: cardAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.statGradient}
              >
                <View style={[styles.statIcon, { backgroundColor: '#7C3AED' }]}>
                  <Ionicons name="notifications" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: '#7C3AED' }]}>
                  {notifications.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Total</ThemedText>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.statGradient}
              >
                <View style={[styles.statIcon, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="mail-unread" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: '#F59E0B' }]}>
                  {unreadCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Non lues</ThemedText>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.statGradient}
              >
                <View style={[styles.statIcon, { backgroundColor: '#EF4444' }]}>
                  <Ionicons name="alert-circle" size={20} color="white" />
                </View>
                <ThemedText style={[styles.statNumber, { color: '#EF4444' }]}>
                  {notifications.filter(n => n.type === 'urgent').length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Urgentes</ThemedText>
              </LinearGradient>
            </View>
          </Animated.View>
        </View>

        {/* Liste des notifications avec design premium */}
        <View style={styles.notificationsList}>
          {notifications.length === 0 ? (
            <Animated.View
              style={[
                styles.emptyState,
                {
                  opacity: cardAnimations[1],
                  transform: [{
                    translateY: cardAnimations[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0]
                    })
                  }]
                }
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.emptyStateGradient}
              >
                <View style={[styles.emptyIcon, { backgroundColor: '#7C3AED' }]}>
                  <Ionicons name="notifications-off" size={40} color="white" />
                </View>
                <ThemedText style={styles.emptyTitle}>Aucune notification</ThemedText>
                <ThemedText style={styles.emptyText}>
                  Vous recevrez des notifications lorsque quelqu&apos;un scannera votre QR code
                </ThemedText>
              </LinearGradient>
            </Animated.View>
          ) : (
            notifications.map((notification, index) => (
              <Animated.View
                key={notification.id}
                style={[
                  styles.notificationCardWrapper,
                  {
                    opacity: cardAnimations[(index % 3) + 1],
                    transform: [{
                      translateY: cardAnimations[(index % 3) + 1].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }]
                  }
                ]}
              >
                <View style={[
                  styles.notificationCard,
                  { 
                    borderLeftColor: getNotificationColor(notification.type),
                    borderLeftWidth: 4,
                  }
                ]}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.notificationGradient}
                  >
                    <View style={styles.notificationHeader}>
                      <View style={[
                        styles.notificationIcon, 
                        { backgroundColor: getNotificationColor(notification.type) }
                      ]}>
                        <Ionicons
                          name={getNotificationIcon(notification.type)}
                          size={20}
                          color="white"
                        />
                      </View>
                      
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationTitleRow}>
                          <ThemedText style={[
                            styles.notificationTitle,
                            !notification.isRead && styles.unreadTitle
                          ]}>
                            {notification.title}
                          </ThemedText>
                          {!notification.isRead && (
                            <View style={[styles.unreadDot, { backgroundColor: '#7C3AED' }]} />
                          )}
                        </View>
                        
                        <ThemedText style={styles.notificationMessage}>
                          {notification.message}
                        </ThemedText>
                        
                        <View style={styles.vehicleInfoContainer}>
                          <Ionicons name="car" size={16} color="#7C3AED" />
                          <ThemedText style={styles.vehicleInfo}>
                            {notification.vehicle}
                          </ThemedText>
                        </View>
                        
                        {notification.location && (
                          <View style={styles.locationRow}>
                            <Ionicons name="location" size={16} color="#6B7280" />
                            <ThemedText style={styles.locationText}>
                              {notification.location}
                            </ThemedText>
                          </View>
                        )}
                        
                        <View style={styles.timestampContainer}>
                          <Ionicons name="time" size={14} color="#9CA3AF" />
                          <ThemedText style={styles.timestamp}>
                            {formatTimestamp(notification.timestamp)}
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    <View style={styles.notificationActions}>
                      {!notification.isRead && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#7C3AED' }]}
                          onPress={() => handleMarkAsRead(notification.id)}
                        >
                          <LinearGradient
                            colors={['#7C3AED', '#5B21B6']}
                            style={styles.actionButtonGradient}
                          >
                            <Ionicons name="checkmark" size={16} color="white" />
                            <ThemedText style={styles.actionButtonText}>Marquer lu</ThemedText>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                        onPress={() => handleDeleteNotification(notification.id)}
                      >
                        <LinearGradient
                          colors={['#EF4444', '#DC2626']}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons name="trash" size={16} color="white" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  header: {
    // Animation handled by Animated.View
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgeContainer: {
    // Container for badge
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    borderRadius: 12,
  },
  markAllButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  markAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsContainer: {
    padding: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  statGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  notificationsList: {
    padding: 24,
  },
  emptyState: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  emptyStateGradient: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1F2937',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 22,
    fontSize: 16,
  },
  notificationCardWrapper: {
    marginBottom: 20,
  },
  notificationCard: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  notificationGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#1F2937',
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
    color: '#1F2937',
  },
  vehicleInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vehicleInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});