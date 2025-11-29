import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

/**
 * Dashboard Page with Sidebar
 */
export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({
    totalSavings: 0,
    savingsCount: 0,
    activeWishes: 0,
    achievedWishes: 0,
    totalLogs: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [savingsRes, wishesRes, logsRes] = await Promise.all([
        axios.get('/api/savings'),
        axios.get('/api/wishes'),
        axios.get('/api/logs/my?per_page=5') // Get latest 5 logs for recent activity
      ]);

      const savingsData = savingsRes.data.data || [];
      const wishesData = wishesRes.data.data || [];
      const logsData = logsRes.data.data.data || []; // Pagination wrapper

      const totalSavings = savingsData.reduce((sum, item) => sum + parseFloat(item.total), 0);
      
      // Calculate dynamic status for wishes based on total savings
      // This matches the logic in Wishes.jsx
      const processedWishes = wishesData.map(wish => {
        const price = parseFloat(wish.price);
        const isAchieved = totalSavings >= price;
        return {
          ...wish,
          dynamic_status: isAchieved ? 'achieved' : 'pending'
        };
      });

      const activeWishes = processedWishes.filter(w => w.dynamic_status === 'pending').length;
      const achievedWishes = processedWishes.filter(w => w.dynamic_status === 'achieved').length;

      setStats({
        totalSavings,
        savingsCount: savingsData.length,
        activeWishes,
        achievedWishes,
        totalLogs: logsRes.data.data.total || 0
      });

      setRecentLogs(logsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Sidebar>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name}!</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium mb-1">Total Savings</h3>
              <p className="text-3xl font-bold">{formatCurrency(stats.totalSavings)}</p>
              <p className="text-sm text-blue-100 mt-2">{stats.savingsCount} accounts</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium mb-1">Active Wishes</h3>
              <p className="text-3xl font-bold">{stats.activeWishes}</p>
              <p className="text-sm text-purple-100 mt-2">{stats.achievedWishes} achieved</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium mb-1">Activity Logs</h3>
              <p className="text-3xl font-bold">{stats.totalLogs}</p>
              <p className="text-sm text-green-100 mt-2">All time activities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <Link to="/logs" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  View All
                </Link>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4 text-gray-500">Loading activity...</div>
                ) : recentLogs.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No recent activity</div>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className={`p-2 rounded-lg ${
                        log.activity.toLowerCase().includes('create') ? 'bg-green-100 text-green-600' :
                        log.activity.toLowerCase().includes('update') ? 'bg-blue-100 text-blue-600' :
                        log.activity.toLowerCase().includes('delete') ? 'bg-red-100 text-red-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{log.activity}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <Link to="/savings" className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Add Savings</p>
                      <p className="text-xs text-gray-500">Track your money</p>
                    </div>
                  </div>
                </Link>

                <Link to="/wishes" className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Create Wish</p>
                      <p className="text-xs text-gray-500">Set your goals</p>
                    </div>
                  </div>
                </Link>

                <Link to="/logs" className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">View Logs</p>
                      <p className="text-xs text-gray-500">Check activities</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
