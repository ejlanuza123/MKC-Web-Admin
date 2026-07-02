// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Package, 
  ShoppingBag 
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import ErrorAlert from '../components/common/ErrorAlert';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';


// Skeleton Components
const StatsCardSkeleton = () => (
  <div className="bg-card-theme p-6 rounded-xl border border-theme animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-8 w-32 bg-gray-300 rounded"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);

const RecentOrdersSkeleton = () => (
  <div className="lg:col-span-2 bg-card-theme rounded-xl border border-theme p-6">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="space-y-3">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-3 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LowStockSkeleton = () => (
  <div className="bg-card-theme rounded-xl border border-theme p-6">
    <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-3 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-3 w-12 bg-gray-200 rounded ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    lowStock: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      const [statsData, ordersData, lowStockData] = await Promise.all([
        orderService.getStats(),
        orderService.getAll().then(orders => orders.slice(0, 5)),
        productService.getLowStock(10)
      ]);
      
      setStats(statsData);
      setRecentOrders(ordersData);
      setLowStockProducts(lowStockData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const subscription = supabase
      .channel('dashboard-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDashboardData]);

  // Memoized stats values to prevent unnecessary recalculations
  const memoizedStats = useMemo(() => ({
    totalRevenue: formatCurrency(stats.totalRevenue),
    todayRevenue: formatCurrency(stats.todayRevenue),
    pendingOrders: stats.pendingOrders,
    processingOrders: stats.processingOrders,
    lowStock: stats.lowStock
  }), [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <StatsCardSkeleton key={i} />)}
        </div>

        {/* Charts and Tables Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentOrdersSkeleton />
          <LowStockSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-theme-primary">Dashboard Overview</h2>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className={`px-4 py-2 rounded-lg transition-colors duration-150 disabled:opacity-50 ${isDarkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Refresh
        </button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={memoizedStats.totalRevenue} 
          icon={DollarSign} 
          color="bg-mkc-blue"
          trend={12.5}
          trendValue="vs last month"
        />
        <StatsCard 
          title="Today's Revenue" 
          value={memoizedStats.todayRevenue} 
          icon={TrendingUp} 
          color="bg-green-600"
        />
        <StatsCard 
          title="Pending Orders" 
          value={memoizedStats.pendingOrders} 
          icon={Clock} 
          color="bg-orange-500"
          subtext={`${memoizedStats.processingOrders} currently processing`}
        />
        <StatsCard 
          title="Low Stock Items" 
          value={memoizedStats.lowStock} 
          icon={AlertTriangle} 
          color="bg-red-500"
          subtext="Products below 10 units"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-card-theme rounded-xl shadow-sm border border-theme p-6 transition-colors duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-theme-primary">Recent Orders</h3>
            <Link to="/orders" className="text-sm text-[#0033A0] hover:text-[#ED1C24] transition-colors duration-150">
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-150 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div>
                  <p className="font-medium text-theme-primary">#{order.id}</p>
                  <p className="text-sm text-theme-secondary">{order.profiles?.full_name || 'Guest'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#0033A0]">{formatCurrency(order.total_amount)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-card-theme rounded-xl shadow-sm border border-theme p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-theme-primary mb-4">Low Stock Alert</h3>
          
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-150 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-50 hover:bg-red-100'}`}>
                  <div>
                    <p className="font-medium text-theme-primary">{product.name}</p>
                    <p className="text-sm text-theme-secondary">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{product.stock_quantity} {product.unit}</p>
                    <Link to="/products" className="text-xs text-[#0033A0] hover:text-[#ED1C24] transition-colors duration-150">
                      Restock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto text-theme-secondary mb-2" size={48} />
              <p className="text-theme-secondary">No low stock items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}