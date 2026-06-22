import React, { useState } from 'react';
import { ShieldAlert, LogIn, Lock, User, Terminal, CheckCircle2 } from 'lucide-react';
import { Operator } from '../types';

interface LoginViewProps {
  operators: Operator[];
  onLogin: (operator: Operator) => void;
}

export default function LoginView({ operators, onLogin }: LoginViewProps) {
  // Only allow active users to log in
  const activeOperators = operators.filter(op => op.status === 'Active');
  
  const [selectedUserId, setSelectedUserId] = useState<string>(
    activeOperators.length > 0 ? activeOperators[0].id : ''
  );
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetOp = operators.find(op => op.id === selectedUserId);
    if (!targetOp) {
      setErrorMsg('Selected user not found');
      return;
    }

    if (targetOp.status !== 'Active') {
      setErrorMsg('This user profile is currently INACTIVE. Please contact administration.');
      return;
    }

    const expectedPass = targetOp.password || '123'; // Default to '123' if not specified
    if (password === expectedPass) {
      // Success!
      onLogin(targetOp);
    } else {
      setErrorMsg('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Absolute ambient lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative z-10">
        {/* Lock / Security header banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-805 p-6 text-white text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-550/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black font-display tracking-tight text-white uppercase">Saudi Retail POS terminal</h1>
            <p className="text-[10px] text-slate-300 font-medium">ZATCA B2C Simplified Invoicing Sandbox Hub</p>
          </div>
        </div>

        {/* Login form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-start gap-2 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-650 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User selection dropdown */}
          <div className="space-y-1">
            <label className="block text-[10px] text-slate-500 font-extrabold uppercase">Choose Operator Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User className="w-4 h-4" /></span>
              <select
                className="w-full text-xs font-semibold border rounded-lg p-3 pl-10 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setErrorMsg('');
                }}
                required
              >
                {activeOperators.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.name} ({op.role})
                  </option>
                ))}
                {activeOperators.length === 0 && (
                  <option value="">No active users enrolled</option>
                )}
              </select>
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="block text-[10px] text-slate-500 font-extrabold uppercase">Security Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="w-4 h-4" /></span>
              <input
                type="password"
                required
                placeholder="Insert password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full text-xs font-mono font-bold border rounded-lg p-3 pl-10 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Hint details */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[9.5px] text-slate-450 font-bold">
              Default administrator: <span className="text-slate-800 font-mono">admin / admin</span>
            </span>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>AUTHENTICATE AND BOOT IN</span>
          </button>
        </form>

        {/* Form bottom decorative footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-center gap-1 text-[9px] text-slate-400 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Fitted with Cryptographic CSID compliance validations</span>
        </div>
      </div>
    </div>
  );
}
