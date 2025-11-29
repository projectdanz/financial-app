import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import Button from '../components/Button';
import axios from 'axios';

/**
 * Wishes Page with CRUD operations (including Delete)
 */
export default function Wishes() {
  const [wishes, setWishes] = useState([]);
  const [filteredWishes, setFilteredWishes] = useState([]);
  const [savings, setSavings] = useState([]);
  const [totalSavingsBalance, setTotalSavingsBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedWish, setSelectedWish] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const [formData, setFormData] = useState({
    name: '',
    deskripsi: '',
    price: '',
    diff_to_reach: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Calculate dynamic values for wishes based on savings
  const processedWishes = wishes.map(wish => {
    const price = parseFloat(wish.price);
    const diff = Math.max(0, price - totalSavingsBalance);
    const isAchieved = totalSavingsBalance >= price;
    
    return {
      ...wish,
      dynamic_status: isAchieved ? 'achieved' : 'pending',
      dynamic_diff: diff,
      affordability_percent: totalSavingsBalance > 0 ? Math.min((totalSavingsBalance / price) * 100, 100) : 0
    };
  });

  // Fetch wishes and savings on mount
  useEffect(() => {
    fetchWishes();
    fetchSavings();
  }, []);

  // Filter and sort wishes
  useEffect(() => {
    let filtered = [...processedWishes];

    // Filter by status (using dynamic status)
    if (filterStatus) {
      filtered = filtered.filter(w => w.dynamic_status === filterStatus);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'highest':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'lowest':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
    }

    setFilteredWishes(filtered);
  }, [wishes, totalSavingsBalance, filterStatus, sortBy]); // Re-run when savings change

  const fetchWishes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/wishes');
      setWishes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching wishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavings = async () => {
    try {
      const response = await axios.get('/api/savings');
      const savingsData = response.data.data || [];
      setSavings(savingsData);
      
      // Calculate total balance from all savings
      const total = savingsData.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
      setTotalSavingsBalance(total);
    } catch (error) {
      console.error('Error fetching savings:', error);
    }
  };

  const handleOpenModal = (mode, wish = null) => {
    setModalMode(mode);
    setSelectedWish(wish);
    
    if (mode === 'edit' && wish) {
      setFormData({
        name: wish.name,
        deskripsi: wish.deskripsi,
        price: wish.price,
        diff_to_reach: wish.diff_to_reach, // Keep DB value for editing, though display uses dynamic
      });
    } else {
      setFormData({
        name: '',
        deskripsi: '',
        price: '',
        diff_to_reach: '',
      });
    }
    
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWish(null);
    setFormData({
      name: '',
      deskripsi: '',
      price: '',
      diff_to_reach: '',
    });
    setErrors({});
  };

  const handleOpenDeleteModal = (wish) => {
    setSelectedWish(wish);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedWish(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      const price = parseFloat(value) || 0;
      // Calculate diff based on current total savings
      const diff = Math.max(0, price - totalSavingsBalance);
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        diff_to_reach: diff
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Wish name is required';
    }
    
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a valid positive number';
    }
    
    // diff_to_reach is auto-calculated, so we just check if it's valid number (can be 0)
    if (formData.diff_to_reach === '' || formData.diff_to_reach === null || isNaN(formData.diff_to_reach)) {
       // If price is valid but diff is not, something went wrong, but usually it's derived.
       // We can skip strict validation or just ensure it's not NaN
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        deskripsi: formData.deskripsi || '',
        price: parseFloat(formData.price),
        diff_to_reach: parseFloat(formData.diff_to_reach), // Now uses the auto-calculated value
      };

      if (modalMode === 'add') {
        await axios.post('/api/wishes', payload);
      } else {
        await axios.put(`/api/wishes/${selectedWish.id}`, payload);
      }

      await fetchWishes();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving data:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWish) return;

    setSubmitting(true);

    try {
      await axios.delete(`/api/wishes/${selectedWish.id}`);
      await fetchWishes();
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting wish:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate statistics based on PROCESSED wishes (dynamic status)
  const totalWishes = processedWishes.length;
  const achievedWishes = processedWishes.filter(w => w.dynamic_status === 'achieved').length;
  const pendingWishes = processedWishes.filter(w => w.dynamic_status === 'pending').length;
  // Total to save is sum of dynamic diffs
  const totalDiff = processedWishes.reduce((sum, w) => sum + parseFloat(w.dynamic_diff || 0), 0);

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      achieved: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      achieved: 'Achieved',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <Sidebar>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Wishes</h1>
              <p className="text-gray-600">Track your financial goals and dreams</p>
            </div>
            <Button
              onClick={() => handleOpenModal('add')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Wish
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total Wishes</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{totalWishes}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Achieved</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{achievedWishes}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Pending</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{pendingWishes}</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total Savings</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(totalSavingsBalance)}</p>
              <p className="text-xs opacity-75 mt-1">Available funds</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total to Save</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(totalDiff)}</p>
              <p className="text-xs opacity-75 mt-1">Still need</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="achieved">Achieved</option>
                  {/* Cancelled is not dynamically calculated, but we could keep it if stored in DB. 
                      For now, dynamic status overrides DB status for pending/achieved. */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Price</option>
                  <option value="lowest">Lowest Price</option>
                </select>
              </div>
            </div>
          </div>

          {/* Wishes List */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading wishes...</p>
            </div>
          ) : filteredWishes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filterStatus ? 'No wishes found' : 'No wishes yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {filterStatus ? 'Try adjusting your filters' : 'Create your first wish to start saving for your goals'}
              </p>
              {!filterStatus && (
                <Button onClick={() => handleOpenModal('add')}>
                  Create First Wish
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Wish Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">Target Price</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">To Save</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Affordability</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Last Updated</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredWishes.map((wish, index) => (
                      <tr 
                        key={wish.id} 
                        className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        {/* Wish Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                              {wish.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{wish.name}</span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 line-clamp-2">
                            {wish.deskripsi || '-'}
                          </span>
                        </td>

                        {/* Target Price */}
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-purple-700">{formatCurrency(wish.price)}</span>
                        </td>

                        {/* Diff to Reach (Dynamic) */}
                        <td className="px-6 py-4 text-right">
                          <span className={`font-semibold ${wish.dynamic_diff > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                            {formatCurrency(wish.dynamic_diff)}
                          </span>
                        </td>

                        {/* Affordability */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1">
                            {wish.dynamic_status === 'achieved' ? (
                              <>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Can Afford
                                </span>
                                <span className="text-xs text-gray-500">{wish.affordability_percent.toFixed(0)}%</span>
                              </>
                            ) : (
                              <>
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Not Yet
                                </span>
                                <span className="text-xs text-gray-500">{wish.affordability_percent.toFixed(0)}%</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Status (Dynamic) */}
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(wish.dynamic_status)}`}>
                            {getStatusLabel(wish.dynamic_status)}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{formatDate(wish.updated_at)}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenModal('edit', wish)}
                              className="p-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(wish)}
                              className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Add New Wish' : 'Edit Wish'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Wish Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., New Laptop, Vacation to Bali"
            error={errors.name}
            required
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleChange}
              placeholder="Describe your wish..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <InputField
            label="Target Price"
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0"
            error={errors.price}
            required
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <div className="relative">
            <InputField
              label="Amount to Save (Auto-calculated)"
              type="number"
              name="diff_to_reach"
              value={formData.diff_to_reach}
              readOnly
              placeholder="0"
              error={errors.diff_to_reach}
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            <div className="absolute inset-0 bg-gray-50 opacity-10 pointer-events-none rounded-xl" />
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-purple-900 mb-1">Progress Info</p>
                <p className="text-xs text-purple-700">
                  {formData.price && formData.diff_to_reach && (
                    <>
                      Progress: {formatCurrency(parseFloat(formData.price) - parseFloat(formData.diff_to_reach))} / {formatCurrency(formData.price)}
                      <span className="block mt-1">
                        ({((1 - parseFloat(formData.diff_to_reach) / parseFloat(formData.price)) * 100).toFixed(0)}% completed)
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={submitting}
            >
              {modalMode === 'add' ? 'Add Wish' : 'Update Wish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Delete Wish"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Are you sure?</p>
                <p className="text-sm text-red-700">
                  This will permanently delete the wish "{selectedWish?.name}". This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleCloseDeleteModal}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              fullWidth
              loading={submitting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}
