import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Loader2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface XlsxViewerProps {
    url: string;
    className?: string;
}

interface SheetData {
    name: string;
    data: string[][];
}

export function XlsxViewer({ url, className = '' }: XlsxViewerProps) {
    const [sheets, setSheets] = useState<SheetData[]>([]);
    const [activeSheet, setActiveSheet] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadXlsx() {
            setLoading(true);
            setError(null);

            try {
                // Fetch the file as ArrayBuffer
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Fehler beim Laden der Datei');
                }

                const arrayBuffer = await response.arrayBuffer();

                // Parse the Excel file
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                // Convert each sheet to array data
                const sheetsData: SheetData[] = workbook.SheetNames.map((name) => {
                    const sheet = workbook.Sheets[name];
                    const data = XLSX.utils.sheet_to_json<string[]>(sheet, {
                        header: 1,
                        defval: '',
                    });
                    return { name, data };
                });

                setSheets(sheetsData);
                if (sheetsData.length > 0) {
                    setActiveSheet(sheetsData[0].name);
                }
            } catch (err) {
                console.error('XLSX load error:', err);
                setError(err instanceof Error ? err.message : 'Fehler beim Laden der Tabelle');
            } finally {
                setLoading(false);
            }
        }

        loadXlsx();
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

    if (sheets.length === 0) {
        return (
            <div className={`flex items-center justify-center p-8 ${className}`}>
                <p className="text-sm text-muted-foreground">Keine Daten gefunden</p>
            </div>
        );
    }

    const currentSheet = sheets.find((s) => s.name === activeSheet) || sheets[0];

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Sheet tabs */}
            {sheets.length > 1 && (
                <Tabs value={activeSheet} onValueChange={setActiveSheet} className="w-full">
                    <div className="border-b bg-muted/30 px-2">
                        <TabsList className="h-8 bg-transparent">
                            {sheets.map((sheet) => (
                                <TabsTrigger
                                    key={sheet.name}
                                    value={sheet.name}
                                    className="text-xs px-3 py-1 h-7 data-[state=active]:bg-background"
                                >
                                    {sheet.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </Tabs>
            )}

            {/* Table content */}
            <ScrollArea className="flex-1">
                <div className="p-2">
                    <table className="w-full border-collapse text-xs">
                        <tbody>
                            {currentSheet.data.map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex === 0 ? 'bg-muted/50 font-medium' : ''}>
                                    {/* Row number */}
                                    <td className="border border-border px-2 py-1 text-muted-foreground bg-muted/30 text-right min-w-[40px]">
                                        {rowIndex + 1}
                                    </td>
                                    {row.map((cell, cellIndex) => (
                                        <td
                                            key={cellIndex}
                                            className="border border-border px-2 py-1 whitespace-nowrap max-w-[200px] truncate"
                                            title={String(cell)}
                                        >
                                            {String(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ScrollArea>
        </div>
    );
}

