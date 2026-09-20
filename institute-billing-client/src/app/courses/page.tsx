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
  Loader2,
  Cloud,
  CheckCircle2,
  LayoutGrid,
  List,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

const getOrdinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const parseMonthsFromDuration = (dur: string): number => {
  const match = dur.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num >= 1) return num;
  }
  return 1;
};

const calculateEqualInstallments = (priceVal: string | number, durationStr: string) => {
  const months = parseMonthsFromDuration(durationStr);
  const cleaned = String(priceVal || '').replace(/[^\d.]/g, '');
  const price = Math.max(0, Math.round(Number(cleaned)) || 0);

  if (months <= 0) return [];
  const equalBase = Math.floor(price / months);
  const remainder = price - equalBase * months;

  const result = [];
  for (let i = 1; i <= months; i++) {
    const isFirst = i === 1;
    const isLast = i === months;
    let title = '';
    if (months === 1) {
      title = '1st Installment (Full Payment)';
    } else if (isFirst) {
      title = '1st Installment (Registration)';
    } else if (isLast) {
      title = `${i}${getOrdinal(i)} Installment (Final)`;
    } else {
      title = `${i}${getOrdinal(i)} Installment`;
    }

    const amount = isFirst ? equalBase + remainder : equalBase;
    const days = (i - 1) * 30;

    result.push({
      title,
      amount,
      days,
    });
  }
  return result;
};

