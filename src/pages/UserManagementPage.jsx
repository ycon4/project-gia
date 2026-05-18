import { useState, useEffect, useRef } from 'react';
import { Search, UserCog, Shield, ShieldCheck, User, Loader2, UserPlus, X, ChevronDown, Upload, Trash2, UserX, MoreVertical, BarChart2, AlertTriangle, CheckCircle } from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, writeBatch, getDocs, setDoc } from 'firebase/firestore';
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
  const [statsOpen, setStatsOpen] = useState(false);
  const menuRef = useRef(null);
  const statsRef = useRef(null);

  // Clean Modal Configuration State
  const [modalConfig, setModalConfig] = useState(null);

  // Reusable lightweight modal launcher
  const showAlert = (title, message, type = 'success', onConfirm = null) => {
    setModalConfig({ title, message, type, onConfirm });
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (statsRef.current && !statsRef.current.contains(event.target)) setStatsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load all users from Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      showAlert('Error Loading Users', 'Failed to read data from database records.', 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load employees from directory
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'user_directory')), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Filter users based on search term — ONLY include Active users on the right side ledger
  useEffect(() => {
    const activeUsersOnly = users.filter(u => u.status === 'Active');

    if (!searchTerm.trim()) {
      setFilteredUsers(activeUsersOnly);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(activeUsersOnly.filter(u =>
        u.email?.toLowerCase().includes(term) ||
        u.displayName?.toLowerCase().includes(term) ||
        u.employeeId?.toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, users]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleRoleChange = (userId, newRole) => {
    showAlert(
      'Change User Role?',
      `Are you sure you want to adjust this user's clearance level to ${newRole}?`,
      'confirm',
      async () => {
        setUpdating(userId);
        try {
          await updateDoc(doc(db, 'users', userId), {
            role: newRole,
            updatedAt: serverTimestamp(),
          });
          showAlert('Role Updated', `The account has successfully been set to ${newRole}.`, 'success');
        } catch (error) {
          showAlert('Update Failed', 'Could not apply role shifts to the server database.', 'error');
        } finally {
          setUpdating(null);
        }
      }
    );
  };

  // Compute who is available for assignment inside the allocation dropdown drawer
  const availableEmployees = employees.filter(emp => {
    const existingUser = users.find(u => u.email?.toLowerCase() === emp.email?.toLowerCase());
    // Safe clearance allocation state filtering: Only hide them if they are actively authorized
    const hasActiveAccount = existingUser && existingUser.status === 'Active';
    const isSelected = selectedEmployees.some(s => s.id === emp.id);
    const matchesSearch = !employeeSearch.trim() ||
      emp.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.email?.toLowerCase().includes(employeeSearch.toLowerCase());

    return !hasActiveAccount && !isSelected && matchesSearch;
  });

  const handleSelectEmployee = (employee) => {
    const rawEmail = employee.email || '';
    const historicalMatch = users.find(u => u.email?.toLowerCase() === rawEmail.toLowerCase());

    setSelectedEmployees(prev => [
      ...prev,
      {
        ...employee,
        assignedRole: historicalMatch?.role || 'SECRETARIAT'
      }
    ]);
  };

  const handleRemoveEmployee = (employeeId) => {
    setSelectedEmployees(prev => prev.filter(e => e.id !== employeeId));
  };

  const handleRoleAssignment = (employeeId, role) => {
    setSelectedEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, assignedRole: role } : e));
  };

  const handleCreateAccounts = () => {
    if (selectedEmployees.length === 0) return;
    showAlert(
      'Grant Access Authority?',
      `This will activate or restore ${selectedEmployees.length} workspace account(s).`,
      'confirm',
      async () => {
        setCreating(true);
        try {
          const toCreate = [];
          const toReactivate = [];

          selectedEmployees.forEach(emp => {
            const existingUser = users.find(u => u.email?.toLowerCase() === emp.email?.toLowerCase());
            if (existingUser) {
              toReactivate.push({ ...emp, userId: existingUser.id });
            } else {
              toCreate.push(emp);
            }
          });

          let totalSuccess = 0;
          let legacyHealed = 0;

          // Re-activate existing records without structural loss
          if (toReactivate.length > 0) {
            for (const emp of toReactivate) {
              try {
                await updateDoc(doc(db, 'users', emp.userId), {
                  status: 'Active',
                  role: emp.assignedRole,
                  unlockedAt: serverTimestamp(),
                  reactivatedBy: auth.currentUser?.uid,
                  updatedAt: serverTimestamp(),
                });
                totalSuccess++;
              } catch (e) {
                console.error("Reactivation exception timeline:", e);
              }
            }
          }

          // Spin up standard system configurations for pristine new accounts
          if (toCreate.length > 0) {
            const authResult = await batchCreateAccounts(
              toCreate.map(emp => ({
                email: emp.email,
                displayName: emp.name || emp.email?.split('@')[0],
                role: emp.assignedRole,
                employeeId: emp.employeeId,
                department: emp.department,
              })),
              'GIA2026'
            );

            if (authResult.successful.length > 0) {
              const firestoreResult = await batchCreateUserDocuments(authResult.successful, auth.currentUser?.uid);
              totalSuccess += firestoreResult.successful.length;
            }

            const orphanedAccounts = authResult.failed.filter(f => f.error === 'Email already exists' || f.error?.includes('already in use'));
            if (orphanedAccounts.length > 0) {
              for (const orphan of orphanedAccounts) {
                const matchedEmp = toCreate.find(e => e.email?.toLowerCase() === orphan.email?.toLowerCase());
                if (matchedEmp) {
                  try {
                    const customDocId = matchedEmp.employeeId || doc(collection(db, 'users')).id;
                    await setDoc(doc(db, 'users', customDocId), {
                      email: matchedEmp.email,
                      displayName: matchedEmp.name || matchedEmp.email.split('@')[0],
                      role: matchedEmp.assignedRole,
                      employeeId: matchedEmp.employeeId || '',
                      department: matchedEmp.department || '',
                      status: 'Active',
                      createdAt: serverTimestamp(),
                      createdBy: auth.currentUser?.uid || 'SYSTEM',
                      updatedAt: serverTimestamp(),
                    });
                    legacyHealed++;
                    totalSuccess++;
                  } catch (err) {
                    console.error("Legacy tracking assignment error:", err);
                  }
                }
              }
            }
          }

          setSelectedEmployees([]);
          let summaryMessage = `Successfully provisioned credentials for ${totalSuccess} structural account profile(s).`;
          if (legacyHealed > 0) summaryMessage += ` Unfroze ${legacyHealed} legacy data references.`;

          showAlert('Process Completed', summaryMessage, 'success');
        } catch (error) {
          console.error("Critical execution breakdown:", error);
          showAlert('Execution Failure', 'Critical failure during batch server account generation sweeps.', 'error');
        } finally {
          setCreating(false);
        }
      }
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      if (jsonData.length === 0) {
        showAlert('Empty File', 'No structured data inputs found inside this spreadsheet.', 'error');
        setUploading(false);
        return;
      }

      const batch = writeBatch(db);
      jsonData.forEach((row) => {
        const docRef = doc(collection(db, 'user_directory'));
        batch.set(docRef, {
          name: row['Staff Name'] || row.name || row.Name || '',
          email: row['Email Address'] || row.email || row.Email || '',
          employeeId: row['Employee ID'] || row.employeeId || row.id || '',
          department: row['Department'] || row.department || '',
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
      showAlert('Upload Successful', `Added ${jsonData.length} clean employee maps to the workspace directory database.`, 'success');
    } catch (error) {
      showAlert('Upload Error', 'Failed to parse file structural columns cleanly.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDirectory = () => {
    showAlert(
      'Purge Entire Directory?',
      'CRITICAL: This permanently removes all unassigned employee lookup indices from the database repository. This cannot be undone.',
      'error',
      async () => {
        setUploading(true);
        try {
          const batch = writeBatch(db);
          const snapshot = await getDocs(collection(db, 'user_directory'));

          snapshot.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          showAlert('Directory Cleared', 'The temporary directory search cache index is now completely empty.', 'success');
        } catch (error) {
          showAlert('Purge Failed', 'Error wiping background lookup indices cleanly.', 'error');
        } finally {
          setUploading(false);
        }
      }
    );
  };

  const handleRevokeAccess = (userId, userEmail) => {
    if (userId === auth.currentUser?.uid) {
      showAlert('Action Blocked', 'You cannot revoke authorization clearance for your active operating dashboard profile.', 'error');
      return;
    }

    const user = users.find(u => u.id === userId);
    const activeAdmins = users.filter(u => u.role === 'ADMIN' && u.status === 'Active');
    if (user?.role === 'ADMIN' && activeAdmins.length === 1) {
      showAlert('Action Blocked', 'System security profiles require keeping at least one active Root Administrator account running.', 'error');
      return;
    }

    showAlert(
      'Suspend Security Clearance?',
      `Revoking ${userEmail} will immediately suspend their application access keys. History tracking data metrics remain frozen securely.`,
      'error',
      async () => {
        setUpdating(userId);
        try {
          await updateDoc(doc(db, 'users', userId), {
            status: 'Revoked',
            revokedAt: serverTimestamp(),
            revokedBy: auth.currentUser?.uid,
            updatedAt: serverTimestamp(),
          });
          showAlert('Access Suspended', `${userEmail} has been logged out and returned to directory logs.`, 'success');
        } catch (error) {
          showAlert('Revocation Failed', 'Failed to adjust system status flags for the target account record.', 'error');
        } finally {
          setUpdating(null);
        }
      }
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 bg-neutral-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ========================================================================= */}
        {/* AESTHETIC HIGH-FIDELITY CUSTOM MODAL INJECTION                            */}
        {/* ========================================================================= */}
        {modalConfig && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl scale-up tracking-tight">
              <div className="flex flex-col items-center text-center">
                {modalConfig.type === 'success' && <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-full mb-3"><CheckCircle className="text-emerald-500 w-6 h-6" /></div>}
                {modalConfig.type === 'error' && <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-full mb-3"><AlertTriangle className="text-rose-500 w-6 h-6" /></div>}
                {modalConfig.type === 'confirm' && <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-full mb-3"><UserPlus className="text-purple-500 w-6 h-6" /></div>}

                <h3 className="font-black text-base text-neutral-900 dark:text-neutral-100">{modalConfig.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1.5 leading-relaxed px-2">{modalConfig.message}</p>
              </div>

              <div className="mt-5 flex gap-2">
                {(modalConfig.type === 'confirm' || modalConfig.type === 'error') && modalConfig.onConfirm ? (
                  <>
                    <button onClick={() => setModalConfig(null)} className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl transition-all">Cancel</button>
                    <button onClick={() => { const cb = modalConfig.onConfirm; setModalConfig(null); if (cb) cb(); }} className={`flex-1 py-2 font-bold text-xs text-white rounded-xl transition-all shadow-md ${modalConfig.type === 'error' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-purple-600 hover:bg-purple-700'}`}>Confirm</button>
                  </>
                ) : modalConfig.onConfirm ? (
                  <>
                    <button onClick={() => setModalConfig(null)} className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl transition-all">Cancel</button>
                    <button onClick={() => { const cb = modalConfig.onConfirm; setModalConfig(null); cb(); }} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 font-bold text-xs text-white rounded-xl transition-all shadow-md">Continue</button>
                  </>
                ) : (
                  <button onClick={() => setModalConfig(null)} className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs rounded-xl transition-all shadow-md">Dismiss</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header Dashboard Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">User Management</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage user roles and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats Drawer Dropdown */}
            <div className="relative" ref={statsRef}>
              <button onClick={() => setStatsOpen(!statsOpen)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-bold transition-all shadow-sm">
                <BarChart2 size={16} />Stats
              </button>
              {statsOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-30">
                  <div className="p-3 bg-purple-50/50 dark:from-purple-900/20 border-b-2 border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">User Statistics</h3>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <div className="flex items-center justify-between px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg">
                      <div className="flex items-center gap-2"><User size={14} className="text-neutral-500" /><span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Active Access</span></div>
                      <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">{users.filter(u => u.status === 'Active').length}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-purple-500" /><span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Admin Staff</span></div>
                      <span className="text-sm font-black text-purple-900 dark:text-purple-100">{users.filter(u => u.role === 'ADMIN' && u.status === 'Active').length}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2"><Shield size={14} className="text-blue-500" /><span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Secretariat</span></div>
                      <span className="text-sm font-black text-blue-900 dark:text-blue-100">{users.filter(u => u.role === 'SECRETARIAT' && u.status === 'Active').length}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                      <div className="flex items-center gap-2"><UserX size={14} className="text-rose-500" /><span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Suspended</span></div>
                      <span className="text-sm font-black text-rose-900 dark:text-rose-100">{users.filter(u => u.status === 'Revoked').length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20">
              <Loader2 size={16} className={loading ? 'animate-spin' : 'hidden'} />Refresh
            </button>
          </div>
        </div>

        {/* Double Dashboard Configuration Workspaces */}
        <div className="grid md:grid-cols-[400px_1fr] gap-6">

          {/* LEFT PANEL: Directory Lookup & Profiling */}
          <div className="bg-gradient-to-br from-white to-purple-50/30 dark:from-neutral-900 dark:to-purple-900/10 border-2 border-purple-200 dark:border-purple-800/50 rounded-xl p-4 shadow-lg flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30"><UserPlus size={16} className="text-white" /></div>
              <div className="flex-1">
                <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-100">Provision Workspace</h2>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Select unassigned or revoked profiles</p>
              </div>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-all"><MoreVertical size={14} /></button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg shadow-2xl overflow-hidden z-30">
                    <label className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                      <Upload size={13} className="text-neutral-500" /><span>Upload Excel</span>
                      <input type="file" accept=".xlsx,.xls" onChange={(e) => { handleFileUpload(e); setMenuOpen(false); }} disabled={uploading} className="hidden" />
                    </label>
                    <button onClick={() => { handleDeleteDirectory(); setMenuOpen(false); }} disabled={uploading || employees.length === 0} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"><Trash2 size={13} /><span>Clear Directory</span></button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3 relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-neutral-400 z-10" />
              <input type="text" placeholder="Search directory pool..." value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} className="w-full pl-8 pr-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/30 outline-none transition-all placeholder:text-neutral-400" />

              {employeeSearch && availableEmployees.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border-2 border-purple-200 dark:border-purple-800/50 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-20 p-1">
                  {availableEmployees.slice(0, 15).map(emp => (
                    <button key={emp.id} onClick={() => { handleSelectEmployee(emp); setEmployeeSearch(''); }} className="w-full px-3 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all rounded-lg group flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-xs">{(emp.name || '?')[0].toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-purple-600">{emp.name || 'Unnamed Record'}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{emp.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selection Bucket List */}
            <div className="flex-1 flex flex-col min-h-0 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Selected Queue</p>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">{selectedEmployees.length}</span>
              </div>
              <div className="flex-1 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl overflow-y-auto bg-neutral-50 dark:bg-neutral-800/30 p-2 space-y-1.5">
                {selectedEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-neutral-400">
                    <UserPlus size={20} className="mb-1 text-neutral-300" />
                    <p className="text-xs font-bold">Queue is currently empty</p>
                  </div>
                ) : (
                  selectedEmployees.map(emp => (
                    <div key={emp.id} className="p-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 font-bold text-xs flex items-center justify-center">{(emp.name || '?')[0].toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{emp.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{emp.email}</p>
                        </div>
                        <button onClick={() => handleRemoveEmployee(emp.id)} className="p-1 text-neutral-400 hover:text-rose-500"><X size={12} /></button>
                      </div>

                      <div className="relative">
                        <select value={emp.assignedRole} onChange={(e) => handleRoleAssignment(emp.id, e.target.value)} className="w-full px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-[10px] font-bold outline-none appearance-none pr-6 cursor-pointer">
                          <option value="SECRETARIAT">Secretariat</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button onClick={handleCreateAccounts} disabled={selectedEmployees.length === 0 || creating} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Grant / Restore Access Authorization
            </button>
          </div>

          {/* RIGHT PANEL: Approved Accounts Ledger (Only active users visible) */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm flex flex-col h-[580px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-neutral-900 text-white rounded-lg"><UserCog size={16} /></div>
                <div>
                  <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-100">Approved Accounts Ledger</h2>
                  <p className="text-[10px] text-neutral-400">{filteredUsers.length} Active profiles</p>
                </div>
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-2.5 text-neutral-400" />
                <input type="text" placeholder="Search active accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/30 outline-none w-56" />
              </div>
            </div>

            <div className="flex-1 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-800/20 p-2 overflow-y-auto space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400">
                  <User size={24} className="mb-1" />
                  <p className="text-xs font-bold">No active authorization profiles found</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div key={user.id} className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-black text-xs flex items-center justify-center text-neutral-700 dark:text-neutral-300">{(user.displayName || user.email || '?')[0].toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">{user.displayName || 'No name profile'}</p>
                          <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">ACTIVE</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <select value={user.role || 'SECRETARIAT'} onChange={(e) => handleRoleChange(user.id, e.target.value)} disabled={updating === user.id} className="pl-2 pr-6 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-[10px] font-bold outline-none appearance-none disabled:opacity-40 cursor-pointer">
                          <option value="SECRETARIAT">Secretariat</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                      </div>
                      <button onClick={() => handleRevokeAccess(user.id, user.email)} disabled={updating === user.id} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-all" title="Revoke Clearance">
                        <UserX size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}