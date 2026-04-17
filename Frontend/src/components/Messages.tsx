import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, DashboardHeader } from './Dashboard';
import { Search, Video, Phone, MoreVertical, Paperclip, Smile, Send, Loader2, Plus, Trash2 } from 'lucide-react';
import { UserRole } from '../types';
import { useAppSelector } from '../store/hooks';
import { getConversations, getMessages, sendMessage, markMessageRead, deleteMessage } from '../api';
import { useToast } from '../contexts/ToastContext';
import { UserDirectory } from './UserDirectory';

interface Conversation {
  partner_id: number;
  partner_name: string;
  partner_image: string | null;
  partner_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_image: string | null;
  receiver_name: string;
  receiver_image: string | null;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  profile_image: string | null;
  status: string;
  created_at: string;
}

export const StudentMessages = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { addToast } = useToast();
  const userRole = user?.role || 'student';
  const currentView = userRole === 'teacher' ? 'teacher-messages' : 'student-messages';
  const userId = user?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDirectory, setShowUserDirectory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  const fetchConversations = async () => {
    if (!userId) return;
    try {
      // getConversations() takes no arguments — uses logged-in user from JWT
      const data = await getConversations();
      const convList: Conversation[] = data?.conversations || [];
      setConversations(convList);
      // Auto-select first conversation if none selected
      if (convList.length > 0 && !selectedPartner) {
        setSelectedPartner(convList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err.message);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [userId]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!userId || !selectedPartner) return;
    const fetchMsgs = async () => {
      try {
        // getMessages(partnerId) — pass the PARTNER's ID, not our own
        const data = await getMessages(selectedPartner.partner_id);
        setMessages(data?.messages || []);

        // Mark all messages from partner as read in one call
        await markMessageRead(selectedPartner.partner_id).catch(() => {});
        
        // Update unread count in conversations list
        setConversations(prev => prev.map(c =>
          c.partner_id === selectedPartner.partner_id ? { ...c, unread_count: 0 } : c
        ));
      } catch (err: any) {
        console.error('Failed to load messages:', err.message);
        setMessages([]);
      }
    };
    fetchMsgs();
  }, [userId, selectedPartner?.partner_id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartner || !userId) return;
    setSending(true);
    const msgContent = newMessage.trim();
    setNewMessage('');

    // Optimistic UI update
    const optimisticMsg: Message = {
      id: Date.now(),
      sender_id: userId,
      receiver_id: selectedPartner.partner_id,
      content: msgContent,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: user?.name || '',
      sender_image: user?.profileImage || null,
      receiver_name: selectedPartner.partner_name,
      receiver_image: selectedPartner.partner_image,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await sendMessage(selectedPartner.partner_id, msgContent);
      // Refresh conversations to update last message preview
      fetchConversations();
      // Refresh messages to get server-side IDs
      const data = await getMessages(selectedPartner.partner_id);
      setMessages(data?.messages || []);
    } catch (err: any) {
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMessage(msgContent);
      addToast('error', 'Send Failed', err.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete message.');
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffHours < 48) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(c =>
    c.partner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
  <div className="flex h-screen overflow-hidden bg-background-light">
    <Sidebar currentView={currentView} userRole={userRole} />
    <main className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader userRole={userRole} />
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <section className="w-80 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Messages</h2>
              <button
                onClick={() => setShowUserDirectory(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="New Message"
              >
                <Plus className="size-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                placeholder="Search chats..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 text-blue-600 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Send className="size-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No conversations yet.</p>
                <p className="text-slate-400 text-xs mt-1">Click the + button to start a chat!</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.partner_id}
                  onClick={() => setSelectedPartner(conv)}
                  className={`p-4 cursor-pointer flex gap-3 transition-colors ${
                    selectedPartner?.partner_id === conv.partner_id
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      className="w-12 h-12 rounded-full object-cover"
                      src={conv.partner_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.partner_name)}&background=random&size=100`}
                      alt={conv.partner_name}
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.partner_name)}&background=random&size=100`; }}
                    />
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold truncate">{conv.partner_name}</h3>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {conv.last_message_time ? formatTime(conv.last_message_time) : ''}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      {conv.last_message || 'No messages yet'}
                    </p>
                    <span className="text-[10px] text-slate-400 capitalize">{conv.partner_role}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Chat Area */}
        <section className="flex-1 flex flex-col bg-white">
          {selectedPartner ? (
            <>
              {/* Chat Header */}
              <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    className="w-10 h-10 rounded-full object-cover"
                    src={selectedPartner.partner_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPartner.partner_name)}&background=random&size=100`}
                    alt={selectedPartner.partner_name}
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPartner.partner_name)}&background=random&size=100`; }}
                  />
                  <div>
                    <h3 className="text-sm font-bold leading-none">{selectedPartner.partner_name}</h3>
                    <p className="text-xs text-slate-500 capitalize mt-1">{selectedPartner.partner_role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <button className="hover:text-blue-600 transition-colors" title="Video Call">
                    <Video className="size-5" />
                  </button>
                  <button className="hover:text-blue-600 transition-colors" title="Voice Call">
                    <Phone className="size-5" />
                  </button>
                  <button className="hover:text-blue-600 transition-colors" title="More Options">
                    <MoreVertical className="size-5" />
                  </button>
                </div>
              </header>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === userId;
                    return (
                      <div key={msg.id} className={`flex gap-3 max-w-[80%] group ${isMine ? 'flex-row-reverse ml-auto' : ''}`}>
                        <img
                          className="w-8 h-8 rounded-full shrink-0 mt-auto object-cover"
                          src={
                            isMine
                              ? (user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=random&size=100`)
                              : (msg.sender_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender_name || '')}&background=random&size=100`)
                          }
                          alt={isMine ? 'You' : msg.sender_name}
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=User&background=random&size=100`; }}
                        />
                        <div className="relative">
                          <div className={`p-3 rounded-xl shadow-sm ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <span className={`text-[10px] mt-1 block ${isMine ? 'text-white/80 text-right' : 'text-slate-500'}`}>
                              {formatTime(msg.created_at)}
                              {isMine && msg.is_read && <span className="ml-1">✓✓</span>}
                              {isMine && !msg.is_read && <span className="ml-1">✓</span>}
                            </span>
                          </div>
                          {/* Delete button (only for sender) */}
                          {isMine && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="absolute -top-2 -left-6 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-full shadow text-red-400 hover:text-red-600"
                              title="Delete message"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-2 max-w-5xl mx-auto">
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Attach file">
                    <Paperclip className="size-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="Type your message..."
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send message"
                  >
                    {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Send className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a conversation</h3>
                <p className="text-slate-500 text-sm">Choose a chat from the sidebar to start messaging.</p>
                <button
                  onClick={() => setShowUserDirectory(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Start a New Chat
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>

    {/* User Directory Modal */}
    <UserDirectory
      isOpen={showUserDirectory}
      onClose={() => setShowUserDirectory(false)}
      onSelectUser={(user: User) => {
        setShowUserDirectory(false);
        const newConversation: Conversation = {
          partner_id: user.id,
          partner_name: user.full_name,
          partner_image: user.profile_image,
          partner_role: user.role,
          last_message: '',
          last_message_time: '',
          unread_count: 0
        };

        setConversations(prev => {
          const exists = prev.find(c => c.partner_id === user.id);
          if (exists) {
            setSelectedPartner(exists);
            return prev;
          }
          setSelectedPartner(newConversation);
          return [newConversation, ...prev];
        });
      }}
    />
  </div>
  );
};
