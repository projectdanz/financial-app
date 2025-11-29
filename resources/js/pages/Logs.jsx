import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterActivity, setFilterActivity] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/logs/my');
      setLogs(response.data.data.data || []); // Pagination wrapper
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (activity) => {
    const lower = activity.toLowerCase();
    if (lower.includes('create') || lower.includes('add')) return 'bg-green-100 text-green-800';
    if (lower.includes('update') || lower.includes('edit')) return 'bg-blue-100 text-blue-800';
    if (lower.includes('delete') || lower.includes('remove')) return 'bg-red-100 text-red-800';
    if (lower.includes('login') || lower.includes('logout')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredLogs = logs.filter(log => 
    log.activity.toLowerCase().includes(filterActivity.toLowerCase())
  );

  return (
    <Sidebar>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Logs</h1>
            <p className="text-gray-600">Track your history and actions</p>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-500">Your activity history will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Activity</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Details</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLogs.map((log, index) => (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.activity)}`}>
                            {log.activity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {log.data ? (
                              <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-2 rounded border border-gray-100">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            ) : (
                              <span className="italic text-gray-400">No details</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{formatDate(log.created_at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
