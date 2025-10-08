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
    values: profile || undefined,
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
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Your company's basic details</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Company Name</Label>
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
                  <Label htmlFor="taxId">Tax ID / Business Registration Number</Label>
                  <Input
                    id="taxId"
                    placeholder="12-3456789"
                    {...register('taxId')}
                    className={errors.taxId ? 'border-destructive' : ''}
                  />
                  {errors.taxId && (
                    <p className="text-sm text-destructive">{errors.taxId.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Business Address</Label>
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
              </CardContent>
            </Card>

            {/* Bank Information */}
            <Card>
              <CardHeader>
                <CardTitle>Bank Information</CardTitle>
                <CardDescription>For invoice payment details</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="Bank of Example"
                    {...register('bankInfo.bankName')}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="Your Company Ltd."
                    {...register('bankInfo.accountName')}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="1234567890"
                    {...register('bankInfo.accountNumber')}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
                  <Input
                    id="swiftCode"
                    placeholder="ABCD1234"
                    {...register('bankInfo.swiftCode')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How clients can reach you</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@yourcompany.com"
                    {...register('contactInfo.email')}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 234 567 8900"
                    {...register('contactInfo.phone')}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourcompany.com"
                    {...register('contactInfo.website')}
                  />
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

