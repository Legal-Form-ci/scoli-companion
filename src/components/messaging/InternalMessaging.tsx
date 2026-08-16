import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, User, Clock, Loader2, X, Inbox, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  content: string;
  is_read: boolean | null;
  created_at: string | null;
  parent_id: string | null;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface InternalMessagingProps {
  isModeratorView?: boolean;
  customerId?: string;
  onClose?: () => void;
}

const InternalMessaging = ({ isModeratorView = false, customerId, onClose }: InternalMessagingProps) => {
  const { user, roles } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(customerId || null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [moderators, setModerators] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isModerator = roles.includes('moderator') || roles.includes('admin');

  const fetchProfiles = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;
    
    const uniqueIds = [...new Set(userIds)];
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', uniqueIds);
    
    if (data) {
      const profileMap: Record<string, Profile> = {};
      data.forEach(p => { profileMap[p.id] = p; });
      setProfiles(prev => ({ ...prev, ...profileMap }));
    }
  }, []);

  const fetchModerators = useCallback(async () => {
    const { data: modRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['moderator', 'admin']);
    
    if (modRoles && modRoles.length > 0) {
      const modIds = modRoles.map(r => r.user_id);
      const { data: modProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', modIds);
      
      if (modProfiles) {
        setModerators(modProfiles);
      }
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: messages, error } = await supabase
        .from('internal_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group messages by conversation partner
      const convMap: Record<string, Message[]> = {};
      const partnerIds: string[] = [];
      
      (messages || []).forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!convMap[partnerId]) {
          convMap[partnerId] = [];
          partnerIds.push(partnerId);
        }
        convMap[partnerId].push(msg);
      });

      await fetchProfiles(partnerIds);

      const convList: Conversation[] = Object.entries(convMap).map(([partnerId, msgs]) => {
        const lastMsg = msgs[msgs.length - 1];
        const unread = msgs.filter(m => m.recipient_id === user.id && !m.is_read).length;
        const profile = profiles[partnerId];
        
        return {
          partnerId,
          partnerName: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Utilisateur'
            : 'Utilisateur',
          lastMessage: lastMsg.content.substring(0, 50) + (lastMsg.content.length > 50 ? '...' : ''),
          lastMessageAt: lastMsg.created_at || '',
          unreadCount: unread,
          messages: msgs
        };
      });

      convList.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setConversations(convList);

      // Fetch moderators for customer view
      if (!isModerator) {
        await fetchModerators();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoading(false);
  }, [user, fetchProfiles, profiles, isModerator, fetchModerators]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('internal-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internal_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `sender_id=eq.${user.id}`
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation, conversations]);

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('internal_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      toast.success('Message envoyé');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi');
    }
    setSending(false);
  };

  const markAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    
    await supabase
      .from('internal_messages')
      .update({ is_read: true })
      .in('id', messageIds);
  };

  const handleSelectConversation = async (partnerId: string) => {
    setSelectedConversation(partnerId);
    
    // Mark messages as read
    const conv = conversations.find(c => c.partnerId === partnerId);
    if (conv && user) {
      const unreadIds = conv.messages
        .filter(m => m.recipient_id === user.id && !m.is_read)
        .map(m => m.id);
      await markAsRead(unreadIds);
      fetchMessages();
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getProfileName = (id: string) => {
    const p = profiles[id];
    if (!p) return 'Utilisateur';
    return `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Utilisateur';
  };

  const selectedMessages = conversations.find(c => c.partnerId === selectedConversation)?.messages || [];

  if (loading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          {isModerator ? 'Messagerie Client' : 'Contacter le Support'}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Inbox className="h-4 w-4" />
              Conversations
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Aucune conversation
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.partnerId}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                    selectedConversation === conv.partnerId ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleSelectConversation(conv.partnerId)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {conv.partnerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{conv.partnerName}</span>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* New conversation with moderator (for customers) */}
            {!isModerator && moderators.length > 0 && (
              <div className="p-3 border-t">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Contacter un modérateur
                </p>
                {moderators.map(mod => (
                  <div
                    key={mod.id}
                    className={`p-2 rounded cursor-pointer hover:bg-muted/50 text-sm ${
                      selectedConversation === mod.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(mod.id)}
                  >
                    {`${mod.first_name || ''} ${mod.last_name || ''}`.trim() || mod.email || 'Modérateur'}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getProfileName(selectedConversation).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{getProfileName(selectedConversation)}</span>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {selectedMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isMe
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="self-end"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InternalMessaging;
