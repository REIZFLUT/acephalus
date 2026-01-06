import { lazy, Suspense } from 'react';
import { Loader2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy load viewers for better performance
const PdfViewer = lazy(() => import('./viewers/PdfViewer').then(m => ({ default: m.PdfViewer })));
const DocxViewer = lazy(() => import('./viewers/DocxViewer').then(m => ({ default: m.DocxViewer })));
const XlsxViewer = lazy(() => import('./viewers/XlsxViewer').then(m => ({ default: m.XlsxViewer })));
const PptxViewer = lazy(() => import('./viewers/PptxViewer').then(m => ({ default: m.PptxViewer })));

// MIME type to viewer type mapping
const DOCUMENT_MIME_TYPES: Record<string, 'pdf' | 'docx' | 'xlsx' | 'pptx'> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'docx', // Legacy .doc format (limited support)
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xlsx', // Legacy .xls format (limited support)
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-powerpoint': 'pptx', // Legacy .ppt format (limited support)
};

interface DocumentPreviewProps {
    url: string;
    mimeType: string;
    filename?: string;
    className?: string;
}

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
    );
}

interface UnsupportedDocumentProps {
    url: string;
    filename?: string;
    mimeType: string;
}

function UnsupportedDocument({ url, filename, mimeType }: UnsupportedDocumentProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
            <FileText className="size-16 text-muted-foreground" />
            <div className="text-center">
                <p className="text-sm font-medium">Vorschau nicht verfügbar</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Dateityp: {mimeType}
                </p>
            </div>
            <Button variant="outline" size="sm" asChild>
                <a href={url} download={filename}>
                    <Download className="size-4 mr-2" />
                    Herunterladen
                </a>
            </Button>
        </div>
    );
}

export function DocumentPreview({ url, mimeType, filename, className = '' }: DocumentPreviewProps) {
    const viewerType = DOCUMENT_MIME_TYPES[mimeType];

    if (!viewerType) {
        return (
            <UnsupportedDocument url={url} filename={filename} mimeType={mimeType} />
        );
    }

    return (
        <Suspense fallback={<LoadingFallback />}>
            <div className={className}>
                {viewerType === 'pdf' && <PdfViewer url={url} className="h-full" />}
                {viewerType === 'docx' && <DocxViewer url={url} className="h-full" />}
                {viewerType === 'xlsx' && <XlsxViewer url={url} className="h-full" />}
                {viewerType === 'pptx' && <PptxViewer url={url} className="h-full" />}
            </div>
        </Suspense>
    );
}

/**
 * Check if a MIME type is a supported document type
 */
export function isDocumentMimeType(mimeType: string): boolean {
    return mimeType in DOCUMENT_MIME_TYPES;
}

/**
 * Get a human-readable document type label
 */
export function getDocumentTypeLabel(mimeType: string): string | null {
    const type = DOCUMENT_MIME_TYPES[mimeType];
    if (!type) return null;
    
    const labels: Record<string, string> = {
        pdf: 'PDF',
        docx: 'Word',
        xlsx: 'Excel',
        pptx: 'PowerPoint',
    };
    
    return labels[type] || null;
}

