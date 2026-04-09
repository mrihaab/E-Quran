import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { BookMarked, Video, BookOpen, Clock, Edit, Trash2, Users, Plus, X, Check } from 'lucide-react';
import { View, UserRole } from '../types';
import { getClasses, getTeacherClasses, deleteClass } from '../api';
import { useAppSelector } from '../store/hooks';
import { useToast } from '../contexts/ToastContext';

export const StudentClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getClasses();
        setClasses(data.classes || data || []);
      } catch (err) { /* fallback empty */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const displayClasses = classes.length > 0 ? classes.map((cls: any) => ({
    title: cls.name || cls.title,
    teacher: cls.teacher_name || 'Teacher',
    time: cls.schedule || 'TBD',
    platform: cls.platform || 'Zoom',
    live: cls.status === 'active',
    img: `https://picsum.photos/seed/quran${cls.id}/400/300`
  })) : [
    { title: "Tajweed Essentials", teacher: "Sheikh Ahmed", time: "Daily at 10:00 AM", platform: "Zoom", live: true, img: "https://picsum.photos/seed/quran1/400/300" },
    { title: "Quran Memorization", teacher: "Hafiz Mustafa", time: "Mon-Wed at 4:00 PM", platform: "Portal Meet", live: false, img: "https://picsum.photos/seed/quran2/400/300" },
    { title: "Arabic Language 101", teacher: "Ustadha Fatima", time: "Tue-Thu at 2:00 PM", platform: "Private Link", live: false, img: "https://picsum.photos/seed/quran3/400/300" }
  ];

  return (
  <div className="flex h-screen overflow-hidden bg-background-light">
    <Sidebar currentView="student-classes" userRole="student" />
    <main className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader userRole="student" />
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">My Enrolled Classes</h2>
            <p className="text-slate-500 mt-1">Manage and join your ongoing Quranic studies.</p>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayClasses.map((cls, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-md transition-shadow group">
              <div className="h-48 bg-slate-200 relative overflow-hidden">
                <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={cls.img} referrerPolicy="no-referrer" />
                {cls.live && <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Live Now</div>}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{cls.title}</h3>
                    <p className="text-primary text-sm font-medium">{cls.teacher}</p>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <BookMarked className="size-5 text-primary" />
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="size-4" />
                    {cls.time}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Video className="size-4" />
                    {cls.platform}
                  </div>
                </div>
                <button className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${cls.live ? 'bg-primary text-white hover:shadow-lg hover:shadow-primary/20' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
                  {cls.live ? <Video className="size-4" /> : <BookOpen className="size-4" />}
                  {cls.live ? 'Join Class' : 'View Curriculum'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
  );
};

export const TeacherClasses = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { addToast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      const data = user?.id ? await getTeacherClasses(user.id) : await getClasses();
      const list = (data.classes || data || []).map((c: any) => ({
        id: c.id,
        title: c.name || c.title,
        level: c.level || 'Beginner',
        students: c.student_count || 0,
        time: c.schedule || 'TBD',
        platform: c.platform || 'Zoom',
        status: c.status === 'active' ? 'Active' : 'Scheduled'
      }));
      setClasses(list.length > 0 ? list : [
        { id: 1, title: "Tajweed Fundamentals", level: "Beginner", students: 12, time: "Mon, Wed 4:00 PM", platform: "Zoom", status: "Active" },
        { id: 2, title: "Quran Memorization", level: "Intermediate", students: 8, time: "Tue, Thu 5:30 PM", platform: "Teams", status: "Active" },
      ]);
    } catch (err) {
      setClasses([
        { id: 1, title: "Tajweed Fundamentals", level: "Beginner", students: 12, time: "Mon, Wed 4:00 PM", platform: "Zoom", status: "Active" },
      ]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleDelete = async (classId: number, title: string) => {
    try {
      await deleteClass(classId);
      addToast('success', 'Class Deleted', `${title} has been deleted.`);
      fetchClasses();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light">
      <Sidebar currentView="teacher-classes" userRole="teacher" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="teacher" />
        <div className="flex-1 p-8 overflow-y-auto">
          <header className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manage My Classes</h2>
              <p className="text-slate-500 mt-1">View, edit, and manage all your teaching classes.</p>
            </div>
          </header>
          <div className="grid grid-cols-1 gap-6">
            {classes.map((cls, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{cls.title}</h3>
                    <p className="text-slate-600 text-sm mt-1">Level: {cls.level}</p>
                  </div>
                  <span className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                    cls.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {cls.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Students</p>
                    <p className="text-2xl font-bold text-slate-900">{cls.students}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Schedule</p>
                    <p className="text-sm font-semibold text-slate-900">{cls.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Platform</p>
                    <p className="text-sm font-semibold text-slate-900">{cls.platform}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">ID</p>
                    <p className="text-sm font-semibold text-slate-900">#{cls.id}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => addToast('info', 'Edit Class', `Opening editor for: ${cls.title}`)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-colors">
                    <Edit className="size-4" />
                    Edit
                  </button>
                  <button onClick={() => addToast('info', 'Manage Students', `Managing students for: ${cls.title}`)} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 font-semibold rounded-lg hover:bg-purple-100 transition-colors">
                    <Users className="size-4" />
                    Manage Students ({cls.students})
                  </button>
                  <button onClick={() => handleDelete(cls.id, cls.title)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 transition-colors ml-auto">
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
