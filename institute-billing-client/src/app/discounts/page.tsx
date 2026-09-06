'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent, Plus, Tag, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/axios';

export default function DiscountsManagementPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [type, setType] = React.useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [value, setValue] = React.useState('');
  const [reason, setReason] = React.useState('');

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts'],
    queryFn: async () => {
      const res = await api.get('/discounts');
      return res.data;
    },
  });

  const createDiscountMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        type,
        value: Number(value),
        reason: reason.trim() || undefined,
      };
      const res = await api.post('/discounts', payload);
      return res.data;
    },
    onSuccess: (data) => {
      success('Discount Created', `${data.name} is now available for course enrollments.`);
      setIsModalOpen(false);
      setName('');
      setCode('');
      setValue('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
    onError: (err: any) => {
      error('Error', err.response?.data?.message || 'Failed to create discount');
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Percent className="h-6 w-6 text-primary" />
              <span>Dynamic Discounts Engine</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure student loyalty discounts (e.g. Previous Student Discount), promotional discounts, and scholarships.
            </p>
          </div>

          <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Discount</span>
          </Button>
        </div>

        {/* Discounts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.map((d: any) => (
            <Card key={d.id} className="hover:border-primary/50 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {d.code}
                  </Badge>
                  <Badge variant={d.type === 'PERCENTAGE' ? 'info' : 'success'} className="text-xs">
                    {d.type === 'PERCENTAGE' ? `${d.value}% Off` : `LKR ${Number(d.value).toLocaleString()}`}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2">{d.name}</CardTitle>
                <CardDescription className="text-xs">
                  {d.reason || 'No specific condition listed.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active Rule
                </span>
                <span>Created {new Date(d.createdAt).toLocaleDateString()}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal: Create Discount */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Dynamic Discount Rule"
          description="Create a fixed deduction or percentage discount for student registrations."
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Discount Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Previous Student Discount"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Discount Code (Optional)
              </label>
              <Input
                placeholder="e.g. RETURNING5K"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Discount Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('FIXED')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                      type === 'FIXED'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Fixed (LKR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('PERCENTAGE')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                      type === 'PERCENTAGE'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Percent (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Value <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  placeholder={type === 'FIXED' ? 'e.g. 5000' : 'e.g. 10'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Reason / Eligibility Criteria
              </label>
              <Input
                placeholder="e.g. For returning alumni enrolling in specialized courses"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createDiscountMutation.mutate()}
                disabled={createDiscountMutation.isPending || !name.trim() || !value}
              >
                {createDiscountMutation.isPending ? 'Saving...' : 'Save Discount'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
