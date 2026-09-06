'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/axios';

const DEFAULT_COURSE_THUMBNAIL =
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80';

export default function CoursesManagementPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // New Course Form State
  const [courseName, setCourseName] = React.useState('');
  const [courseCode, setCourseCode] = React.useState('');
  const [coursePrice, setCoursePrice] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [thumbnailUrl, setThumbnailUrl] = React.useState('');
  const [description, setDescription] = React.useState('');

  // Installment Scheme for course
  const [hasScheme, setHasScheme] = React.useState(true);
  const [schemeName, setSchemeName] = React.useState('Standard Scheme');
  const [numInstallments, setNumInstallments] = React.useState(3);
  const [steps, setSteps] = React.useState<Array<{ title: string; amount: number; days: number }>>([
    { title: '1st Installment (Registration)', amount: 10000, days: 0 },
    { title: '2nd Installment', amount: 7500, days: 30 },
    { title: '3rd Installment (Final)', amount: 7500, days: 60 },
  ]);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return res.data;
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: courseName.trim(),
        code: courseCode.trim() || undefined,
        basePrice: Number(coursePrice),
        duration: duration.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        description: description.trim() || undefined,
      };

      if (hasScheme && steps.length > 0) {
        payload.schemes = [
          {
            name: schemeName,
            numberOfInstallments: steps.length,
            isDefault: true,
            breakdownJson: steps.map((s, idx) => ({
              step: idx + 1,
              title: s.title,
              amount: Number(s.amount),
              daysAfterEnrollment: Number(s.days),
            })),
          },
        ];
      }

      const res = await api.post('/courses', payload);
      return res.data;
    },
    onSuccess: (data) => {
      success('Course Created!', `${data.name} has been added.`);
      setIsAddModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (err: any) => {
      error('Error', err.response?.data?.message || 'Failed to create course');
    },
  });

  const resetForm = () => {
    setCourseName('');
    setCourseCode('');
    setCoursePrice('');
    setDuration('');
    setThumbnailUrl('');
    setDescription('');
    setSteps([
      { title: '1st Installment', amount: 10000, days: 0 },
      { title: '2nd Installment', amount: 7500, days: 30 },
      { title: '3rd Installment', amount: 7500, days: 60 },
    ]);
  };

  const handleStepChange = (index: number, field: string, val: any) => {
    const next = [...steps];
    next[index] = { ...next[index], [field]: val };
    setSteps(next);
  };

  const addStep = () => {
    setSteps([...steps, { title: `Installment #${steps.length + 1}`, amount: 5000, days: steps.length * 30 }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span>Courses & Installment Schemes</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure academy courses, base fees (LKR), thumbnail images, and flexible installment breakdown schemes.
            </p>
          </div>

          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Course</span>
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => {
            const scheme = course.schemes?.[0];
            let schemeSteps = [];
            try {
              if (scheme?.breakdownJson) schemeSteps = JSON.parse(scheme.breakdownJson);
            } catch (e) {}

            return (
              <Card key={course.id} className="overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs">
                <div>
                  <div className="relative h-44 w-full bg-muted overflow-hidden">
                    <img
                      src={course.thumbnailUrl || DEFAULT_COURSE_THUMBNAIL}
                      alt={course.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-black/60 text-white backdrop-blur-md border-0 font-mono text-[11px]">
                        {course.code}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {course.duration || 'Flexible'}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 text-xs">
                      {course.description || 'No description provided.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="pt-2 border-t border-border flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Base Fee:</span>
                      <span className="font-mono text-lg font-bold text-foreground">
                        LKR {Number(course.basePrice).toLocaleString()}
                      </span>
                    </div>

                    {/* Scheme preview */}
                    {schemeSteps.length > 0 && (
                      <div className="p-2.5 bg-muted/40 rounded-lg text-xs space-y-1">
                        <div className="font-semibold text-[11px] text-muted-foreground flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          <span>Scheme: {scheme.name} ({schemeSteps.length} parts)</span>
                        </div>
                        <div className="space-y-0.5 text-[11px] font-mono text-muted-foreground">
                          {schemeSteps.map((s: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>{s.title}</span>
                              <span className="font-semibold text-foreground">
                                LKR {Number(s.amount).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-border mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{course._count?.enrollments || 0} students enrolled</span>
                  <Badge variant="success" className="text-[10px]">
                    Active
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Modal: Add Course */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register New Course"
          description="Add course details, optional thumbnail image, and installment breakdown scheme."
          className="max-w-2xl"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Course Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Diploma in Haute Couture"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Course Code (Optional)
                </label>
                <Input
                  placeholder="e.g. NFA-HC04 (Auto if blank)"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Course Base Price (LKR) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 30000"
                  value={coursePrice}
                  onChange={(e) => setCoursePrice(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Duration
                </label>
                <Input
                  placeholder="e.g. 6 Months"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Thumbnail Image URL (Optional; default used if omitted)
              </label>
              <Input
                placeholder="https://... (Leave empty to use stylish default thumbnail)"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Course Description
              </label>
              <Input
                placeholder="Detailed curriculum overview, materials provided, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Installment Scheme Builder */}
            <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-primary" />
                    <span>Course Installment Scheme</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Define the milestone payment steps and days after enrollment.
                  </p>
                </div>
                <Button type="button" variant="outline" size="xs" onClick={addStep}>
                  + Add Step
                </Button>
              </div>

              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}.</span>
                    <Input
                      className="h-8 text-xs flex-1"
                      placeholder="Title"
                      value={step.title}
                      onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                    />
                    <Input
                      type="number"
                      className="h-8 text-xs w-28 font-mono"
                      placeholder="Amount"
                      value={step.amount}
                      onChange={(e) => handleStepChange(idx, 'amount', Number(e.target.value))}
                    />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Input
                        type="number"
                        className="h-8 text-xs w-16 font-mono"
                        placeholder="Days"
                        value={step.days}
                        onChange={(e) => handleStepChange(idx, 'days', Number(e.target.value))}
                      />
                      <span className="text-[11px]">days</span>
                    </div>
                    {steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="text-destructive h-8 px-2"
                        onClick={() => removeStep(idx)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createCourseMutation.mutate()}
                disabled={createCourseMutation.isPending || !courseName.trim() || !coursePrice}
              >
                {createCourseMutation.isPending ? 'Saving...' : 'Save Course'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
