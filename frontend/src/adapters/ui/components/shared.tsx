import type { ReactNode, ButtonHTMLAttributes, SelectHTMLAttributes, InputHTMLAttributes } from 'react';

// ─── Badge ─────────────────────────────────────────────────────────────────
interface BadgeProps { children: ReactNode; variant?: 'green' | 'red' | 'blue' | 'gray' }
export function Badge({ children, variant = 'gray' }: BadgeProps) {
  const cls = {
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    blue: 'bg-ocean-500/20 text-ocean-300 border-ocean-500/30',
    gray: 'bg-slate-600/30 text-slate-300 border-slate-500/30',
  }[variant];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {children}
    </span>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────
interface KpiCardProps { label: string; value: string | number; sub?: string; positive?: boolean }
export function KpiCard({ label, value, sub, positive }: KpiCardProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${positive === true ? 'text-emerald-400' : positive === false ? 'text-red-400' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Spinner ───────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-ocean-500/30 border-t-ocean-400 rounded-full animate-spin" />
    </div>
  );
}

// ─── Alert ─────────────────────────────────────────────────────────────────
interface AlertProps { message: string; variant?: 'error' | 'success' }
export function Alert({ message, variant = 'error' }: AlertProps) {
  const cls = variant === 'error'
    ? 'bg-red-500/10 border-red-500/30 text-red-300'
    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${cls}`}>{message}</div>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
}
export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const variants = {
    primary: 'bg-ocean-600 hover:bg-ocean-500 text-white shadow-lg shadow-ocean-900/30',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600',
    danger: 'bg-red-600/80 hover:bg-red-500 text-white',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  );
}

// ─── Select ────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label: string }
export function Select({ label, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 uppercase tracking-wider">{label}</label>
      <select
        className={`bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean-500 focus:border-transparent outline-none ${className}`}
        {...props}
      />
    </div>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label: string }
export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 uppercase tracking-wider">{label}</label>
      <input
        className={`bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-ocean-500 focus:border-transparent outline-none placeholder-slate-500 ${className}`}
        {...props}
      />
    </div>
  );
}

// ─── Table shell ───────────────────────────────────────────────────────────
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  );
}
export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800/80 border-b border-slate-700/50">
      {children}
    </th>
  );
}
export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 border-b border-slate-700/30 text-slate-200 ${className}`}>
      {children}
    </td>
  );
}
