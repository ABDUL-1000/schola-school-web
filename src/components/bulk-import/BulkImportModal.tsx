import { useState, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from '@/lib/toast'
import {
  downloadStudentTemplate,
  downloadStaffTemplate,
  type ClassInfo,
} from '@/lib/excel-templates'
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Info,
} from 'lucide-react'

export type ImportType = 'student' | 'staff'

interface BulkImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: ImportType
  branches: Array<{ id: string; name: string }>
  availableClasses?: Array<ClassInfo>
  schoolName?: string
  defaultBranchId?: string
  onImportStudents?: (payload: { branchId: string; students: any[] }) => Promise<any>
  onImportStaff?: (payload: { branchId: string; staffMembers: any[] }) => Promise<any>
}

interface ParsedRow {
  _id: string
  _valid: boolean
  _errors: Record<string, string>
  [key: string]: any
}

const STUDENT_COLUMNS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'middleName', label: 'Middle Name', required: false },
  { key: 'gender', label: 'Gender', required: true },
  { key: 'className', label: 'Class', required: true },
  { key: 'dateOfBirth', label: 'Date of Birth', required: false },
  { key: 'guardianName', label: 'Guardian Name', required: false },
  { key: 'guardianPhone', label: 'Guardian Phone', required: false },
  { key: 'guardianEmail', label: 'Guardian Email', required: false },
]

const STAFF_COLUMNS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'gender', label: 'Gender', required: true },
  { key: 'role', label: 'Role', required: true },
  { key: 'designation', label: 'Designation', required: false },
]

