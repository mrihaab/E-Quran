import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, DashboardHeader } from './Dashboard';
import { Search, Video, Phone, MoreVertical, Paperclip, Smile, Send, FileText, Download, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { useAppSelector } from '../store/hooks';
import { getConversations, getMessages, sendMessage, markMessageRead } from '../api';
import { useToast } from '../contexts/ToastContext';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  useEffect(() => {
    if (!userId) return;
    const fetchConversations = async () => {
      try {
        const data = await getConversations(userId);
        setConversations(data.conversations || []);
        // Auto-select first conversation if available
        if ((data.conversations || []).length > 0 && !selectedPartner) {
          setSelectedPartner(data.conversations[0]);
        }
      } catch (err: any) {
        // Fallback: show empty state
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [userId]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!userId || !selectedPartner) return;
    const fetchMsgs = async () => {
      try {
        const data = await getMessages(userId);
        // Filter messages for selected conversation partner
        const filtered = (data.messages || []).filter(
          (m: Message) =>
            (m.sender_id === selectedPartner.partner_id && m.receiver_id === userId) ||
            (m.sender_id === userId && m.receiver_id === selectedPartner.partner_id)
        );
        setMessages(filtered);

        // Mark unread messages as read
        for (const msg of filtered) {
          if (msg.receiver_id === userId && !msg.is_read) {
            try { await markMessageRead(msg.id); } catch { /* silent */ }
          }
        }
      } catch (err: any) {
        setMessages([]);
      }
    };
    fetchMsgs();
  }, [userId, selectedPartner]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartner || !userId) return;
    setSending(true);
    try {
      await sendMessage(selectedPartner.partner_id, newMessage.trim());
      setNewMessage('');
      // Refresh messages
      const data = await getMessages(userId);
      const filtered = (data.messages || []).filter(
        (m: Message) =>
          (m.sender_id === selectedPartner.partner_id && m.receiver_id === userId) ||
          (m.sender_id === userId && m.receiver_id === selectedPartner.partner_id)
      );
      setMessages(filtered);
      // Refresh conversations too (to update last message)
      const convData = await getConversations(userId);
      setConversations(convData.conversations || []);
    } catch (err: any) {
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

  const formatTime = (dateStr: string) => {
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
            <h2 className="text-xl font-bold mb-4">Messages</h2>
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
                <p className="text-slate-500 text-sm">No conversations yet. Send a message to start a chat!</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.partner_id}
                  onClick={() => setSelectedPartner(conv)}
                  className={`p-4 cursor-pointer flex gap-3 transition-colors ${
                    selectedPartner?.partner_id === conv.partner_id
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      className="w-12 h-12 rounded-full object-cover"
                      src={conv.partner_image || `https://picsum.photos/seed/user${conv.partner_id}/100/100`}
                      referrerPolicy="no-referrer"
                    />
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unread_count}
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
                    src={selectedPartner.partner_image || `https://picsum.photos/seed/user${selectedPartner.partner_id}/100/100`}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-sm font-bold leading-none">{selectedPartner.partner_name}</h3>
                    <p className="text-xs text-slate-500 capitalize mt-1">{selectedPartner.partner_role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <button className="hover:text-blue-600 transition-colors"><Video className="size-5" /></button>
                  <button className="hover:text-blue-600 transition-colors"><Phone className="size-5" /></button>
                  <button className="hover:text-blue-600 transition-colors"><MoreVertical className="size-5" /></button>
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
                      <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMine ? 'flex-row-reverse ml-auto' : ''}`}>
                        <img
                          className="w-8 h-8 rounded-full shrink-0 mt-auto"
                          src={
                            isMine
                              ? (msg.sender_image || `https://picsum.photos/seed/user${msg.sender_id}/100/100`)
                              : (msg.sender_image || `https://picsum.photos/seed/user${msg.sender_id}/100/100`)
                          }
                          referrerPolicy="no-referrer"
                        />
                        <div className={`p-3 rounded-xl shadow-sm ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <span className={`text-[10px] mt-1 block ${isMine ? 'text-white/80 text-right' : 'text-slate-500'}`}>
                            {formatTime(msg.created_at)}
                          </span>
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
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Paperclip className="size-5" /></button>
                  <div className="flex-1 relative">
                    <input
                      className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50"
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
                    className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
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
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  </div>
  );
};
