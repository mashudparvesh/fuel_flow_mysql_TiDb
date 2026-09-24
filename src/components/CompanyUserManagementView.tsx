import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole, UserPermissions } from '../types';
import { isHashed } from '../utils/authSecurity';
import { TablePagination } from './TablePagination';
import { CsvExportMenu } from './CsvExportMenu';
import { exportToCsv } from '../utils/csvExporter';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Key,
  Edit2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Filter,
  Search,
  Check,
  Copy,
  Layers,
  Building2,
  Shield,
  Crown,
  AlertCircle,
  X
} from 'lucide-react';

export const CompanyUserManagementView: React.FC = () => {
  const {
    language,
    currentTenant,
    currentUser,
    allUsers,
    categories,
    addCompanyUser,
    updateCompanyUser,
    deleteCompanyUser
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formError, setFormError] = useState('');

  // New User Form State
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('supervisor');
  const [formRoleTitleBn, setFormRoleTitleBn] = useState('Fleet Supervisor');
  const [formAllowedCategories, setFormAllowedCategories] = useState<string[]>(['all']);
  const [formMustChangePassword, setFormMustChangePassword] = useState(true);
  const [formPermissions, setFormPermissions] = useState<UserPermissions>({
    can_add_fuel: true,
    can_manage_vehicles: false,
    can_manage_pumps: false,
    can_view_reports: true,
    can_manage_users: false,
    can_edit_settings: false
  });

  // Reveal password state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Company's Users
  const companyUsers = allUsers.filter(u => u.tenant_id === currentTenant.id);
  const hasExistingSuperAdmin = companyUsers.some(u => u.role === 'super_admin');

  // Filtered
  const filteredUsers = companyUsers.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchRole = roleFilter === 'all' || u.role === roleFilter;

    let matchCategory = true;
    if (categoryFilter !== 'all') {
      if (!u.allowed_category_ids || u.allowed_category_ids.includes('all')) {
        matchCategory = true;
      } else {
        matchCategory = u.allowed_category_ids.includes(categoryFilter);
      }
    }

    return matchSearch && matchRole && matchCategory;
  });

  // Pagination (Max 10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, categoryFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  const handleExportCurrentViewCsv = () => {
    const headers = ['Name', 'Username', 'Email', 'Phone', 'Role', 'Allowed Categories', 'Created Date'];
    const rows = paginatedUsers.map(u => [
      u.name,
      u.username,
      u.email,
      u.phone || '',
      u.role_title_bn || u.role,
      u.allowed_category_ids?.join('; ') || 'ALL',
      u.created_at
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Company_Users_Page_${currentPage}_(${paginatedUsers.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportAllCsv = () => {
    const headers = ['Name', 'Username', 'Email', 'Phone', 'Role', 'Allowed Categories', 'Created Date'];
    const rows = filteredUsers.map(u => [
      u.name,
      u.username,
      u.email,
      u.phone || '',
      u.role_title_bn || u.role,
      u.allowed_category_ids?.join('; ') || 'ALL',
      u.created_at
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    const isFiltered = filteredUsers.length !== companyUsers.length;
    const filterTag = isFiltered ? `Filtered_${filteredUsers.length}_of_${companyUsers.length}` : `All_${filteredUsers.length}`;
    exportToCsv(`Company_Users_${filterTag}_records_${currentTenant.code}_${dateStr}`, headers, rows);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleCategory = (catId: string) => {
    if (catId === 'all') {
      setFormAllowedCategories(['all']);
      return;
    }

    setFormAllowedCategories(prev => {
      const withoutAll = prev.filter(id => id !== 'all');
      if (withoutAll.includes(catId)) {
        const next = withoutAll.filter(id => id !== catId);
        return next.length === 0 ? ['all'] : next;
      } else {
        return [...withoutAll, catId];
      }
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setSelectedUserForEdit(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email);
    // If password is encrypted, leave formPassword blank unless user wants to reset it
    setFormPassword('');
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormRoleTitleBn(user.role_title_bn || '');
    setFormAllowedCategories(user.allowed_category_ids && user.allowed_category_ids.length > 0 ? user.allowed_category_ids : ['all']);
    setFormPermissions(user.permissions || {
      can_add_fuel: true,
      can_manage_vehicles: false,
      can_manage_pumps: false,
      can_view_reports: true,
      can_manage_users: false,
      can_edit_settings: false
    });
    setIsEditUserModalOpen(true);
  };

  // Submit Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) {
      setFormError('Name, Username and Password are required.');
      return;
    }

    if (formRole === 'super_admin' && hasExistingSuperAdmin) {
      setFormError('Only 1 Company Super Admin account is allowed per subscriber.');
      return;
    }

    const res = addCompanyUser({
      tenant_id: currentTenant.id,
      name: formName.trim(),
      username: formUsername.trim(),
      email: formEmail.trim() || `${formUsername.trim()}@${currentTenant.code.toLowerCase()}.com`,
      password: formPassword.trim(),
      phone: formPhone.trim(),
      role: formRole,
      role_title_bn: formRoleTitleBn,
      allowed_category_ids: formAllowedCategories,
      permissions: formPermissions,
      must_change_password: formMustChangePassword
    });

    if (!res.success) {
      setFormError(res.message || 'Failed to create user');
      return;
    }

    setIsAddUserModalOpen(false);
    resetForm();
  };

  // Submit Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedUserForEdit) return;

    const updates: Partial<User> = {
      name: formName.trim(),
      username: formUsername.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      role: formRole,
      role_title_bn: formRoleTitleBn,
      allowed_category_ids: formAllowedCategories,
      permissions: formPermissions
    };

    if (formPassword && formPassword.trim()) {
      updates.password = formPassword.trim();
    }

    const res = updateCompanyUser(selectedUserForEdit.id, updates);
    if (!res.success) {
      setFormError(res.message || 'Failed to update user');
      return;
    }

    setIsEditUserModalOpen(false);
    setSelectedUserForEdit(null);
    resetForm();
  };

  const resetForm = () => {
    setFormError('');
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormRole('supervisor');
    setFormRoleTitleBn('Fleet Supervisor');
    setFormAllowedCategories(['all']);
    setFormMustChangePassword(true);
    setFormPermissions({
      can_add_fuel: true,
      can_manage_vehicles: false,
      can_manage_pumps: false,
      can_view_reports: true,
      can_manage_users: false,
      can_edit_settings: false
    });
  };

  // Helper to format Category names
  const getCategoryNames = (allowedIds?: string[]) => {
    if (!allowedIds || allowedIds.length === 0 || allowedIds.includes('all')) {
      return 'All Categories';
    }
    const matched = categories.filter(c => allowedIds.includes(c.id));
    return matched.map(c => c.name).join(', ');
  };

  return (
    <div className="w-full space-y-6 transition-opacity duration-150">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white shadow-lg border border-indigo-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentTenant.name} ({currentTenant.code})</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Company Users & Category-Based Access
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            As Super Admin, create operator accounts and grant category-based access permissions to control which vehicles they can monitor and log fuel for.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddUserModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add New User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, username or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-medium"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="operator">Fuel Operator</option>
            <option value="accountant">Accountant</option>
            <option value="client_viewer">Viewer</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <CsvExportMenu
            onExportCurrentPage={handleExportCurrentViewCsv}
            onExportAll={handleExportAllCsv}
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredUsers.length / pageSize))}
            currentPageCount={paginatedUsers.length}
            totalFilteredCount={filteredUsers.length}
            totalUnfilteredCount={companyUsers.length}
            startItem={filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            endItem={Math.min(currentPage * pageSize, filteredUsers.length)}
            entityName="users"
            buttonVariant="header"
            dropDirection="down"
          />
        </div>
      </div>

      {/* Users Table / Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedUsers.map(u => {
          const showPass = visiblePasswords[u.id];
          const hasAllAccess = !u.allowed_category_ids || u.allowed_category_ids.includes('all');

          return (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                {/* User Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      {u.name}
                      {u.role === 'super_admin' && (
                        <span title="Primary Company Super Admin">
                          <Crown className="w-4 h-4 text-amber-500 inline" />
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        @{u.username}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                      u.role === 'super_admin'
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                        : 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300'
                    }`}
                  >
                    {u.role === 'super_admin' ? 'Company Super Admin' : (u.role_title_bn || u.role)}
                  </span>
                </div>

                {/* Login Credentials Box */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{u.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Password:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {showPass 
                          ? (isHashed(u.password || '') ? '•••••••• [Bcrypt Encrypted]' : u.password)
                          : '••••••••'}
                      </span>
                      {isHashed(u.password || '') ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" title="Hashed using Laravel Hash::make() bcrypt">
                          Bcrypt
                        </span>
                      ) : (
                        <button
                          onClick={() => setVisiblePasswords(p => ({ ...p, [u.id]: !p[u.id] }))}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      )}
                      {!isHashed(u.password || '') && (
                        <button
                          onClick={() => handleCopy(u.password || '', u.id + '_pass')}
                          className="text-slate-400 hover:text-amber-600 ml-1"
                          title="Copy Password"
                        >
                          {copiedId === u.id + '_pass' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CATEGORY ACCESS BADGE BOX (Key Requirement) */}
                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>Allowed Categories:</span>
                    </span>
                    {hasAllAccess ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 font-black">
                        ALL
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200/70 text-blue-900 font-black">
                        {u.allowed_category_ids?.length || 0} Categories
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug font-medium">
                    {getCategoryNames(u.allowed_category_ids)}
                  </p>
                </div>

                {/* Permission Tags */}
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {u.permissions?.can_add_fuel && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                      Fuel Entry
                    </span>
                  )}
                  {u.permissions?.can_manage_vehicles && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200">
                      Manage Vehicles
                    </span>
                  )}
                  {u.permissions?.can_manage_pumps && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200">
                      Pump Payments
                    </span>
                  )}
                  {u.permissions?.can_manage_users && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">
                      Manage Users
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-amber-600 font-bold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Access</span>
                </button>

                {u.role !== 'super_admin' ? (
                  <button
                    type="button"
                    onClick={() => setUserToDelete(u)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Primary Admin</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination & Export Controls */}
      <div className="mt-4">
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          totalUnfilteredItems={companyUsers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onExportCurrentPageCsv={handleExportCurrentViewCsv}
          onExportAllCsv={handleExportAllCsv}
          itemName="users"
        />
      </div>

      {/* ================= MODAL: ADD / EDIT COMPANY USER ================= */}
      {(isAddUserModalOpen || isEditUserModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isEditUserModalOpen
                    ? 'Edit User & Category Access'
                    : 'Create New Company User'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddUserModalOpen(false);
                  setIsEditUserModalOpen(false);
                }}
                className="text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isEditUserModalOpen ? handleSaveEditUser : handleCreateUser} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="john_supervisor"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Password & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEditUserModalOpen
                      ? 'New Password (leave blank to keep current)'
                      : 'Login Password *'}
                  </label>
                  <input
                    type="text"
                    required={!isEditUserModalOpen}
                    placeholder={isEditUserModalOpen ? 'Leave empty to retain current' : 'Enter password'}
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                  {!isEditUserModalOpen && (
                    <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMustChangePassword}
                        onChange={e => setFormMustChangePassword(e.target.checked)}
                        className="w-3.5 h-3.5 text-amber-500 rounded focus:ring-amber-500"
                      />
                      <span>Force password reset on first login (বাধ্যতামূলক পাসওয়ার্ড পরিবর্তন)</span>
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (Mobile)
                  </label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    User Role *
                  </label>
                  <select
                    value={formRole}
                    disabled={isEditUserModalOpen && selectedUserForEdit?.role === 'super_admin'}
                    onChange={e => {
                      const r = e.target.value as UserRole;
                      setFormRole(r);
                      if (r === 'super_admin') setFormRoleTitleBn('Company Super Admin');
                      else if (r === 'supervisor') setFormRoleTitleBn('Fleet Supervisor');
                      else if (r === 'operator') setFormRoleTitleBn('Fuel Operator');
                      else if (r === 'accountant') setFormRoleTitleBn('Accountant');
                      else if (r === 'client_viewer') setFormRoleTitleBn('Viewer');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {(!hasExistingSuperAdmin || (isEditUserModalOpen && selectedUserForEdit?.role === 'super_admin')) && (
                      <option value="super_admin">Company Super Admin (Only 1 per subscriber)</option>
                    )}
                    <option value="supervisor">Fleet Supervisor</option>
                    <option value="operator">Fuel Operator</option>
                    <option value="accountant">Accountant</option>
                    <option value="client_viewer">Client Viewer (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={formRoleTitleBn}
                    onChange={e => setFormRoleTitleBn(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* CATEGORY-BASED ACCESS CONTROL (The Core Requirement!) */}
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-950 dark:text-amber-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>Vehicle Category Access *</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {formAllowedCategories.includes('all') ? 'Can view all vehicles' : `${formAllowedCategories.length} Categories Selected`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  This user can only view, monitor, and log fuel entries for vehicles in the checked categories:
                </p>

                <div className="space-y-2 pt-1">
                  {/* Option: ALL */}
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#0c162d] border border-amber-200 dark:border-amber-900/50 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={formAllowedCategories.includes('all')}
                      onChange={() => handleToggleCategory('all')}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                    />
                    <span>⭐ All Vehicle Categories (No Restrictions)</span>
                  </label>

                  {/* Individual Categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categories.map(cat => {
                      const isChecked = formAllowedCategories.includes('all') || formAllowedCategories.includes(cat.id);
                      return (
                        <label
                          key={cat.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-amber-100/60 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white font-bold'
                              : 'bg-white dark:bg-[#0c162d] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCategory(cat.id)}
                            className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                          />
                          <span className="truncate">{cat.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Functional Permissions */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  System Action Permissions:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formPermissions.can_add_fuel}
                      onChange={e => setFormPermissions(p => ({ ...p, can_add_fuel: e.target.checked }))}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    <span>Fuel Entry</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formPermissions.can_manage_vehicles}
                      onChange={e => setFormPermissions(p => ({ ...p, can_manage_vehicles: e.target.checked }))}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    <span>Manage Vehicles</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formPermissions.can_manage_pumps}
                      onChange={e => setFormPermissions(p => ({ ...p, can_manage_pumps: e.target.checked }))}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    <span>Pump Payments</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formPermissions.can_view_reports}
                      onChange={e => setFormPermissions(p => ({ ...p, can_view_reports: e.target.checked }))}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    <span>Reports & Export</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formPermissions.can_manage_users}
                      onChange={e => setFormPermissions(p => ({ ...p, can_manage_users: e.target.checked }))}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    <span>Manage Users</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserModalOpen(false);
                    setIsEditUserModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
                >
                  {isEditUserModalOpen ? 'Save Updates' : 'Confirm User Creation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL: CONFIRM DELETE USER ================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to permanently delete user <strong className="text-slate-900 dark:text-white">{userToDelete.name}</strong> (@{userToDelete.username})? They will immediately lose access to this workspace.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteCompanyUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
