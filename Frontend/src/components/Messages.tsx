import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, DashboardHeader } from './Dashboard';
import { Search, Video, Phone, MoreVertical, Paperclip, Smile, Send, FileText, Download } from 'lucide-react';
import { UserRole } from '../types';
import { useAppSelector } from '../store/hooks';

export const StudentMessages = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role || 'student';
  const currentView = userRole === 'teacher' ? 'teacher-messages' : 'student-messages';

  return (
  <div className="flex h-screen overflow-hidden bg-background-light">
    <Sidebar currentView={currentView} userRole={userRole} />
    <main className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader userRole={userRole} />
      <div className="flex-1 flex overflow-hidden">
        <section className="w-80 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <input className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" placeholder="Search chats..." type="text" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {[
              { name: "Sheikh Ahmed", msg: "As-salamu alaykum, let's review.", time: "10:45 AM", active: true },
              { name: "Ustadh Fatima", msg: "New assignment posted.", time: "Yesterday", active: false }
            ].map((chat, i) => (
              <div key={i} className={`p-4 cursor-pointer flex gap-3 transition-colors ${chat.active ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}>
                <div className="relative shrink-0">
                  <img className="w-12 h-12 rounded-full object-cover" src={`https://picsum.photos/seed/teacher${i}/100/100`} referrerPolicy="no-referrer" />
                  {chat.active && <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 border-2 border-white rounded-full"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold truncate">{chat.name}</h3>
                    <span className="text-[10px] text-slate-500">{chat.time}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${chat.active ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{chat.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="flex-1 flex flex-col bg-white">
          <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <img className="w-10 h-10 rounded-full object-cover" src="https://picsum.photos/seed/teacher0/100/100" referrerPolicy="no-referrer" />
              <div>
                <h3 className="text-sm font-bold leading-none">Sheikh Ahmed</h3>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <button className="hover:text-blue-600 transition-colors"><Video className="size-5" /></button>
              <button className="hover:text-blue-600 transition-colors"><Phone className="size-5" /></button>
              <button className="hover:text-blue-600 transition-colors"><MoreVertical className="size-5" /></button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            <div className="flex gap-3 max-w-[80%]">
              <img className="w-8 h-8 rounded-full shrink-0 mt-auto" src="https://picsum.photos/seed/teacher0/100/100" referrerPolicy="no-referrer" />
              <div className="bg-white text-slate-800 p-3 rounded-xl rounded-bl-none shadow-sm border border-slate-100">
                <p className="text-sm">As-salamu alaykum, Ahmed. Ready for today's session?</p>
                <span className="text-[10px] text-slate-500 mt-1 block">10:30 AM</span>
              </div>
            </div>
            <div className="flex flex-row-reverse gap-3 max-w-[80%] ml-auto">
              <img className="w-8 h-8 rounded-full shrink-0 mt-auto" src="https://picsum.photos/seed/ahmed/100/100" referrerPolicy="no-referrer" />
              <div className="bg-blue-600 text-white p-3 rounded-xl rounded-br-none shadow-sm">
                <p className="text-sm">Wa Alaykumu s-salam, Sheikh. Yes, I am ready.</p>
                <span className="text-[10px] text-white/80 mt-1 block text-right">10:32 AM</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2 max-w-5xl mx-auto">
              <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Paperclip className="size-5" /></button>
              <div className="flex-1 relative">
                <input className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50" placeholder="Type your message..." type="text" />
              </div>
              <button className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-md">
                <Send className="size-5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
  );
};
