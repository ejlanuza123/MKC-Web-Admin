// src/pages/AuditLogs.jsx
import React, { useState } from 'react';
import AdminLogsViewer from '../components/AdminLogsViewer';
import SearchBar from '../components/common/SearchBar';
import { useTheme } from '../context/ThemeContext';

const ENTITY_OPTIONS = [
  { value: 'all', label: 'All Entities' },
  { value: 'order', label: 'Order' },
  { value: 'product', label: 'Product' },
  { value: 'rider', label: 'Rider' },
  { value: 'customer', label: 'Customer' },
  { value: 'system', label: 'System' }
];

export default function AuditLogs() {
  const { isDarkMode } = useTheme();
  const [entityType, setEntityType] = useState('all');
  const [entityId, setEntityId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const cardClass = isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900';
  const inputClass = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400';
  const mutedTextClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  const applyDatePreset = (days) => {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const start = new Date(now);
    start.setDate(now.getDate() - days + 1);

    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-primary">Audit Log</h2>
          <p className="text-sm text-theme-secondary mt-1">View recent admin actions across the system.</p>
        </div>
      </div>

      <div className={`rounded-xl border p-5 shadow-sm transition-colors duration-300 ${cardClass}`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className={`w-full rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0033A0] outline-none transition-colors duration-300 ${inputClass}`}
            >
              {ENTITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">Entity ID</label>
            <SearchBar
              onSearch={(value) => setEntityId(value)}
              placeholder="Search specific ID (e.g. 12)"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0033A0] outline-none transition-colors duration-300 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0033A0] outline-none transition-colors duration-300 ${inputClass}`}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setEntityId('');
                setEntityType('all');
                setStartDate('');
                setEndDate('');
              }}
              className={`w-full py-2.5 rounded-lg transition font-medium ${isDarkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyDatePreset(1)}
            className={`px-3 py-1.5 text-xs border rounded-md transition-colors duration-300 ${isDarkMode ? 'border-slate-700 text-slate-100 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => applyDatePreset(7)}
            className={`px-3 py-1.5 text-xs border rounded-md transition-colors duration-300 ${isDarkMode ? 'border-slate-700 text-slate-100 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => applyDatePreset(30)}
            className={`px-3 py-1.5 text-xs border rounded-md transition-colors duration-300 ${isDarkMode ? 'border-slate-700 text-slate-100 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <div className={`rounded-xl border p-5 shadow-sm transition-colors duration-300 ${cardClass}`}>
        <p className={`text-sm mb-4 pb-4 border-b ${mutedTextClass} ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          {entityType === 'all' && !entityId && !startDate && !endDate
            ? "Showing the most recent logs across all entities." 
            : `Filtered results for: ${entityType !== 'all' ? entityType.toUpperCase() : 'All Entities'}${entityId ? ` | ID: ${entityId}` : ''}${startDate ? ` | From: ${startDate}` : ''}${endDate ? ` | To: ${endDate}` : ''}`
          }
        </p>

        <AdminLogsViewer
          entityType={entityType}
          entityId={entityId}
          startDate={startDate}
          endDate={endDate}
          limit={100}
        />
      </div>
    </div>
  );
}