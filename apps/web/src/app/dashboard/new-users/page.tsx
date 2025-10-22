'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { UserPlus, Mail, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { safeString, sanitizeUserForDisplay } from '@/lib/typeGuards';

export default function NewUsersPage() {
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

  const { data: newUsersData, isLoading, refetch } = trpc.users.listNewUsers.useQuery(undefined, {
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

  const markAsReviewedMutation = trpc.users.markUserAsReviewed.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User marked as reviewed',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark user as reviewed',
        variant: 'destructive',
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleMarkAsReviewed = (userId: string) => {
    markAsReviewedMutation.mutate({ userId });
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
          <UserPlus className="h-6 w-6 sm:h-8 sm:w-8" />
          New Users
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Review and manage newly registered users (Super Admin only)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Pending New Users</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {newUsersData?.total === 0
              ? 'No new users to review'
              : `${newUsersData?.total || 0} new user${newUsersData?.total !== 1 ? 's' : ''} awaiting review`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : newUsersData?.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No new users to review</p>
              <p className="text-xs mt-2">All users have been reviewed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead className="min-w-[120px]">Role</TableHead>
                    <TableHead className="min-w-[150px]">Joined</TableHead>
                    <TableHead className="min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newUsersData?.items.map((userData: any) => {
                    // Sanitize user data for safe rendering
                    const sanitized = sanitizeUserForDisplay(userData);
                    const userId = safeString(sanitized.id, 'unknown');
                    const email = safeString(sanitized.email, '[No Email]');
                    const userRole = safeString(sanitized.role, 'admin');
                    const createdAt = sanitized.createdAt;

                    return (
                      <TableRow key={userId} className="bg-blue-50/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                              <Mail className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{email}</p>
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 mt-1">
                                🆕 New User
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            {userRole === 'admin' ? 'Admin' : userRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {createdAt
                              ? format(toDate(createdAt), 'MMM d, yyyy HH:mm')
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={userRole}
                              onValueChange={(value) =>
                                handleRoleChange(userId, value as 'user' | 'admin' | 'superadmin')
                              }
                              disabled={updateRoleMutation.isPending || markAsReviewedMutation.isPending}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsReviewed(userId)}
                              disabled={markAsReviewedMutation.isPending || updateRoleMutation.isPending}
                              className="gap-1"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Approve</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            New User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
          <p>• New users are automatically created with <strong>Admin</strong> role</p>
          <p>• You can change their role before approving them</p>
          <p>• Click <strong>Approve</strong> to mark them as reviewed and remove from this list</p>
          <p>• Approved users will appear in the main User Management page</p>
          <p>• All new user registrations appear here for your review</p>
        </CardContent>
      </Card>
    </div>
  );
}

