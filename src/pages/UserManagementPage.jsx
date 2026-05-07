import { useState, useEffect } from 'react';
import { Search, UserCog, Shield, ShieldCheck, User, Mail, Calendar, CheckCircle2, XCircle, Loader2, UserPlus, X, ChevronDown, Upload, Trash2, UserX } from 'lucide-react';
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
      case 'SUPER_ADMIN':
        return <ShieldCheck size={12} className="text-purple-500" />;
      case 'ADMIN':
        return <Shield size={12} className="text-blue-500" />;
      default:
        return <User size={12} className="text-gray-500" />;
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
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
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              User Management
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Manage user roles and permissions
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gia-600 hover:bg-gia-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
          >
            <Loader2 size={14} className={loading ? 'animate-spin' : 'hidden'} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <User size={11} className="text-neutral-400" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Total</p>
            </div>
            <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">{users.length}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ShieldCheck size={11} className="text-purple-500" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Super</p>
            </div>
            <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">
              {users.filter(u => u.role === 'SUPER_ADMIN').length}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Shield size={11} className="text-blue-500" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Admins</p>
            </div>
            <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">
              {users.filter(u => u.role === 'ADMIN').length}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <User size={11} className="text-gray-500" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Users</p>
            </div>
            <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">
              {users.filter(u => u.role === 'USER' || !u.role).length}
            </p>
          </div>
        </div>

        {/* Account Creation Section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-gia-600 dark:text-gia-400" />
              <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-100">Create User Accounts</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteDirectory}
                disabled={uploading || employees.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={12} />
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold cursor-pointer transition-all">
                <Upload size={12} />

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {/* LEFT: Search Employees */}
            <div>
              <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                User Directory
              </p>
              <div className="relative group mb-2">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search directory..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-gia-500/30 focus:border-gia-500 outline-none"
                />
              </div>
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg h-64 overflow-y-auto">
                {availableEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-neutral-400 px-4 text-center">
                    <Upload size={24} className="mb-2 text-neutral-300" />
                    <p>No users in directory</p>
                    <p className="text-[10px] mt-1">Upload an Excel file with columns: name, email</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {availableEmployees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                              {emp.name || 'No name'}
                            </p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                              {emp.email}
                            </p>
                          </div>
                          <div className="text-right">
                            {emp.employeeId && (
                              <p className="text-[9px] text-neutral-400 dark:text-neutral-600">
                                {emp.employeeId}
                              </p>
                            )}
                            {emp.department && (
                              <p className="text-[9px] text-neutral-400 dark:text-neutral-600">
                                {emp.department}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[9px] text-neutral-400 dark:text-neutral-600 mt-1">
                {availableEmployees.length} available • {employees.length} total in directory
              </p>
            </div>

            {/* RIGHT: Existing Users with Role Management */}
            <div>
              <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Existing Users ({users.length})
              </p>
              <div className="relative group mb-2">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-gia-500/30 focus:border-gia-500 outline-none"
                />
              </div>
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-neutral-400">
                    No users found
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="px-3 py-2">
                        <div className="grid grid-cols-[auto_1fr_auto_80px_24px] gap-2 items-center text-xs">
                          <div className="w-7 h-7 rounded-full bg-gia-100 dark:bg-gia-900/30 flex items-center justify-center text-gia-600 dark:text-gia-400 font-bold text-[10px]">
                            {(user.displayName || user.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                              {user.displayName || 'No name'}
                            </p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                              {user.email}
                            </p>
                          </div>
                          <div className="text-right text-[9px] text-neutral-400 dark:text-neutral-600">
                            <p>{user.employeeId || '-'}</p>
                            <p>{user.department || '-'}</p>
                          </div>
                          <div className="relative">
                            <select
                              value={user.role || 'USER'}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={updating === user.id}
                              className="w-full px-2 py-1 pr-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-[9px] font-bold text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-gia-500/30 focus:border-gia-500 outline-none appearance-none disabled:opacity-50"
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                          </div>
                          <button
                            onClick={() => handleRevokeAccess(user.id, user.email)}
                            disabled={updating === user.id}
                            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 disabled:opacity-50 transition-colors"
                            title="Revoke Access"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateAccounts}
            disabled={selectedEmployees.length === 0 || creating}
            className="w-full mt-3 px-4 py-2 bg-gia-600 hover:bg-gia-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Creating accounts...
              </>
            ) : (
              <>
                <UserPlus size={14} />
                Create {selectedEmployees.length} Account{selectedEmployees.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Results count */}
        {!loading && filteredUsers.length > 0 && (
          <p className="text-[10px] text-neutral-400 dark:text-neutral-600 text-center">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        )}
      </div>
    </div>
  );
}
