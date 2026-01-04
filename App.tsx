
import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_ROADMAP } from './constants';
import { Weekend, Assignment } from './types';
import { getNextWeekendSuggestion } from './geminiService';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  LogOut, 
  Layout, 
  BarChart3,
  Calendar,
  Plus,
  Trash2,
  Wand2,
  Loader2
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [weekends, setWeekends] = useState<Weekend[]>(INITIAL_ROADMAP);
  const [expandedWeekend, setExpandedWeekend] = useState<number>(1);
  const [loadingSuggestion, setLoadingSuggestion] = useState<number | null>(null);
  const [authEmail, setAuthEmail] = useState('');

  // Persist data
  useEffect(() => {
    const saved = localStorage.getItem(`ai_res_v3_${user}`);
    if (saved && user) {
      setWeekends(JSON.parse(saved));
    } else if (user) {
      setWeekends(INITIAL_ROADMAP);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`ai_res_v3_${user}`, JSON.stringify(weekends));
    }
  }, [weekends, user]);

  const stats = useMemo(() => {
    // Progress based on 10 weekend timeline (how many weekends are fully completed)
    const completedWeekendsCount = weekends.filter(w => 
      w.assignments.length > 0 && w.assignments.every(a => a.completed)
    ).length;
    
    const totalAssignments = weekends.reduce((acc, w) => acc + w.assignments.length, 0);
    const completedAssignments = weekends.reduce((acc, w) => acc + w.assignments.filter(a => a.completed).length, 0);
    const time = weekends.reduce((acc, w) => acc + w.assignments.reduce((sum, a) => sum + a.timeSpent, 0), 0);
    
    return {
      timelinePercentage: Math.round((completedWeekendsCount / 10) * 100),
      weekendsDone: completedWeekendsCount,
      totalTasks: totalAssignments,
      tasksDone: completedAssignments,
      timeHours: (time / 60).toFixed(1)
    };
  }, [weekends]);

  const handleAddAssignment = (weekendId: number, title = "New Assignment", description = "Click to edit description") => {
    const newId = `${weekendId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newAssignment: Assignment = {
      id: newId,
      title,
      description,
      completed: false,
      notes: "",
      timeSpent: 0
    };

    setWeekends(prev => prev.map(w => 
      w.id === weekendId 
        ? { ...w, assignments: [...w.assignments, newAssignment] }
        : w
    ));
  };

  const handleSuggestForWeekend = async (weekendId: number) => {
    setLoadingSuggestion(weekendId);
    const completedOnes = weekends.filter(w => w.assignments.some(a => a.completed));
    const res = await getNextWeekendSuggestion(completedOnes, weekendId);
    
    if (res.suggestedTasks) {
      res.suggestedTasks.forEach(task => {
        handleAddAssignment(weekendId, task.title, task.description);
      });
    }
    setExpandedWeekend(weekendId);
    setLoadingSuggestion(null);
  };

  const handleDeleteAssignment = (weekendId: number, assignmentId: string) => {
    setWeekends(prev => prev.map(w => 
      w.id === weekendId 
        ? { ...w, assignments: w.assignments.filter(a => a.id !== assignmentId) }
        : w
    ));
  };

  const handleToggleAssignment = (weekendId: number, assignmentId: string) => {
    setWeekends(prev => prev.map(w => {
      if (w.id === weekendId) {
        return {
          ...w,
          assignments: w.assignments.map(a => 
            a.id === assignmentId ? { ...a, completed: !a.completed } : a
          )
        };
      }
      return w;
    }));
  };

  const handleUpdateAssignment = (weekendId: number, assignmentId: string, updates: Partial<Assignment>) => {
    setWeekends(prev => prev.map(w => {
      if (w.id === weekendId) {
        return {
          ...w,
          assignments: w.assignments.map(a => 
            a.id === assignmentId ? { ...a, ...updates } : a
          )
        };
      }
      return w;
    }));
  };

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (authEmail.trim()) setUser(authEmail);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-white/10">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-4 rounded-full">
              <Sparkles className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">AI Resolution</h1>
          <p className="text-center text-slate-500 mb-8">10 Weekends to AI Mastery.</p>
          <form onSubmit={login} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-sm"
                placeholder="Enter your email to sync progress"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all"
            >
              Start Your Journey
            </button>
          </form>
          <p className="mt-8 text-xs text-center text-slate-400 font-medium">
            Personalize your curriculum weekend by weekend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-xl tracking-tight">AI Resolver</span>
          </div>
          <div className="flex items-center gap-3">
             <span className="hidden sm:inline text-xs font-medium text-slate-500">{user}</span>
             <button onClick={() => setUser(null)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* Timeline Progress Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BarChart3 className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Resolution Progress</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-indigo-600">{stats.timelinePercentage}%</span>
                <span className="text-slate-400 font-medium">Timeline Complete</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 md:text-right">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Weekends Done</p>
                <p className="text-xl font-bold text-slate-700">{stats.weekendsDone} / 10</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Total Lab Hours</p>
                <p className="text-xl font-bold text-slate-700">{stats.timeHours}h</p>
              </div>
            </div>
          </div>
          <div className="mt-8 relative">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                style={{ width: `${stats.timelinePercentage}%` }}
              />
            </div>
            {/* Markers for 10 weekends */}
            <div className="absolute top-0 w-full h-4 flex justify-between pointer-events-none px-[1px]">
              {[...Array(11)].map((_, i) => (
                <div key={i} className="h-full w-px bg-white/40" />
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400 text-center font-medium">
            Progress tracked by weekends where 100% of defined assignments are checked off.
          </p>
        </section>

        {/* Roadmap List */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Curriculum Planner
          </h3>
          
          <div className="space-y-3">
            {weekends.map((weekend) => {
              const isWeekendComplete = weekend.assignments.length > 0 && weekend.assignments.every(a => a.completed);
              
              return (
                <div 
                  key={weekend.id}
                  className={`bg-white rounded-xl border transition-all ${
                    expandedWeekend === weekend.id ? 'border-indigo-300 ring-4 ring-indigo-50 shadow-md' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center pr-4">
                    <button 
                      onClick={() => setExpandedWeekend(expandedWeekend === weekend.id ? 0 : weekend.id)}
                      className="flex-grow px-5 py-4 flex items-center text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                          isWeekendComplete 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-100' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          W{weekend.id}
                        </div>
                        <div>
                          <input 
                            type="text"
                            value={weekend.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setWeekends(prev => prev.map(w => w.id === weekend.id ? {...w, title: e.target.value} : w))}
                            className="font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 w-full"
                          />
                          <p className="text-xs font-medium text-slate-400">
                            {weekend.assignments.length} assignments • {weekend.assignments.filter(a => a.completed).length} done
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {weekend.assignments.length === 0 && (
                        <button 
                          onClick={() => handleSuggestForWeekend(weekend.id)}
                          disabled={loadingSuggestion !== null}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {loadingSuggestion === weekend.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                          )}
                          Suggest
                        </button>
                      )}
                      <button 
                        onClick={() => handleAddAssignment(weekend.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        title="Add Assignment"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      {expandedWeekend === weekend.id ? <ChevronDown className="w-5 h-5 text-slate-300" /> : <ChevronRight className="w-5 h-5 text-slate-300" />}
                    </div>
                  </div>

                  {expandedWeekend === weekend.id && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-50 space-y-6">
                      {weekend.assignments.length === 0 && (
                        <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                          <p className="text-sm text-slate-400 font-medium mb-3">Your weekend is currently empty.</p>
                          <div className="flex justify-center gap-3">
                            <button 
                              onClick={() => handleAddAssignment(weekend.id)}
                              className="text-xs bg-white border border-slate-200 px-4 py-2 rounded-lg font-bold text-slate-600 hover:border-indigo-300 shadow-sm"
                            >
                              Add Manually
                            </button>
                            <button 
                              onClick={() => handleSuggestForWeekend(weekend.id)}
                              className="text-xs bg-indigo-600 px-4 py-2 rounded-lg font-bold text-white hover:bg-indigo-700 flex items-center gap-1 shadow-md shadow-indigo-100"
                            >
                              <Sparkles className="w-3 h-3" /> Use AI Suggestion
                            </button>
                          </div>
                        </div>
                      )}
                      {weekend.assignments.map((assignment) => (
                        <div key={assignment.id} className="group relative bg-slate-50/30 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all shadow-sm">
                          <div className="flex gap-4">
                            <button 
                              onClick={() => handleToggleAssignment(weekend.id, assignment.id)}
                              className={`mt-1 flex-shrink-0 transition-all ${assignment.completed ? 'text-green-500 scale-110' : 'text-slate-300 hover:text-indigo-400'}`}
                            >
                              {assignment.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </button>
                            <div className="flex-grow space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="w-full pr-6">
                                  <input 
                                    className={`font-bold bg-transparent border-none outline-none focus:ring-0 w-full text-lg ${assignment.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                    value={assignment.title}
                                    onChange={(e) => handleUpdateAssignment(weekend.id, assignment.id, { title: e.target.value })}
                                  />
                                  <input 
                                    className="text-sm text-slate-500 bg-transparent border-none outline-none focus:ring-0 w-full italic"
                                    value={assignment.description}
                                    placeholder="Task details..."
                                    onChange={(e) => handleUpdateAssignment(weekend.id, assignment.id, { description: e.target.value })}
                                  />
                                </div>
                                <button 
                                  onClick={() => handleDeleteAssignment(weekend.id, assignment.id)}
                                  className="text-slate-300 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm focus-within:ring-1 focus-within:ring-indigo-100 transition-all">
                                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                    <Clock className="w-3 h-3" /> Lab Time (Minutes)
                                  </label>
                                  <input 
                                    type="number"
                                    value={assignment.timeSpent || ''}
                                    onChange={(e) => handleUpdateAssignment(weekend.id, assignment.id, { timeSpent: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-transparent font-bold text-slate-700 outline-none"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm focus-within:ring-1 focus-within:ring-indigo-100 transition-all">
                                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                    Completion Notes
                                  </label>
                                  <textarea 
                                    value={assignment.notes}
                                    onChange={(e) => handleUpdateAssignment(weekend.id, assignment.id, { notes: e.target.value })}
                                    className="w-full bg-transparent text-sm text-slate-600 outline-none resize-none"
                                    placeholder="Obstacles, breakthroughs..."
                                    rows={1}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex justify-between items-center z-40">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Overall Progress</span>
          <span className="font-bold text-indigo-600 text-lg">{stats.timelinePercentage}% Timeline</span>
        </div>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl active:scale-95 transition-transform"
        >
          <Layout className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default App;