export default function CoursesManagementPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // New Course Form State
  const [courseName, setCourseName] = React.useState('');
  const [coursePrice, setCoursePrice] = React.useState('');
  const [duration, setDuration] = React.useState('6 Months');
  const [thumbnailUrl, setThumbnailUrl] = React.useState('');
  const [thumbnailPreview, setThumbnailPreview] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [description, setDescription] = React.useState('');

  // Installment Scheme for course
  const [hasScheme, setHasScheme] = React.useState(true);
  const [schemeName, setSchemeName] = React.useState('');
  const [steps, setSteps] = React.useState<Array<{ title: string; amount: number; days: number }>>(() =>
    calculateEqualInstallments(0, '6 Months')
  );

  // View Mode & Pagination State
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState('');

  const priceNum = Math.max(0, Number(coursePrice) || 0);
  const totalStepsAmount = steps.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const isBalanced = priceNum > 0 && totalStepsAmount === priceNum;
  const diff = priceNum - totalStepsAmount;

  const { data: coursesResponse, isLoading } = useQuery({
    queryKey: ['courses', page, limit, searchQuery],
    queryFn: async () => {
      const res = await api.get('/courses', {
        params: {
          page,
          limit,
          search: searchQuery.trim() || undefined,
        },
      });
      return res.data;
    },
  });

  const courses = Array.isArray(coursesResponse) ? coursesResponse : coursesResponse?.data || [];
  const pagination = coursesResponse?.pagination || {
    total: courses.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil((courses.length || 1) / limit)),
  };

  const { data: nextCodeData } = useQuery({
    queryKey: ['nextCourseCode'],
    queryFn: async () => {
      const res = await api.get('/courses/next-code');
      return res.data;
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: courseName.trim(),
        code: nextCodeData?.code || undefined,
        basePrice: Number(coursePrice),
        duration: duration || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        description: description.trim() || undefined,
      };

      const dynamicSchemeName = `Standard ${steps.length}-Part Scheme (${duration})`;
      if (hasScheme && steps.length > 0) {
        payload.schemes = [
          {
            name: schemeName || dynamicSchemeName,
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
      queryClient.invalidateQueries({ queryKey: ['nextCourseCode'] });
    },
    onError: (err: any) => {
      error('Error', err.response?.data?.message || 'Failed to create course');
    },
  });

  const resetForm = () => {
    setCourseName('');
    setCoursePrice('');
    setDuration('6 Months');
    setThumbnailUrl('');
    setThumbnailPreview('');
    setIsUploading(false);
    setIsDragOver(false);
    setDescription('');
    setSteps(calculateEqualInstallments(0, '6 Months'));
  };

  const handleStepChange = (index: number, field: string, val: any) => {
    const next = [...steps];
    next[index] = { ...next[index], [field]: val };
    setSteps(next);
  };

  const addStep = () => {
    const lastDay = steps.length > 0 ? steps[steps.length - 1].days : 0;
    const nextDay = lastDay + 30;
    const idx = steps.length + 1;
    const remainingDiff = Math.max(0, priceNum - totalStepsAmount);
    setSteps([
      ...steps,
      {
        title: `${idx}${getOrdinal(idx)} Installment`,
        amount: remainingDiff,
        days: nextDay,
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  const uploadToCloudinary = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      error('Invalid file', 'Please select an image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error('File too large', 'Image size must be under 5MB.');
      return;
    }

    // Instant local preview for immediate visual feedback
    const localPreview = URL.createObjectURL(file);
    setThumbnailPreview(localPreview);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload/image?folder=courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.url) {
        setThumbnailUrl(res.data.url);
        setThumbnailPreview(res.data.url);
        success('Uploaded to Cloudinary', 'Course thumbnail ready.');
      }
    } catch (err: any) {
      error('Upload Failed', err.response?.data?.message || 'Could not upload image to Cloudinary.');
      setThumbnailPreview('');
      setThumbnailUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToCloudinary(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadToCloudinary(file);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header and Controls */}
        <div className="flex flex-col gap-4">
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

            <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              <span>Add Course</span>
            </Button>
          </div>

          {/* Action Bar: Search & View Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses by name or code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Switcher (Card vs Table) */}
            <div className="flex items-center self-end sm:self-auto bg-muted/60 p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Card View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Tabular Data View"
              >
                <List className="h-3.5 w-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Empty States */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Loading courses...</span>
          </div>
        )}

        {!isLoading && courses.length === 0 && (
          <Card className="p-12 text-center border-dashed">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No courses found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No courses matching "${searchQuery}". Try a different keyword.`
                : 'No active courses registered yet. Click "Add Course" above to create one.'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </Card>
        )}

        {/* Courses View: Card Grid */}
        {!isLoading && courses.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => {
              const scheme = course.schemes?.[0];
              let schemeSteps = [];
              try {
                if (scheme?.breakdownJson) schemeSteps = JSON.parse(scheme.breakdownJson);
              } catch (e) {}

              return (
                <Card
                  key={course.id}
                  className="overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs"
                >
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
                        <Badge variant="outline" className="text-xs font-medium">
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
        )}

        {/* Courses View: Data Table */}
        {!isLoading && courses.length > 0 && viewMode === 'table' && (
          <Card className="overflow-hidden border border-border shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Base Fee (LKR)</th>
                    <th className="py-3 px-4">Installment Scheme</th>
                    <th className="py-3 px-4">Enrolled</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {courses.map((course: any) => {
                    const scheme = course.schemes?.[0];
                    let schemeSteps = [];
                    try {
                      if (scheme?.breakdownJson) schemeSteps = JSON.parse(scheme.breakdownJson);
                    } catch (e) {}

                    return (
                      <tr key={course.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={course.thumbnailUrl || DEFAULT_COURSE_THUMBNAIL}
                              alt={course.name}
                              className="h-11 w-11 rounded-lg object-cover border border-border shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5 font-bold">
                                  {course.code}
                                </Badge>
                                <span className="font-semibold text-foreground text-sm truncate">
                                  {course.name}
                                </span>
                              </div>
                              {course.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">
                                  {course.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-xs font-normal">
                            {course.duration || 'Flexible'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-foreground">
                          {Number(course.basePrice).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {scheme ? (
                            <div className="text-xs">
                              <div className="font-medium text-foreground">{scheme.name}</div>
                              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                {schemeSteps.length} {schemeSteps.length === 1 ? 'part' : 'parts'}
                                {schemeSteps.length > 0 &&
                                  ` (${schemeSteps.map((s: any) => `${Number(s.amount).toLocaleString()}`).join(' + ')})`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Full Payment</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{course._count?.enrollments || 0}</span> enrolled
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="success" className="text-[10px]">
                            Active
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground font-mono">
                          {course.createdAt ? new Date(course.createdAt).toISOString().split('T')[0] : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination Footer Controls */}
        {!isLoading && pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-xs text-muted-foreground border-t border-border/80">
            <div className="flex items-center gap-3">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs font-medium text-foreground cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-ring"
              >
                {[10, 20, 30, 40, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>
                Showing{' '}
                <strong className="text-foreground">
                  {pagination.total === 0 ? 0 : (page - 1) * limit + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-foreground">
                  {Math.min(page * limit, pagination.total)}
                </strong>{' '}
                of <strong className="text-foreground">{pagination.total}</strong> courses
              </span>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                title="First Page"
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-2.5 gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={p === page ? 'default' : 'outline'}
                        size="xs"
                        onClick={() => setPage(p)}
                        className="h-8 w-8 p-0 text-xs font-medium"
                      >
                        {p}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="h-8 px-2.5 gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage(pagination.totalPages)}
                disabled={page >= pagination.totalPages}
                title="Last Page"
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Course Code
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <Sparkles className="h-3 w-3" /> Auto-Generated
                  </span>
                </div>
                <Input
                  value={nextCodeData?.code || 'Auto-Generating...'}
                  disabled
                  readOnly
                  className="bg-muted/60 font-mono font-bold text-foreground cursor-not-allowed tracking-wide"
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setCoursePrice(val);
                    setSteps(calculateEqualInstallments(val, duration));
                  }}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Duration <span className="text-destructive">*</span>
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer"
                  value={duration}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDuration(val);
                    setSteps(calculateEqualInstallments(coursePrice, val));
                  }}
                  required
                >
                  <option value="" disabled>-- Select Duration (1 - 12 Months) --</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={`${m} Month${m > 1 ? 's' : ''}`}>
                      {m} {m === 1 ? 'Month' : 'Months'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thumbnail Upload Zone */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">
                Course Thumbnail Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                className={`relative group rounded-xl border-2 border-dashed overflow-hidden transition-all ${
                  isUploading ? 'cursor-wait border-primary/50' : 'cursor-pointer'
                } ${
                  isDragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-border hover:border-primary/60 hover:bg-muted/30'
                }`}
                style={{ height: '160px' }}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => !isUploading && handleDrop(e)}
              >
                {/* Uploading Spinner Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-background/85 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                    <span className="text-xs font-semibold text-foreground">Uploading to Cloudinary...</span>
                    <span className="text-[11px] text-muted-foreground font-mono">cloud: cssdzcsb</span>
                  </div>
                )}

                {thumbnailPreview ? (
                  <>
                    {/* Preview */}
                    <img
                      src={thumbnailPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />

                    {/* Cloudinary Badge */}
                    {thumbnailUrl.includes('cloudinary.com') && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-emerald-600 text-white text-[10px] font-medium backdrop-blur-sm flex items-center gap-1 shadow-xs border-0">
                          <Cloud className="h-3 w-3" />
                          <span>Cloudinary</span>
                        </Badge>
                      </div>
                    )}

                    {!isUploading && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="h-6 w-6 text-white" />
                        <span className="text-xs text-white font-semibold">Click to change</span>
                      </div>
                    )}

                    {/* Remove button */}
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThumbnailPreview('');
                          setThumbnailUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-destructive transition-colors z-10"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* Default placeholder */}
                    <img
                      src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=60&blur=2"
                      alt="Upload placeholder"
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-foreground">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          JPG, PNG, WEBP — direct Cloudinary upload (max 5MB)
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-primary" />
                    <span>Course Installment Scheme</span>
                    <Badge variant="outline" className="text-[10px] ml-1 font-mono">
                      {steps.length} {steps.length === 1 ? 'Part' : 'Parts'} ({duration})
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Auto-calculated from Base Price and Duration. You can customize individual steps if needed.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setSteps(calculateEqualInstallments(coursePrice, duration))}
                    className="text-[11px] gap-1 h-7 text-primary hover:text-primary"
                    title="Recalculate equal installments based on duration and base price"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-Calculate</span>
                  </Button>
                  <Button type="button" variant="outline" size="xs" onClick={addStep} className="h-7 text-[11px]">
                    + Add Step
                  </Button>
                </div>
              </div>

              {/* Live Balance Summary Bar */}
              <div className="flex items-center justify-between bg-card p-2.5 rounded-lg border border-border/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[11px]">Scheme Total:</span>
                  <span className="font-mono font-bold text-foreground">
                    LKR {totalStepsAmount.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    / Fee: LKR {priceNum.toLocaleString()}
                  </span>
                </div>
                <div>
                  {priceNum > 0 && isBalanced && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 100% Balanced
                    </span>
                  )}
                  {priceNum > 0 && !isBalanced && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        Diff: LKR {Math.abs(diff).toLocaleString()} {diff > 0 ? 'remaining' : 'over'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSteps(calculateEqualInstallments(coursePrice, duration))}
                        className="text-[11px] font-semibold text-primary underline hover:opacity-80"
                      >
                        Auto-Balance
                      </button>
                    </div>
                  )}
                  {priceNum === 0 && (
                    <span className="text-[11px] text-muted-foreground italic">
                      Enter price above to auto-calculate amounts
                    </span>
                  )}
                </div>
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
                      value={step.amount || ''}
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
                        className="text-destructive h-8 px-2 hover:bg-destructive/10"
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
                disabled={
                  createCourseMutation.isPending ||
                  isUploading ||
                  !courseName.trim() ||
                  !coursePrice ||
                  !duration ||
                  (priceNum > 0 && !isBalanced)
                }
              >
                {createCourseMutation.isPending
                  ? 'Saving...'
                  : isUploading
                  ? 'Uploading Image...'
                  : priceNum > 0 && !isBalanced
                  ? 'Installments Must Equal Base Price'
                  : 'Save Course'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
