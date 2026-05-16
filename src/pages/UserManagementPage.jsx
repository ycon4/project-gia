import { useState, useEffect, useRef } from 'react';
import { Search, UserCog, Shield, ShieldCheck, User, Mail, Calendar, CheckCircle2, XCircle, Loader2, UserPlus, X, ChevronDown, Upload, Trash2, UserX, MoreVertical } from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { batchCreateAccounts } from '../../firebase/auth';
import { batchCreateUserDocuments } from '../../firebase/services';
import * as XLSX from 'xlsx';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Account creation state
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Dark mode detection
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setIsDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load all users from Firestore with real-time updates
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading users:', error);
        alert('Failed to load users. Check console for details.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load employees from user_directory collection
  useEffect(() => {
    const q = query(collection(db, 'user_directory'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const employeesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(employeesData);
      },
      (error) => {
        console.error('Error loading user directory:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(user =>
          user.email?.toLowerCase().includes(term) ||
          user.displayName?.toLowerCase().includes(term) ||
          user.uid?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, users]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;

    setUpdating(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });

      alert(`Role updated to ${newRole} successfully!`);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Check console for details.');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck size={12} className="text-purple-500" />;
      case 'SECRETARIAT':
        return <Shield size={12} className="text-blue-500" />;
      default:
        return <User size={12} className="text-gray-500" />;
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      SECRETARIAT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      USER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return styles[role] || styles.USER;
  };

  const getStatusBadge = (status) => {
    return status === 'Active'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter available employees (not already users)
  const availableEmployees = employees.filter(emp => {
    const hasAccount = users.some(u => u.email === emp.email);
    const isSelected = selectedEmployees.some(s => s.id === emp.id);
    const matchesSearch = !employeeSearch.trim() ||
      emp.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.email?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.department?.toLowerCase().includes(employeeSearch.toLowerCase());

    return !hasAccount && !isSelected && matchesSearch;
  });

  const handleSelectEmployee = (employee) => {
    setSelectedEmployees(prev => [...prev, { ...employee, assignedRole: 'USER' }]);
  };

  const handleRemoveEmployee = (employeeId) => {
    setSelectedEmployees(prev => prev.filter(e => e.id !== employeeId));
  };

  const handleRoleAssignment = (employeeId, role) => {
    setSelectedEmployees(prev =>
      prev.map(e => e.id === employeeId ? { ...e, assignedRole: role } : e)
    );
  };

  const handleCreateAccounts = async () => {
    if (selectedEmployees.length === 0) return;

    const confirmed = window.confirm(
      `Create ${selectedEmployees.length} account(s) with default password "GIA2026"?`
    );
    if (!confirmed) return;

    setCreating(true);
    try {
      // Step 1: Create Firebase Auth accounts
      const authResult = await batchCreateAccounts(
        selectedEmployees.map(emp => ({
          email: emp.email,
          displayName: emp.name || emp.email?.split('@')[0],
          role: emp.assignedRole,
          employeeId: emp.employeeId,
          department: emp.department,
        })),
        'GIA2026'
      );

      // Step 2: Create Firestore user documents
      const firestoreResult = await batchCreateUserDocuments(
        authResult.successful,
        auth.currentUser?.uid
      );

      // Show results
      const totalSuccess = firestoreResult.successful.length;
      const totalFailed = authResult.failed.length + firestoreResult.failed.length;

      let message = `✅ Successfully created ${totalSuccess} account(s).\n\n`;
      message += `Default password: GIA2026\n`;
      message += `Users should change their password after first login.\n\n`;

      if (totalFailed > 0) {
        message += `❌ Failed to create ${totalFailed} account(s):\n`;
        authResult.failed.forEach(f => {
          message += `- ${f.email}: ${f.error}\n`;
        });
        firestoreResult.failed.forEach(f => {
          message += `- ${f.email}: ${f.error}\n`;
        });
      }

      alert(message);
      setSelectedEmployees([]);
    } catch (error) {
      console.error('Error creating accounts:', error);
      alert('Failed to create accounts. Check console for details.');
    } finally {
      setCreating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('No data found in the file');
        setUploading(false);
        return;
      }

      // Batch write to Firestore
      const batch = writeBatch(db);
      const userDirRef = collection(db, 'user_directory');

      jsonData.forEach((row) => {
        const docRef = doc(userDirRef);
        batch.set(docRef, {
          name: row['Staff Name'] || row.name || row.Name || '',
          email: row['Email Address'] || row.email || row.Email || '',
          employeeId: row['Employee ID'] || row.employeeId || row.id || row.ID || '',
          department: row['Department'] || row.department || row.college || row.College || '',
          createdAt: new Date().toISOString(),
        });
      });

      await batch.commit();
      alert(`✅ Successfully uploaded ${jsonData.length} records to user directory`);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Check console for details.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDirectory = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will delete ALL records in the user directory. This action cannot be undone. Are you sure?'
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'This is your last chance. Type YES in the next prompt to confirm deletion.'
    );
    if (!doubleConfirm) return;

    setUploading(true);
    try {
      const batch = writeBatch(db);
      const userDirRef = collection(db, 'user_directory');
      const snapshot = await getDocs(userDirRef);

      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      alert(`✅ Successfully deleted ${snapshot.size} records from user directory`);
    } catch (error) {
      console.error('Error deleting directory:', error);
      alert('Failed to delete directory. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  const handleRevokeAccess = async (userId, userEmail) => {
    const confirmed = window.confirm(
      `Revoke access for ${userEmail}? This will delete their user account but keep them in the directory.`
    );
    if (!confirmed) return;

    setUpdating(userId);
    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', userId));

      alert(`✅ Access revoked for ${userEmail}. They will appear back in the directory.`);
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Failed to revoke access. Check console for details.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 bg-neutral-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              User Management
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Manage user roles and permissions
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20"
          >
            <Loader2 size={16} className={loading ? 'animate-spin' : 'hidden'} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <User size={16} className="text-neutral-600 dark:text-neutral-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Total</p>
            </div>
            <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{users.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-purple-200 dark:bg-purple-800/50">
                <ShieldCheck size={16} className="text-purple-700 dark:text-purple-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Admin</p>
            </div>
            <p className="text-3xl font-black text-purple-900 dark:text-purple-100">
              {users.filter(u => u.role === 'ADMIN').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-blue-200 dark:bg-blue-800/50">
                <Shield size={16} className="text-blue-700 dark:text-blue-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Secretariat</p>
            </div>
            <p className="text-3xl font-black text-blue-900 dark:text-blue-100">
              {users.filter(u => u.role === 'SECRETARIAT').length}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <User size={16} className="text-neutral-600 dark:text-neutral-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Public</p>
            </div>
            <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
              {users.filter(u => u.role === 'USER' || !u.role).length}
            </p>
          </div>
        </div>

        {/* Compact Two-Panel Layout */}
        <div className="grid md:grid-cols-[400px_1fr] gap-6">

          {/* LEFT PANEL: Create User Accounts */}
          <div className="bg-gradient-to-br from-white to-purple-50/30 dark:from-neutral-900 dark:to-purple-900/10 border-2 border-purple-200 dark:border-purple-800/50 rounded-xl p-4 shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                <UserPlus size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-100">Create Accounts</h2>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Select from directory</p>
              </div>

              {/* Three-dots menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-all"
                  title="More options"
                >
                  <MoreVertical size={14} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg shadow-2xl overflow-hidden z-30">
                    <label className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                      <Upload size={13} className="text-neutral-500" />
                      <span>Upload Excel</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          handleFileUpload(e);
                          setMenuOpen(false);
                        }}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => {
                        handleDeleteDirectory();
                        setMenuOpen(false);
                      }}
                      disabled={uploading || employees.length === 0}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={13} />
                      <span>Clear Directory</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search Directory */}
            <div className="mb-3">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2 text-neutral-400 z-10" />
                <input
                  type="text"
                  placeholder="Search directory..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all placeholder:text-neutral-400"
                />

                {/* Dropdown suggestions */}
                {employeeSearch && availableEmployees.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border-2 border-purple-200 dark:border-purple-800/50 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-20">
                    <div className="p-1.5">
                      {availableEmployees.slice(0, 15).map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            handleSelectEmployee(emp);
                            setEmployeeSearch('');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all rounded-lg group mb-1"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-xs shrink-0">
                              {(emp.name || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {emp.name || 'No name'}
                              </p>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                {emp.email}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {availableEmployees.length > 15 && (
                      <div className="px-3 py-2 text-[10px] text-neutral-400 dark:text-neutral-600 text-center bg-neutral-50 dark:bg-neutral-800 font-semibold border-t border-neutral-100 dark:border-neutral-800">
                        +{availableEmployees.length - 15} more
                      </div>
                    )}
                  </div>
                )}

                {/* No results */}
                {employeeSearch && availableEmployees.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-6 z-20">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Search size={24} className="text-neutral-300 dark:text-neutral-600 mb-2" />
                      <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">No users found</p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-600">Try different keywords</p>
                    </div>
                  </div>
                )}
              </div>

              {!employeeSearch && employees.length === 0 && (
                <div className="mt-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 text-center">
                  <Upload size={24} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                  <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-0.5">No directory</p>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-600">Upload Excel to start</p>
                </div>
              )}
            </div>

            {/* Selected Users List */}
            <div className="flex-1 flex flex-col min-h-0 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Selected Users</p>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                  {selectedEmployees.length}
                </span>
              </div>

              <div className="flex-1 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl overflow-y-auto bg-neutral-50 dark:bg-neutral-800/50">
                {selectedEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <UserPlus size={24} className="text-neutral-300 dark:text-neutral-600 mb-2" />
                    <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-0.5">No selection</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-600">Search and click to add</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {selectedEmployees.map(emp => (
                      <div key={emp.id} className="mb-2 px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-xs shrink-0">
                            {(emp.name || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                              {emp.name || 'No name'}
                            </p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                              {emp.email}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveEmployee(emp.id)}
                            className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-md transition-all"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="relative">
                          <select
                            value={emp.assignedRole || 'USER'}
                            onChange={(e) => handleRoleAssignment(emp.id, e.target.value)}
                            className="w-full px-2 py-1.5 pr-7 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-[10px] font-bold text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none appearance-none transition-all"
                          >
                            <option value="SECRETARIAT">Secretariat</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateAccounts}
              disabled={selectedEmployees.length === 0 || creating}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating {selectedEmployees.length}...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create {selectedEmployees.length > 0 ? `${selectedEmployees.length} ` : ''}Access{selectedEmployees.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>

          {/* RIGHT PANEL: Approved Accounts (Existing Users) */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-800 shadow-lg">
                  <UserCog size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-100">Approved Accounts</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{users.length} total users</p>
                </div>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all w-64"
                />
              </div>
            </div>

            <div className="flex-1 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              <div className="h-full overflow-y-auto bg-neutral-50 dark:bg-neutral-800/50">
                {filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <User size={32} className="text-neutral-300 dark:text-neutral-600 mb-3" />
                    <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 mb-1">No users found</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-600">
                      {searchTerm ? 'Try a different search term' : 'Create accounts to see them here'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="mb-2 px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-sm shadow-sm shrink-0">
                            {(user.displayName || user.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {user.displayName || 'No name'}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {user.email}
                            </p>
                            {(user.employeeId || user.department) && (
                              <p className="text-[10px] text-neutral-400 dark:text-neutral-600 truncate mt-0.5">
                                {user.employeeId && `ID: ${user.employeeId}`}
                                {user.employeeId && user.department && ' • '}
                                {user.department}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="relative">
                              <select
                                value={user.role || 'USER'}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={updating === user.id}
                                className="px-3 py-1.5 pr-7 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none appearance-none disabled:opacity-50 transition-all hover:border-purple-300 dark:hover:border-purple-700"
                              >
                                <option value="SECRETARIAT">Secretariat</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                            </div>
                            <button
                              onClick={() => handleRevokeAccess(user.id, user.email)}
                              disabled={updating === user.id}
                              className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg disabled:opacity-50 transition-all"
                              title="Revoke Access"
                            >
                              <UserX size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!loading && filteredUsers.length > 0 && (
              <p className="text-xs text-neutral-400 dark:text-neutral-600 text-center mt-4">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
