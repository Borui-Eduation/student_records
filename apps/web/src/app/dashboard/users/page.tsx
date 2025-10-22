'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
// import type { User } from '@professional-workspace/shared/dist/types/user';
import { Shield, User as UserIcon, Mail, Calendar, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { toDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const { userRole, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Check if user is super admin
  useEffect(() => {
    if (!authLoading && userRole !== 'superadmin') {
      router.push('/dashboard');
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
    }
  }, [userRole, authLoading, router, toast]);

  const { data: usersData, isLoading, refetch } = trpc.users.listUsers.useQuery(undefined, {
    enabled: userRole === 'superadmin',
  });

  const { data: newUsersCountData } = trpc.users.getNewUsersCount.useQuery(undefined, {
    enabled: userRole === 'superadmin',
  });

  const updateRoleMutation = trpc.users.updateUserRole.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  if (authLoading || userRole !== 'superadmin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
          User Management
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage user roles and permissions (Super Admin only)
        </p>
      </div>

      {newUsersCountData && newUsersCountData.count > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm text-blue-900">
                  {newUsersCountData.count} new user{newUsersCountData.count !== 1 ? 's' : ''} awaiting review
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Go to <strong>New Users</strong> page to review and approve them
                </p>
              </div>
              <a
                href="/dashboard/new-users"
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-3 w-3" />
                Review
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Users</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            View and manage user roles. Total users: {usersData?.total || 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead className="min-w-[120px]">Role</TableHead>
                    <TableHead className="min-w-[150px]">Joined</TableHead>
                    <TableHead className="min-w-[150px]">Last Login</TableHead>
                    <TableHead className="min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.items.map((userData: any) => {
                    const isCurrentUser = userData.id === user?.uid;
                    const userRole = userData.role || 'user';
                    
                    return (
                      <TableRow key={userData.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                              <Mail className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{userData.email}</p>
                              <div className="flex gap-1 mt-1">
                                {isCurrentUser && (
                                  <Badge variant="outline" className="text-xs">
                                    You
                                  </Badge>
                                )}
                                {userData.isNewUser && (
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                    🆕 New
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={userRole === 'superadmin' ? 'default' : userRole === 'admin' ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                          >
                            {userRole === 'superadmin' ? (
                              <>
                                <Shield className="h-3 w-3" />
                                Super Admin
                              </>
                            ) : userRole === 'admin' ? (
                              <>
                                <Shield className="h-3 w-3 opacity-70" />
                                Admin
                              </>
                            ) : (
                              <>
                                <UserIcon className="h-3 w-3" />
                                User
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {userData.createdAt
                              ? format(toDate(userData.createdAt), 'MMM d, yyyy')
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {userData.lastLoginAt
                              ? format(toDate(userData.lastLoginAt), 'MMM d, yyyy HH:mm')
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={userRole}
                            onValueChange={(value) =>
                              handleRoleChange(userData.id, value as 'user' | 'admin' | 'superadmin')
                            }
                            disabled={isCurrentUser || updateRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-3 w-3" />
                                  User
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3 w-3 opacity-70" />
                                  Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="superadmin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3 w-3" />
                                  Super Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {usersData?.items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
          <p>• <strong>User</strong>: Limited role. Can only view their own data.</p>
          <p>• <strong>Admin</strong>: Default role for new users. Can access dashboard and manage their own data.</p>
          <p>• <strong>Super Admin</strong>: Full access. Can manage all users and view all data.</p>
          <p>• You cannot change your own role (security measure)</p>
          <p>• New users are automatically created with Admin role</p>
          <p>• Role changes take effect immediately</p>
        </CardContent>
      </Card>
    </div>
  );
}

