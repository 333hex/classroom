import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  UploadCloud, 
  FileText, 
  Video, 
  Globe, 
  FileEdit, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Loader2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { ResourceType } from '../types/note';

const MAX_FILE_SIZE_MB = 50;

const uploadSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(255),
  subject: z.string().min(1, 'Subject is required').max(100),
  resource_type: z.enum(['pdf', 'doc', 'docx', 'image', 'typed', 'video_link', 'website_link']),
  description: z.string().max(2000).optional(),
  unit_number: z.string().optional(),
  topic: z.string().max(200).optional(),
  class_date: z.string().optional(),
  typed_content: z.string().max(50000).optional(),
  external_url: z.string().max(2048).optional(),
}).superRefine((data, ctx) => {
  if (['video_link', 'website_link'].includes(data.resource_type)) {
    if (!data.external_url || !data.external_url.startsWith('https://')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['external_url'],
        message: 'A valid HTTPS link is required for external resources.',
      });
    }
  }
  if (data.resource_type === 'typed') {
    if (!data.typed_content || data.typed_content.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['typed_content'],
        message: 'Typed content cannot be empty.',
      });
    }
  }
});

type UploadFormData = z.infer<typeof uploadSchema>;

export const UploadNotesPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ noteId: string; deletionToken: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema) as any,
    defaultValues: {
      resource_type: 'pdf',
    },
  });

  const resourceType = watch('resource_type');
  const isFileBased = ['pdf', 'doc', 'docx', 'image'].includes(resourceType);
  const isLinkBased = ['video_link', 'website_link'].includes(resourceType);
  const isTyped = resourceType === 'typed';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File exceeds maximum size of ${MAX_FILE_SIZE_MB}MB`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const onSubmit = async (data: UploadFormData) => {
    if (isFileBased && !selectedFile) {
      setFileError('Please select a file to upload.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('subject', data.subject);
    formData.append('resource_type', data.resource_type);

    if (data.description) formData.append('description', data.description);
    if (data.unit_number) formData.append('unit_number', data.unit_number.toString());
    if (data.topic) formData.append('topic', data.topic);
    if (data.class_date) formData.append('class_date', data.class_date);
    if (data.typed_content) formData.append('typed_content', data.typed_content);
    if (data.external_url) formData.append('external_url', data.external_url);

    if (isFileBased && selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      const res = await apiService.createNote(formData);
      setSuccessData({
        noteId: res.note.id,
        deletionToken: res.deletion_token,
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to upload resource. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToken = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.deletionToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="glass-panel rounded-2xl p-8 border-emerald-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Note Published Successfully!</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6">
            Your educational material is now live in the public library and accessible to learners everywhere.
          </p>

          {/* Secure Deletion Key Warning */}
          <div className="bg-surface-50/90 rounded-xl p-5 border border-amber-500/30 text-left mb-6">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm mb-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Private Owner Deletion Credential (SAVE THIS)</span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              To preserve anonymity, Class Connect doesn't require student user accounts. If you ever need to delete or take down this note, this unique token is the <strong>only way</strong> to authorize deletion. It is never displayed again!
            </p>

            <div className="flex items-center gap-2 bg-background/80 p-3 rounded-lg border border-slate-700">
              <Key className="w-4 h-4 text-primary shrink-0" />
              <code className="text-xs font-mono text-slate-100 break-all select-all flex-1">
                {successData.deletionToken}
              </code>
              <button
                onClick={copyToken}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-surface-100 hover:bg-surface-200 text-slate-200 border border-slate-600 transition-colors shrink-0"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/notes/${successData.noteId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/25 transition-all"
            >
              View Published Note <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                setSuccessData(null);
                setSelectedFile(null);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              Upload Another Resource
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Upload Educational Notes</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Share your study materials, lecture summaries, or curated references with fellow students
        </p>
      </div>

      {submitError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-4 mb-6 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Metadata */}
        <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
            General Information
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Note Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Organic Chemistry — Reaction Mechanisms Cheat Sheet"
              {...register('title')}
              className="w-full bg-surface-50 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.title && <p className="text-rose-400 text-[11px] mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subject <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chemistry, Computer Science, World History"
                {...register('subject')}
                className="w-full bg-surface-50 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.subject && <p className="text-rose-400 text-[11px] mt-1">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Topic (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Thermodynamics, Binary Trees"
                {...register('topic')}
                className="w-full bg-surface-50 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unit Number (Optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 1, 2, 4"
                {...register('unit_number')}
                className="w-full bg-surface-50 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.unit_number && <p className="text-rose-400 text-[11px] mt-1">{errors.unit_number.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Class Date (Optional)
              </label>
              <input
                type="date"
                {...register('class_date')}
                className="w-full bg-surface-50 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Summary (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Outline what these notes cover, key concepts, or helpful tips..."
              {...register('description')}
              className="w-full bg-surface-50 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Resource Selection */}
        <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Resource Type & Content
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Select Format <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { type: 'pdf', label: 'PDF Document', icon: FileText },
                { type: 'docx', label: 'Word (.docx)', icon: FileText },
                { type: 'image', label: 'Image (PNG/JPG)', icon: UploadCloud },
                { type: 'typed', label: 'Typed Notes', icon: FileEdit },
                { type: 'video_link', label: 'Video Link', icon: Video },
                { type: 'website_link', label: 'Website Link', icon: Globe },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = resourceType === item.type;
                return (
                  <label
                    key={item.type}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/15 border-primary text-primary-light shadow-sm'
                        : 'bg-surface-50 border-slate-700/70 text-slate-400 hover:text-white hover:bg-surface-100'
                    }`}
                  >
                    <input
                      type="radio"
                      value={item.type}
                      {...register('resource_type')}
                      className="sr-only"
                    />
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* File Upload Section */}
          {isFileBased && (
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Upload Document or Image <span className="text-rose-400">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 text-center transition-colors bg-surface-50/50">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  accept={
                    resourceType === 'pdf'
                      ? '.pdf'
                      : resourceType === 'image'
                      ? '.jpg,.jpeg,.png'
                      : '.doc,.docx'
                  }
                  className="sr-only"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-slate-200 font-medium">
                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop your file'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Maximum size: {MAX_FILE_SIZE_MB}MB
                  </p>
                </label>
              </div>
              {fileError && <p className="text-rose-400 text-[11px] mt-1.5">{fileError}</p>}
            </div>
          )}

          {/* Typed Notes Section */}
          {isTyped && (
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Typed Content / Study Notes <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={8}
                placeholder="Type or paste your lecture notes, summaries, formulas, or bullet points..."
                {...register('typed_content')}
                className="w-full bg-surface-50 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono leading-relaxed"
              />
              {errors.typed_content && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.typed_content.message}</p>
              )}
            </div>
          )}

          {/* External Link Section */}
          {isLinkBased && (
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                External HTTPS URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=... or https://khanacademy.org/..."
                {...register('external_url')}
                className="w-full bg-surface-50 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.external_url && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.external_url.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing Note...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Publish to Library
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
