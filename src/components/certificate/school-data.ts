import type { CertificateContext, CertificateTemplate } from './template'

/** School portal only: shapes and cache keys for the certificate pages. */

export type SchoolClass = { id: string; name: string; level: string | null; graduatesClass: boolean }
export type TemplatesResponse = CertificateContext & { classes: Array<SchoolClass>; templates: Array<CertificateTemplate> }
export type TemplateResponse = CertificateContext & { classes: Array<SchoolClass>; template: CertificateTemplate }

export const certKeys = {
  templates: ['certificates', 'templates'] as const,
  template: (id: string) => ['certificates', 'template', id] as const,
  issued: (templateId: string, className: string, search: string) => ['certificates', 'issued', templateId, className, search] as const,
  candidates: (templateId: string, source: string) => ['certificates', 'candidates', templateId, source] as const,
}

export const errorText = (e: unknown, fallback: string) => {
  const err = e as { response?: { data?: { message?: string } } } | null
  return err?.response?.data?.message || fallback
}
