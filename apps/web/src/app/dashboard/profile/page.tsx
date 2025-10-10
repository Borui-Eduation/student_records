'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateCompanyProfileSchema, type UpdateCompanyProfileInput } from '@student-record/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Building2 } from 'lucide-react';

export default function CompanyProfilePage() {
  const { data: profile, isLoading } = trpc.companyProfile.get.useQuery();
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCompanyProfileInput>({
    resolver: zodResolver(UpdateCompanyProfileSchema),
    values: (profile && 'companyName' in profile) ? {
      companyName: profile.companyName,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      website: profile.website,
      logoUrl: profile.logoUrl,
    } : undefined,
  });

  const updateMutation = trpc.companyProfile.update.useMutation({
    onSuccess: () => {
      utils.companyProfile.get.invalidate();
    },
  });

  const onSubmit = async (data: UpdateCompanyProfileInput) => {
    await updateMutation.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Profile</h1>
        <p className="text-muted-foreground">
          Manage your company information for invoices and documents
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6">
            {/* Basic Information - Simplified for personal/small business use */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Your business details (all fields optional)</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Company Name (Optional)</Label>
                  <Input
                    id="companyName"
                    placeholder="Your Company Ltd."
                    {...register('companyName')}
                    className={errors.companyName ? 'border-destructive' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">{errors.companyName.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@yourcompany.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    placeholder="+1 234 567 8900"
                    {...register('phone')}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Business Address (Optional)</Label>
                  <Textarea
                    id="address"
                    placeholder="123 Main St, City, State, ZIP"
                    {...register('address')}
                    className={errors.address ? 'border-destructive' : ''}
                    rows={3}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourcompany.com"
                    {...register('website')}
                    className={errors.website ? 'border-destructive' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive">{errors.website.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? 'Saving...' : 'Save Company Profile'}
              </Button>
            </div>

            {updateMutation.isSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                ✓ Company profile updated successfully!
              </div>
            )}

            {updateMutation.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                Error: {updateMutation.error.message}
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}


