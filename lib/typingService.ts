import { supabase } from './supabase';

export interface TypingUser {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  lastTypingAt: string;
}

export class TypingService {
  private static typingUsers = new Map<string, TypingUser>();
  private static typingTimeouts = new Map<string, NodeJS.Timeout>();

  // Démarrer l'indicateur de frappe
  static startTyping(conversationId: string, userId: string) {
    const key = `${conversationId}-${userId}`;
    
    // Mettre à jour l'état local
    this.typingUsers.set(key, {
      userId,
      conversationId,
      isTyping: true,
      lastTypingAt: new Date().toISOString(),
    });

    // Publier l'événement de frappe
    this.publishTypingEvent(conversationId, userId, true);

    // Nettoyer l'ancien timeout
    const existingTimeout = this.typingTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Arrêter automatiquement après 3 secondes d'inactivité
    const timeout = setTimeout(() => {
      this.stopTyping(conversationId, userId);
    }, 3000);

    this.typingTimeouts.set(key, timeout);
  }

  // Arrêter l'indicateur de frappe
  static stopTyping(conversationId: string, userId: string) {
    const key = `${conversationId}-${userId}`;
    
    // Nettoyer le timeout
    const timeout = this.typingTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(key);
    }

    // Mettre à jour l'état local
    this.typingUsers.set(key, {
      userId,
      conversationId,
      isTyping: false,
      lastTypingAt: new Date().toISOString(),
    });

    // Publier l'événement d'arrêt de frappe
    this.publishTypingEvent(conversationId, userId, false);
  }

  // Publier un événement de frappe via Supabase Realtime
  private static async publishTypingEvent(conversationId: string, userId: string, isTyping: boolean) {
    try {
      await supabase
        .channel(`typing:${conversationId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId,
            conversationId,
            isTyping,
            timestamp: new Date().toISOString(),
          },
        });
    } catch (error) {
      console.error('Erreur publication événement frappe:', error);
    }
  }

  // S'abonner aux événements de frappe
  static subscribeToTyping(
    conversationId: string,
    onTypingChange: (typingUsers: TypingUser[]) => void
  ) {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          const { userId, isTyping } = payload.payload;
          const key = `${conversationId}-${userId}`;
          
          if (isTyping) {
            this.typingUsers.set(key, {
              userId,
              conversationId,
              isTyping: true,
              lastTypingAt: new Date().toISOString(),
            });
          } else {
            this.typingUsers.delete(key);
          }

          // Retourner tous les utilisateurs en train de taper (sauf soi-même)
          const typingUsers = Array.from(this.typingUsers.values())
            .filter(user => user.conversationId === conversationId && user.isTyping);
          
          onTypingChange(typingUsers);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  // Nettoyer les timeouts expirés
  static cleanupExpiredTyping() {
    const now = new Date();
    const expiredKeys: string[] = [];

    this.typingUsers.forEach((user, key) => {
      const lastTyping = new Date(user.lastTypingAt);
      const diffInSeconds = (now.getTime() - lastTyping.getTime()) / 1000;
      
      if (diffInSeconds > 5) { // 5 secondes d'inactivité
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      const user = this.typingUsers.get(key);
      if (user) {
        this.stopTyping(user.conversationId, user.userId);
      }
    });
  }
}