export function BulkImportModal({
  open,
  onOpenChange,
  type,
  branches = [],
  availableClasses = [],
  schoolName = 'School',
  defaultBranchId,
  onImportStudents,
  onImportStaff,
}: BulkImportModalProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    defaultBranchId || branches[0]?.id || ''
  )
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<Array<ParsedRow>>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'invalid'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ensure branch defaults properly
  const effectiveBranchId = selectedBranchId || branches[0]?.id || ''

  const columns = type === 'student' ? STUDENT_COLUMNS : STAFF_COLUMNS

  // Map of valid class names lowercase for quick O(1) matching
  const classNamesSet = useMemo(() => {
    return new Set(availableClasses.map((c) => c.name.trim().toLowerCase()))
  }, [availableClasses])

  // Normalize column headers from user spreadsheets
  const normalizeKey = (rawHeader: string): string => {
    const clean = rawHeader
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '')

    const map: Record<string, string> = {
      firstname: 'firstName',
      first_name: 'firstName',
      fname: 'firstName',
      lastname: 'lastName',
      last_name: 'lastName',
      surname: 'lastName',
      middlename: 'middleName',
      middle_name: 'middleName',
      mname: 'middleName',
      gender: 'gender',
      sex: 'gender',
      dob: 'dateOfBirth',
      dateofbirth: 'dateOfBirth',
      birthdate: 'dateOfBirth',
      class: 'className',
      classname: 'className',
      classlevel: 'className',
      guardianname: 'guardianName',
      parentname: 'guardianName',
      guardianphone: 'guardianPhone',
      parentphone: 'guardianPhone',
      guardianemail: 'guardianEmail',
      parentemail: 'guardianEmail',
      email: 'email',
      phone: 'phone',
      phonenumber: 'phone',
      role: 'role',
      roles: 'role',
      designation: 'designation',
      jobtitle: 'designation',
      title: 'designation',
      position: 'designation',
    }

    return map[clean] || rawHeader.trim()
  }

  // Validate a single row
  const validateRow = (row: Record<string, any>, index: number, allEmails: Set<string>): ParsedRow => {
    const errors: Record<string, string> = {}
    const updated: Record<string, any> = { ...row }

    if (type === 'student') {
      if (!row.firstName?.toString().trim()) {
        errors.firstName = 'First name is required'
      }
      if (!row.lastName?.toString().trim()) {
        errors.lastName = 'Last name is required'
      }

      // Gender validation & normalization
      const gRaw = row.gender?.toString().trim().toLowerCase()
      if (!gRaw) {
        errors.gender = 'Gender is required (Male/Female)'
      } else if (gRaw === 'm' || gRaw === 'male' || gRaw === 'boy') {
        updated.gender = 'MALE'
      } else if (gRaw === 'f' || gRaw === 'female' || gRaw === 'girl') {
        updated.gender = 'FEMALE'
      } else {
        errors.gender = 'Invalid gender (use Male, Female, M, or F)'
      }

      // Class validation
      const cRaw = row.className?.toString().trim()
      if (!cRaw) {
        errors.className = 'Class is required'
      } else if (classNamesSet.size > 0 && !classNamesSet.has(cRaw.toLowerCase())) {
        errors.className = `Class "${cRaw}" does not exist in school`
      }

      // Guardian email check if present
      if (row.guardianEmail?.toString().trim()) {
        const email = row.guardianEmail.toString().trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.guardianEmail = 'Invalid email address'
        }
      }
    } else {
      // Staff validation
      if (!row.firstName?.toString().trim()) {
        errors.firstName = 'First name is required'
      }
      if (!row.lastName?.toString().trim()) {
        errors.lastName = 'Last name is required'
      }

      // Email validation
      const email = row.email?.toString().trim().toLowerCase()
      if (!email) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Invalid email format'
      } else if (allEmails.has(email)) {
        errors.email = 'Duplicate email in uploaded file'
      }

      // Gender validation
      const gRaw = row.gender?.toString().trim().toLowerCase()
      if (!gRaw) {
        errors.gender = 'Gender is required'
      } else if (gRaw === 'm' || gRaw === 'male') {
        updated.gender = 'MALE'
      } else if (gRaw === 'f' || gRaw === 'female') {
        updated.gender = 'FEMALE'
      } else {
        errors.gender = 'Use Male or Female'
      }

      // Role validation
      const rRaw = row.role?.toString().trim().toUpperCase()
      if (!rRaw) {
        errors.role = 'Role is required'
      } else if (!['TEACHER', 'ACCOUNTANT', 'ADMIN', 'BURSAR'].includes(rRaw)) {
        errors.role = 'Role must be TEACHER, ACCOUNTANT, or ADMIN'
      }
    }

    const isValid = Object.keys(errors).length === 0
    return {
      ...updated,
      _id: updated._id || `row-${index}-${Date.now()}`,
      _valid: isValid,
      _errors: errors,
    }
  }

  // Parse uploaded file
  const handleFileProcess = async (selectedFile: File) => {
    setIsParsing(true)
    setFile(selectedFile)

    try {
      const buffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: '',
        raw: false,
      })

      if (rawJson.length === 0) {
        toast.error('The uploaded sheet contains no data rows.')
        setFile(null)
        setIsParsing(false)
        return
      }

      const seenEmails = new Set<string>()
      const normalizedRows: Array<ParsedRow> = rawJson.map((row, idx) => {
        const cleanedRow: Record<string, any> = {}
        Object.entries(row).forEach(([rawKey, val]) => {
          const normKey = normalizeKey(rawKey)
          cleanedRow[normKey] = typeof val === 'string' ? val.trim() : val
        })

        const email = cleanedRow.email?.toString().trim().toLowerCase()
        const validated = validateRow(cleanedRow, idx, seenEmails)
        if (email && !validated._errors.email) {
          seenEmails.add(email)
        }
        return validated
      })

      setParsedRows(normalizedRows)
      toast.success(
        `Parsed ${normalizedRows.length} rows (${normalizedRows.filter((r) => r._valid).length} valid)`
      )
    } catch (err: any) {
      toast.error('Failed to parse spreadsheet: ' + (err?.message || 'Invalid file format'))
      setFile(null)
    } finally {
      setIsParsing(false)
    }
  }

  // Handle cell edit directly in preview table
  const handleCellEdit = (rowId: string, field: string, newValue: string) => {
    setParsedRows((prevRows) => {
      const seenEmails = new Set<string>()
      return prevRows.map((row, idx) => {
        if (row._id === rowId) {
          const updatedRow = { ...row, [field]: newValue }
          return validateRow(updatedRow, idx, seenEmails)
        } else {
          const email = row.email?.toString().trim().toLowerCase()
          if (email && !row._errors.email) seenEmails.add(email)
          return row
        }
      })
    })
  }

  // Delete row from preview table
  const handleDeleteRow = (rowId: string) => {
    setParsedRows((prev) => prev.filter((r) => r._id !== rowId))
  }

  // Statistics
  const validCount = useMemo(() => parsedRows.filter((r) => r._valid).length, [parsedRows])
  const errorCount = useMemo(() => parsedRows.filter((r) => !r._valid).length, [parsedRows])

  // Filtered rows for preview table
  const displayRows = useMemo(() => {
    return parsedRows.filter((row) => {
      // Tab filter
      if (filterTab === 'valid' && !row._valid) return false
      if (filterTab === 'invalid' && row._valid) return false

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const rowStr = Object.values(row).join(' ').toLowerCase()
        return rowStr.includes(q)
      }
      return true
    })
  }, [parsedRows, filterTab, searchQuery])

  // Reset modal state
  const handleReset = () => {
    setFile(null)
    setParsedRows([])
    setFilterTab('all')
    setSearchQuery('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Submit bulk import
  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter((r) => r._valid)

    if (validRows.length === 0) {
      toast.error('No valid rows to import. Please correct cell errors first.')
      return
    }

    if (!effectiveBranchId && branches.length > 0) {
      toast.error('Please select a school branch first.')
      return
    }

    setIsSubmitting(true)

    try {
      if (type === 'student' && onImportStudents) {
        await onImportStudents({
          branchId: effectiveBranchId,
          students: validRows.map(({ _id, _valid, _errors, ...data }) => data),
        })
      } else if (type === 'staff' && onImportStaff) {
        await onImportStaff({
          branchId: effectiveBranchId,
          staffMembers: validRows.map(({ _id, _valid, _errors, ...data }) => data),
        })
      }

      toast.success(
        `Successfully imported ${validRows.length} ${type === 'student' ? 'students' : 'staff members'}!`
      )
      handleReset()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || 'Import failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-6 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                  Bulk Import {type === 'student' ? 'Students' : 'Staff Members'}
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Upload an Excel (.xlsx, .xls) or CSV file. Download the structured template pre-filled with school data.
                </DialogDescription>
              </div>

              {/* Template Download Button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary/40 hover:bg-primary/5 text-primary self-start sm:self-auto shrink-0 shadow-xs"
                onClick={() => {
                  if (type === 'student') {
                    downloadStudentTemplate(availableClasses, schoolName)
                  } else {
                    downloadStaffTemplate(schoolName)
                  }
                  toast.success('Template downloaded successfully')
                }}
              >
                <Download className="w-4 h-4" />
                Download {type === 'student' ? 'Student' : 'Staff'} Template (.xlsx)
              </Button>
            </div>

            {/* Branch Selection Bar */}
            {branches.length > 0 && (
              <div className="flex items-center gap-3 mt-4 pt-3 border-t">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                  Target Branch:
                </Label>
                <CustomSelect
                  fieldClassName="w-64 h-8 text-xs"
                  value={effectiveBranchId}
                  onValueChange={setSelectedBranchId}
                  items={branches.map((b) => ({
                    label: b.name,
                    value: b.id,
                  }))}
                />
                {type === 'student' && availableClasses.length > 0 && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    ({availableClasses.length} active classes available for matching)
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!file || parsedRows.length === 0 ? (
              /* Step 1: Upload Dropzone */
              <div className="space-y-6">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const dropped = e.dataTransfer.files?.[0]
                    if (dropped) handleFileProcess(dropped)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-primary bg-primary/5 scale-[0.99]'
                      : 'border-border hover:border-primary/60 hover:bg-muted/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileProcess(f)
                    }}
                  />

                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <UploadCloud className="w-8 h-8 animate-pulse" />
                  </div>

                  <h3 className="text-base font-semibold">
                    Click to select file or drag & drop here
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Supported formats: <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong>. Ensure headers match the template for seamless mapping.
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[11px] font-normal">
                      Max file size: 10MB
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] font-normal">
                      Up to 1,000 rows per batch
                    </Badge>
                  </div>
                </div>

                {/* Quick Field Guide */}
                <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Info className="w-4 h-4 text-primary" />
                    Expected Spreadsheet Headers:
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {columns.map((col) => (
                      <span
                        key={col.key}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-background border text-foreground"
                      >
                        <code>{col.key}</code>
                        {col.required && (
                          <span className="text-destructive font-bold text-[10px]">*</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    * Required fields must not be empty. Gender accepts <code>Male</code>, <code>Female</code>, <code>M</code>, or <code>F</code>.
                  </p>
                </div>
              </div>
            ) : (
              /* Step 2: Interactive Preview & Editable Table */
              <div className="space-y-4">
                {/* Statistics & Filter Controls Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={filterTab === 'all' ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => setFilterTab('all')}
                    >
                      All: {parsedRows.length}
                    </Badge>
                    <Badge
                      variant={filterTab === 'valid' ? 'default' : 'outline'}
                      className="cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                      onClick={() => setFilterTab('valid')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Valid: {validCount}
                    </Badge>
                    <Badge
                      variant={filterTab === 'invalid' ? 'destructive' : 'outline'}
                      className={`cursor-pointer text-xs ${
                        errorCount > 0
                          ? 'border-destructive text-destructive'
                          : 'opacity-60 pointer-events-none'
                      }`}
                      onClick={() => setFilterTab('invalid')}
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      Errors: {errorCount}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-48 sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search rows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Re-upload
                    </Button>
                  </div>
                </div>

                {/* Inline Editing Tip */}
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Interactive Correction:</strong> Click inside any highlighted cell below to fix typos or missing values directly without re-uploading!
                    </span>
                  </div>
                )}

                {/* Data Preview Table */}
                <div className="border rounded-lg overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/60 text-muted-foreground sticky top-0 z-10 border-b shadow-xs">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center font-semibold">#</th>
                        <th className="py-2.5 px-2 w-14 text-center font-semibold">Status</th>
                        {columns.map((col) => (
                          <th key={col.key} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                            {col.label}
                            {col.required && <span className="text-destructive ml-0.5">*</span>}
                          </th>
                        ))}
                        <th className="py-2.5 px-2 w-10 text-center font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {displayRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={columns.length + 3}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No records match the current filter.
                          </td>
                        </tr>
                      ) : (
                        displayRows.map((row, idx) => {
                          const hasError = !row._valid

                          return (
                            <tr
                              key={row._id}
                              className={`transition-colors group ${
                                hasError
                                  ? 'bg-destructive/5 hover:bg-destructive/10'
                                  : 'hover:bg-muted/40'
                              }`}
                            >
                              {/* Row Index */}
                              <td className="py-2 px-3 text-center text-muted-foreground font-mono text-[11px]">
                                {idx + 1}
                              </td>

                              {/* Status Badge */}
                              <td className="py-2 px-2 text-center">
                                {hasError ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="inline-flex cursor-help text-destructive">
                                        <AlertCircle className="w-4 h-4" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs space-y-1">
                                      <div className="font-semibold text-destructive">
                                        Errors in this row:
                                      </div>
                                      <ul className="list-disc pl-4 text-[11px]">
                                        {Object.entries(row._errors).map(([field, msg]) => (
                                          <li key={field}>{msg}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                                )}
                              </td>

                              {/* Column Cells with Inline Edit & Cell-Level Error Highlighting */}
                              {columns.map((col) => {
                                const errorMsg = row._errors[col.key]
                                const val = row[col.key] ?? ''

                                return (
                                  <td key={col.key} className="py-1 px-2 whitespace-nowrap">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={val}
                                        onChange={(e) =>
                                          handleCellEdit(row._id, col.key, e.target.value)
                                        }
                                        className={`w-full px-2 py-1 rounded text-xs transition-colors bg-transparent hover:bg-background focus:bg-background focus:outline-hidden ${
                                          errorMsg
                                            ? 'border-2 border-destructive bg-destructive/10 text-destructive focus:ring-1 focus:ring-destructive pr-7'
                                            : 'border border-transparent focus:border-border'
                                        }`}
                                      />
                                      {errorMsg && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <AlertCircle className="w-3.5 h-3.5 text-destructive absolute right-1.5 top-2 pointer-events-auto cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent side="top">
                                            <span>{errorMsg}</span>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </td>
                                )
                              })}

                              {/* Remove Row Button */}
                              <td className="py-2 px-2 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteRow(row._id)}
                                  title="Remove row from import"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {parsedRows.length > 0 && (
                <span>
                  Ready to import <strong>{validCount}</strong> valid record(s).
                  {errorCount > 0 && (
                    <span className="text-destructive ml-1">
                      ({errorCount} row(s) have errors and will be skipped if submitted)
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {parsedRows.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleImportSubmit}
                  disabled={validCount === 0 || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import {validCount} {type === 'student' ? 'Students' : 'Staff'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
