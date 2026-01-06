import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { Loader2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocxViewerProps {
    url: string;
    className?: string;
}

export function DocxViewer({ url, className = '' }: DocxViewerProps) {
    const [html, setHtml] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDocx() {
            setLoading(true);
            setError(null);

            try {
                // Fetch the file as ArrayBuffer
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Fehler beim Laden der Datei');
                }
                
                const arrayBuffer = await response.arrayBuffer();
                
                // Convert to HTML using mammoth
                const result = await mammoth.convertToHtml(
                    { arrayBuffer },
                    {
                        styleMap: [
                            "p[style-name='Heading 1'] => h1:fresh",
                            "p[style-name='Heading 2'] => h2:fresh",
                            "p[style-name='Heading 3'] => h3:fresh",
                        ],
                    }
                );

                setHtml(result.value);
                
                // Log any warnings for debugging
                if (result.messages.length > 0) {
                    console.log('Mammoth messages:', result.messages);
                }
            } catch (err) {
                console.error('DOCX load error:', err);
                setError(err instanceof Error ? err.message : 'Fehler beim Laden des Dokuments');
            } finally {
                setLoading(false);
            }
        }

        loadDocx();
    }, [url]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center p-8 ${className}`}>
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center gap-2 p-4 ${className}`}>
                <AlertCircle className="size-8 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <ScrollArea className={`bg-white ${className}`}>
            <div 
                className="p-6 prose prose-sm max-w-none
                    prose-headings:text-foreground
                    prose-p:text-foreground
                    prose-strong:text-foreground
                    prose-ul:text-foreground
                    prose-ol:text-foreground
                    prose-li:text-foreground
                    prose-table:text-foreground
                    prose-td:border prose-td:border-border prose-td:p-2
                    prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted
                "
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </ScrollArea>
    );
}

