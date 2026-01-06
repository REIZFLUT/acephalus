import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
    url: string;
    className?: string;
}

export function PdfViewer({ url, className = '' }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    }

    function onDocumentLoadError(err: Error) {
        console.error('PDF load error:', err);
        setError('Fehler beim Laden des PDFs');
        setLoading(false);
    }

    const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
    const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center gap-2 p-4 ${className}`}>
                <AlertCircle className="size-8 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Controls */}
            <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/30">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-xs tabular-nums min-w-[80px] text-center">
                        {pageNumber} / {numPages || '?'}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={goToNextPage}
                        disabled={pageNumber >= (numPages || 1)}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                    >
                        <ZoomOut className="size-4" />
                    </Button>
                    <span className="text-xs tabular-nums min-w-[40px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={zoomIn}
                        disabled={scale >= 3}
                    >
                        <ZoomIn className="size-4" />
                    </Button>
                </div>
            </div>

            {/* PDF Document */}
            <div className="flex-1 overflow-auto flex justify-center bg-muted/20 p-4">
                {loading && (
                    <div className="flex items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading=""
                    className="flex justify-center"
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-lg"
                    />
                </Document>
            </div>
        </div>
    );
}

