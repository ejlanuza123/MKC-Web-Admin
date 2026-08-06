// src/pages/Reports.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  BarChart3, 
  DollarSign,
  ShoppingCart,
  Users,
  RefreshCw,
  ChevronDown,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import ErrorAlert from '../components/common/ErrorAlert';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../utils/formatters';
import { analyticsService } from '../services/analyticsService';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';

// Skeleton Components
const StatCardSkeleton = ({ isDarkMode }) => (
  <div className={`p-6 rounded-xl border animate-pulse transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
    <div className="flex justify-between mb-2">
      <div className={`h-4 w-24 rounded transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
      <div className={`w-8 h-8 rounded transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
    </div>
    <div className={`h-8 w-32 rounded mb-2 transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
    <div className={`h-3 w-20 rounded transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
  </div>
);

const CategorySkeleton = ({ isDarkMode }) => (
  <div className="space-y-3">
    {[1,2,3,4].map(i => (
      <div key={i} className="animate-pulse">
        <div className="flex justify-between mb-1">
          <div className={`h-4 w-24 rounded transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
          <div className={`h-4 w-20 rounded transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
        </div>
        <div className={`w-full rounded-full h-2 transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
          <div className={`h-2 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`} style={{ width: `${Math.random() * 100}%` }}></div>
        </div>
      </div>
    ))}
  </div>
);

const ExportDropdown = ({ onExport, disabled, exporting }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || exporting}
        className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
      >
        {exporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Exporting...
          </>
        ) : (
          <>
            <Download size={18} />
            Export
            <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && !exporting && (
        <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border py-1 z-50 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <button
            onClick={() => {
              setIsOpen(false);
              onExport('excel');
            }}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-red-50'}`}
          >
            <FileSpreadsheet size={18} className="text-green-600" />
            <div>
              <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Excel (.xlsx)</p>
              <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Download as spreadsheet</p>
            </div>
          </button>
          
          <button
            onClick={() => {
              setIsOpen(false);
              onExport('csv');
            }}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors border-t ${isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-100 hover:bg-red-50'}`}
          >
            <FileText size={18} className="text-blue-600" />
            <div>
              <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>CSV Raw Data (.csv)</p>
              <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Download raw CSV data</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default function Reports() {
  const { isDarkMode } = useTheme();
  const [dateRange, setDateRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeReportTab, setActiveReportTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dateRangeLabel = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch(dateRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      default:
        return 'Custom Range';
    }
  }, [dateRange]);

  const fetchReportData = useCallback(async (isSilent = false, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else if (!isSilent) {
        setLoading(true);
      }
      setError(null);
      
      const endDate = new Date();
      const startDate = new Date();
      
      switch(dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'custom':
          if (customStartDate) startDate.setTime(new Date(customStartDate).getTime());
          if (customEndDate) endDate.setTime(new Date(customEndDate).getTime());
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      const res = await analyticsService.getAnalyticsOverview(startDate, endDate);
      if (!res.success) throw new Error(res.error || 'Failed to load report analytics');

      setReportData({
        summary: res.summary,
        paymentMethods: res.paymentMethods,
        statusDistribution: res.statusDistribution,
        topProducts: res.topProducts,
        categorySales: res.categorySales,
        timeSeriesData: res.dailyTrend,
        rawOrders: res.rawOrders,
        dateRange: {
          start: startDate,
          end: endDate,
          label: dateRange === 'custom' ? `${customStartDate || 'Start'} to ${customEndDate || 'End'}` : dateRangeLabel
        }
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, dateRangeLabel, customStartDate, customEndDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleRefresh = useCallback(() => {
    fetchReportData(true);
  }, [fetchReportData]);

  const handleDateRangeChange = useCallback((e) => {
    setDateRange(e.target.value);
  }, []);

  const handleExport = useCallback(async (format) => {
    if (!reportData) return;
    setExporting(true);
    try {
      if (format === 'csv') {
        const headers = ['Order ID', 'Order Number', 'Date', 'Total Amount (PHP)', 'Delivery Fee', 'Payment Method', 'Status'];
        const rows = (reportData.rawOrders || []).map(o => [
          o.id,
          o.order_number || o.id,
          new Date(o.created_at).toLocaleString(),
          o.total_amount,
          o.delivery_fee || 0,
          o.payment_method || 'COD',
          o.status
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `mkc-analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
      } else if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Executive Summary');
        sheet.addRow(['MKC FOODS CORPORATION - ANALYTICS REPORT']);
        sheet.addRow(['Period:', reportData.dateRange.label]);
        sheet.addRow([]);
        sheet.addRow(['Metric', 'Value']);
        sheet.addRow(['Total Sales', reportData.summary.totalSales]);
        sheet.addRow(['Total Orders', reportData.summary.totalOrdersCount]);
        sheet.addRow(['Completion Rate', `${reportData.summary.completionRate}%`]);
        sheet.addRow(['Average Order Value', reportData.summary.avgOrderValue]);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `mkc-analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [reportData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-40 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} isDarkMode={isDarkMode} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Reports & Analytics</h2>
          {reportData && (
            <p className={`text-sm mt-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Calendar size={14} className="inline mr-1" />
              {reportData.dateRange.label}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={`border rounded-lg px-2.5 py-1.5 text-xs outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
              />
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={`border rounded-lg px-2.5 py-1.5 text-xs outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
          )}

          <select
            value={dateRange}
            onChange={handleDateRangeChange}
            className={`border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
            disabled={refreshing || exporting}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last 12 Months</option>
            <option value="custom">Custom Date Range</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing || exporting}
            className={`px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 transition-colors duration-300 ${isDarkMode ? 'border-slate-600 hover:bg-slate-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50'}`}
            title="Refresh Data"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          
          <ExportDropdown 
            onExport={handleExport}
            disabled={!reportData}
            exporting={exporting}
          />
        </div>
      </div>

      {/* Analytics Navigation Sub-Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl w-fit transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-100'}`}>
        <button
          onClick={() => setActiveReportTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeReportTab === 'overview'
              ? 'bg-red-600 text-white shadow-sm'
              : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
          }`}
        >
          <BarChart3 size={16} /> Executive Overview
        </button>
        <button
          onClick={() => setActiveReportTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeReportTab === 'products'
              ? 'bg-red-600 text-white shadow-sm'
              : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
          }`}
        >
          <ShoppingCart size={16} /> Product Sales Mix
        </button>
        <button
          onClick={() => setActiveReportTab('operations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeReportTab === 'operations'
              ? 'bg-red-600 text-white shadow-sm'
              : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
          }`}
        >
          <TrendingUp size={16} /> Delivery & Operations
        </button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {reportData && (
        <>
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</p>
                <div className="p-2 bg-red-100 rounded-lg">
                  <DollarSign className="text-red-600" size={18} />
                </div>
              </div>
              <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(reportData.summary.totalSales || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.summary.completedCount || 0} completed orders
              </p>
            </div>

            <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</p>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ShoppingCart className="text-amber-600" size={18} />
                </div>
              </div>
              <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{reportData.summary.totalOrdersCount || 0}</p>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-emerald-600 font-semibold">{reportData.summary.completionRate}% completion rate</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Order Value</p>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="text-green-600" size={18} />
                </div>
              </div>
              <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(Number(reportData.summary.avgOrderValue || 0))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                per completed order
              </p>
            </div>

            <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Delivery Fees</p>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="text-purple-600" size={18} />
                </div>
              </div>
              <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(reportData.summary.totalDeliveryFees || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Peak Hour: <span className="font-bold text-purple-600">{reportData.summary.peakHourLabel}</span>
              </p>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeReportTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Sales Timeline */}
              <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Daily Sales Timeline</h3>
                {reportData.timeSeriesData && reportData.timeSeriesData.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {reportData.timeSeriesData.map((item, index) => {
                      const maxAmount = Math.max(...reportData.timeSeriesData.map(d => d.sales), 1);
                      const percentage = (item.sales / maxAmount) * 100;
                      
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-24">{item.date}</span>
                          <div className="flex-1">
                            <div className="h-8 bg-gray-100 dark:bg-slate-700 rounded-lg relative group">
                              <div 
                                className="h-full bg-red-600 rounded-lg transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              >
                                <div className="opacity-0 group-hover:opacity-100 absolute right-0 -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity shadow">
                                  {formatCurrency(item.sales)} ({item.orders} orders)
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 text-right">
                            {formatCurrency(item.sales)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No sales data available for this period
                  </div>
                )}
              </div>

              {/* Payment Methods & Operational Highlights */}
              <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Payment Method Distribution</h3>
                
                <div className="space-y-4 mb-6">
                  {Object.entries(reportData.paymentMethods || {}).map(([method, count]) => {
                    const pct = reportData.summary.totalOrdersCount > 0
                      ? Math.round((count / reportData.summary.totalOrdersCount) * 100)
                      : 0;
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{method}</span>
                          <span className="text-red-600">{count} orders ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                          <div
                            className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-red-50/60 border-red-100'}`}>
                  <p className="text-xs font-bold text-red-600 uppercase mb-1">Operational Highlight</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Peak ordering volume occurs around <strong className="text-red-600">{reportData.summary.peakHourLabel}</strong>. 
                    {reportData.summary.avgDeliveryMinutes ? ` Average delivery duration is ${reportData.summary.avgDeliveryMinutes} mins.` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT SALES MIX */}
          {activeReportTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top 10 Products Table */}
              <div className={`lg:col-span-2 rounded-xl shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Top 10 Best Selling Products</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase border-b ${isDarkMode ? 'bg-slate-700 text-gray-300 border-slate-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      <tr>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3 text-center">Category</th>
                        <th className="px-4 py-3 text-center">Qty Sold</th>
                        <th className="px-4 py-3 text-right">Revenue (₱)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {(reportData.topProducts || []).map((prod, idx) => (
                        <tr key={idx} className={isDarkMode ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50'}>
                          <td className={`px-4 py-3 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{prod.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                              {prod.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-red-600">{prod.quantity}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(prod.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Category Sales Distribution</h3>
                <div className="space-y-4">
                  {(reportData.categorySales || []).map((cat) => {
                    const pct = reportData.summary.totalSales > 0
                      ? Math.round((cat.revenue / reportData.summary.totalSales) * 100)
                      : 0;
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{cat.category}</span>
                          <span className="text-emerald-600">{formatCurrency(cat.revenue)} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                        </div>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{cat.quantity} items sold</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DELIVERY & OPERATIONS */}
          {activeReportTab === 'operations' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Status Distribution */}
              <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Order Status Distribution</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(reportData.statusDistribution || {}).map(([status, count]) => (
                    <div key={status} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{status}</p>
                      <p className="text-2xl font-extrabold text-red-600 mt-1">{count}</p>
                      <p className="text-xs text-gray-400 mt-1">orders</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Duration & Performance summary */}
              <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Delivery & Dispatch Metrics</h3>
                
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Average Delivery Time</p>
                    <p className="text-3xl font-extrabold text-emerald-600">
                      {reportData.summary.avgDeliveryMinutes ? `${reportData.summary.avgDeliveryMinutes} mins` : 'N/A'}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>From dispatch assignment to customer drop-off</p>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-red-50 border-red-100'}`}>
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">Total Delivery Fee Revenue</p>
                    <p className="text-3xl font-extrabold text-red-600">
                      {formatCurrency(reportData.summary.totalDeliveryFees || 0)}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Collected across all fulfilled deliveries</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}