
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, X, Trash2 } from 'lucide-react';
import type { Role } from '@/config';
import { ALL_ROLES_ARRAY } from '@/config';
import { useAuth } from '@/hooks/useAuth';

const ALL_FILTER_VALUE = "__ALL__"; // Unique value for "All" options

export interface UserFilters {
  search?: string;
  plan?: string;
  status?: 'active' | 'suspended' | 'inactive' | '';
  role?: Role | '';
}

interface UserTableToolbarProps {
  filters: UserFilters;
  onFilterChange: (newFilters: Partial<UserFilters>) => void;
  availablePlans: Array<{ value: string; label: string }>;
  openMultipleUserRemoveDialog: () => void;
  selectedUsers: { id: String, name: String }[] | any;
}

const statusOptions: Array<{ value: UserFilters['status'] | typeof ALL_FILTER_VALUE; label: string }> = [
  { value: ALL_FILTER_VALUE, label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
];

const roleOptions: Array<{ value: UserFilters['role'] | typeof ALL_FILTER_VALUE; label: string }> = [
  { value: ALL_FILTER_VALUE, label: 'All Roles' },
  ...ALL_ROLES_ARRAY.map(role => ({ value: role, label: role })),
];


export default function UserTableToolbar({ filters, onFilterChange, availablePlans, openMultipleUserRemoveDialog, selectedUsers }: UserTableToolbarProps) {

  const planOptions = [
    { value: ALL_FILTER_VALUE, label: 'All Plans' },
    ...availablePlans
  ];
  
  const { hasPermission } = useAuth(); 
  const canDeleteUsers = hasPermission('deleteUser');

  const handleInputChange = (key: keyof UserFilters, value: string | undefined) => {
    onFilterChange({ [key]: value === ALL_FILTER_VALUE || value === '' ? undefined : value });
  };

  const activeFilterCount = Object.values(filters).filter(value => value && value !== '' && value !== ALL_FILTER_VALUE).length;

  const clearFilters = () => {
    onFilterChange({ search: undefined, plan: undefined, status: undefined, role: undefined });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-4">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name or email..."
          value={filters.search || ''}
          onChange={(e) => handleInputChange('search', e.target.value)}
          className="pl-8 w-full"
        />
      </div>

      <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
        {
          canDeleteUsers && (
            <Button
              variant="destructive"
              onClick={openMultipleUserRemoveDialog}
              disabled={selectedUsers.length <= 0}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Users
            </Button>
          )
        }
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto relative">
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="plan-filter" className="text-sm font-medium">Plan</Label>
                <Select
                  value={filters.plan || ALL_FILTER_VALUE}
                  onValueChange={(value) => handleInputChange('plan', value)}
                >
                  <SelectTrigger id="plan-filter" className="mt-1">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
                <Select
                  value={filters.status || ALL_FILTER_VALUE}
                  onValueChange={(value) => handleInputChange('status', value as UserFilters['status'] | typeof ALL_FILTER_VALUE)}
                >
                  <SelectTrigger id="status-filter" className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value!}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role-filter" className="text-sm font-medium">Role</Label>
                <Select
                  value={filters.role || ALL_FILTER_VALUE}
                  onValueChange={(value) => handleInputChange('role', value as UserFilters['role'] | typeof ALL_FILTER_VALUE)}
                >
                  <SelectTrigger id="role-filter" className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(option => (
                      <SelectItem key={option.value} value={option.value!}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-destructive hover:text-destructive">
                  <X className="mr-2 h-4 w-4" /> Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
