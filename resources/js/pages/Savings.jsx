import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import Button from '../components/Button';
import axios from 'axios';

/**
 * Savings Page with CRUD operations
 */
export default function Savings() {
  const [savings, setSavings] = useState([]);
  const [filteredSavings, setFilteredSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedSaving, setSelectedSaving] = useState(null);
  const [filterBank, setFilterBank] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  
  const [formData, setFormData] = useState({
    name_bank: '',
    pemasukan: '',
    pengeluaran: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch savings on mount
  useEffect(() => {
    fetchSavings();
  }, []);

  // Filter and sort savings when data changes
  useEffect(() => {
    let filtered = [...savings];

    // Filter by bank
    if (filterBank) {
      filtered = filtered.filter(s => 
        s.name_bank.toLowerCase().includes(filterBank.toLowerCase())
      );
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
        filtered.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
        break;
      case 'lowest':
        filtered.sort((a, b) => parseFloat(a.total) - parseFloat(b.total));
        break;
    }

    setFilteredSavings(filtered);
  }, [savings, filterBank, sortBy]);

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/savings');
      setSavings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching savings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, saving = null) => {
    setModalMode(mode);
    setSelectedSaving(saving);
    
    if (mode === 'edit' && saving) {
      setFormData({
        name_bank: saving.name_bank,
        pemasukan: saving.pemasukan,
        pengeluaran: saving.pengeluaran,
      });
    } else {
      setFormData({
        name_bank: '',
        pemasukan: '',
        pengeluaran: '',
      });
    }
    
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSaving(null);
    setFormData({
      name_bank: '',
      pemasukan: '',
      pengeluaran: '',
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name_bank) {
      newErrors.name_bank = 'Bank name is required';
    }
    
    // Either income or expense must be filled
    if (!formData.pemasukan && !formData.pengeluaran) {
      newErrors.pemasukan = 'Either income or expense must be filled';
      newErrors.pengeluaran = 'Either income or expense must be filled';
    }
    
    if (formData.pemasukan && (isNaN(formData.pemasukan) || parseFloat(formData.pemasukan) < 0)) {
      newErrors.pemasukan = 'Income must be a valid positive number';
    }
    
    if (formData.pengeluaran && (isNaN(formData.pengeluaran) || parseFloat(formData.pengeluaran) < 0)) {
      newErrors.pengeluaran = 'Expense must be a valid positive number';
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
        name_bank: formData.name_bank,
        pemasukan: formData.pemasukan ? parseFloat(formData.pemasukan) : 0,
        pengeluaran: formData.pengeluaran ? parseFloat(formData.pengeluaran) : 0,
      };

      if (modalMode === 'add') {
        await axios.post('/api/savings', payload);
      } else {
        await axios.put(`/api/savings/${selectedSaving.id}`, payload);
      }

      await fetchSavings();
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

  // Calculate totals from FILTERED data (not all savings)
  const totalPemasukan = filteredSavings.reduce((sum, s) => sum + parseFloat(s.pemasukan || 0), 0);
  const totalPengeluaran = filteredSavings.reduce((sum, s) => sum + parseFloat(s.pengeluaran || 0), 0);
  const grandTotal = filteredSavings.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

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

  return (
    <Sidebar>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Savings</h1>
              <p className="text-gray-600">Manage your savings accounts and transactions</p>
            </div>
            <Button
              onClick={() => handleOpenModal('add')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Savings
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Total Income</h3>
                  {filterBank && <p className="text-xs opacity-75 mt-1">Filter: {filterBank}</p>}
                </div>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(totalPemasukan)}</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Total Expense</h3>
                  {filterBank && <p className="text-xs opacity-75 mt-1">Filter: {filterBank}</p>}
                </div>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(totalPengeluaran)}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Net Balance</h3>
                  {filterBank && <p className="text-xs opacity-75 mt-1">Filter: {filterBank}</p>}
                </div>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(grandTotal)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Bank</label>
                <input
                  type="text"
                  placeholder="Search bank name..."
                  value={filterBank}
                  onChange={(e) => setFilterBank(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {filterBank && (
                  <button
                    onClick={() => setFilterBank('')}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear filter
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Balance</option>
                  <option value="lowest">Lowest Balance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Savings List */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading savings...</p>
            </div>
          ) : filteredSavings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filterBank ? 'No savings found' : 'No savings yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {filterBank ? 'Try adjusting your filters' : 'Start tracking your money by adding your first savings account'}
              </p>
              {!filterBank && (
                <Button onClick={() => handleOpenModal('add')}>
                  Add First Savings
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Bank Name</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">Income</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">Expense</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">Balance</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Last Updated</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSavings.map((saving, index) => (
                      <tr 
                        key={saving.id} 
                        className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        {/* Bank Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                              {saving.name_bank.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{saving.name_bank.toUpperCase()}</span>
                          </div>
                        </td>

                        {/* Income */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="font-semibold text-green-700">{formatCurrency(saving.pemasukan)}</span>
                          </div>
                        </td>

                        {/* Expense */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                            <span className="font-semibold text-red-700">{formatCurrency(saving.pengeluaran)}</span>
                          </div>
                        </td>

                        {/* Balance */}
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold text-lg ${parseFloat(saving.total) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            {formatCurrency(saving.total)}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{formatDate(saving.updated_at)}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenModal('edit', saving)}
                              className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  
                  {/* Table Footer with Totals */}
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr className="font-bold">
                      <td className="px-6 py-4 text-gray-900">TOTAL</td>
                      <td className="px-6 py-4 text-right text-green-700">{formatCurrency(totalPemasukan)}</td>
                      <td className="px-6 py-4 text-right text-red-700">{formatCurrency(totalPengeluaran)}</td>
                      <td className="px-6 py-4 text-right text-blue-700 text-lg">{formatCurrency(grandTotal)}</td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
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
        title={modalMode === 'add' ? 'Add New Savings' : 'Edit Savings'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Bank Name"
            type="text"
            name="name_bank"
            value={formData.name_bank}
            onChange={handleChange}
            placeholder="e.g., BCA, Mandiri, BNI"
            error={errors.name_bank}
            required
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <InputField
            label="Income (Pemasukan)"
            type="number"
            name="pemasukan"
            value={formData.pemasukan}
            onChange={handleChange}
            placeholder="0"
            error={errors.pemasukan}
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />

          <InputField
            label="Expense (Pengeluaran)"
            type="number"
            name="pengeluaran"
            value={formData.pengeluaran}
            onChange={handleChange}
            placeholder="0"
            error={errors.pengeluaran}
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            }
          />

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Balance Calculation</p>
                <p className="text-xs text-blue-700">
                  Total = Income - Expense
                  {(formData.pemasukan || formData.pengeluaran) && (
                    <span className="block mt-1 font-semibold">
                      = {formatCurrency(parseFloat(formData.pemasukan || 0) - parseFloat(formData.pengeluaran || 0))}
                    </span>
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
              {modalMode === 'add' ? 'Add Savings' : 'Update Savings'}
            </Button>
          </div>
        </form>
      </Modal>
    </Sidebar>
  );
}
