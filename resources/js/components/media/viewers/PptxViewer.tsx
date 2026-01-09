import { useState, useEffect } from 'react';
import { parse } from 'pptxtojson';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

interface PptxViewerProps {
    url: string;
    className?: string;
}

interface SlideElement {
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    content?: string;
    src?: string;
    fill?: {
        type: string;
        value?: string;
        color?: string;
    };
    rotate?: number;
    shapType?: string;
    borderColor?: string;
    borderWidth?: number;
}

interface Slide {
    fill?: {
        type: string;
        value?: string;
        color?: string;
    };
    elements: SlideElement[];
}

interface PptxData {
    slides: Slide[];
    size: {
        width: number;
        height: number;
    };
}

export function PptxViewer({ url, className = '' }: PptxViewerProps) {
    const [pptxData, setPptxData] = useState<PptxData | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadPptx() {
            setLoading(true);
            setError(null);

            try {
                // Fetch the file as ArrayBuffer
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Fehler beim Laden der Datei');
                }

                const arrayBuffer = await response.arrayBuffer();

                // Parse the PPTX file
                const data = await parse(arrayBuffer) as PptxData;
                setPptxData(data);
            } catch (err) {
                console.error('PPTX load error:', err);
                setError(err instanceof Error ? err.message : 'Fehler beim Laden der Präsentation');
            } finally {
                setLoading(false);
            }
        }

        loadPptx();
    }, [url]);

    const goToPrevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));
    const goToNextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, (pptxData?.slides.length || 1) - 1));

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

    if (!pptxData || pptxData.slides.length === 0) {
        return (
            <div className={`flex items-center justify-center p-8 ${className}`}>
                <p className="text-sm text-muted-foreground">Keine Folien gefunden</p>
            </div>
        );
    }

    const slide = pptxData.slides[currentSlide];
    const slideWidth = pptxData.size.width;
    const slideHeight = pptxData.size.height;

    // Get background color
    const getBgColor = () => {
        if (!slide.fill) return '#ffffff';
        if (slide.fill.type === 'color') {
            return slide.fill.value || slide.fill.color || '#ffffff';
        }
        return '#ffffff';
    };

    // Render element based on type
    const renderElement = (element: SlideElement, index: number) => {
        const style: React.CSSProperties = {
            position: 'absolute',
            left: `${(element.left / slideWidth) * 100}%`,
            top: `${(element.top / slideHeight) * 100}%`,
            width: `${(element.width / slideWidth) * 100}%`,
            height: `${(element.height / slideHeight) * 100}%`,
            transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined,
            overflow: 'hidden',
        };

        // Add border if present
        if (element.borderWidth && element.borderColor) {
            style.border = `${element.borderWidth}pt solid ${element.borderColor}`;
        }

        // Add background fill
        if (element.fill) {
            if (element.fill.type === 'color') {
                style.backgroundColor = element.fill.value || element.fill.color;
            }
        }

        switch (element.type) {
            case 'text':
            case 'shape':
                return (
                    <div key={index} style={style} className="flex items-center justify-center p-1">
                        {element.content && (
                            <div
                                className="w-full h-full overflow-hidden text-[0.5em]"
                                style={{ fontSize: 'clamp(6px, 1.5vw, 12px)' }}
                                dangerouslySetInnerHTML={{ __html: element.content }}
                            />
                        )}
                    </div>
                );

            case 'image':
                return (
                    <div key={index} style={style}>
                        {element.src && (
                            <img
                                src={element.src}
                                alt=""
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>
                );

            default:
                // For other types, just show a placeholder
                return (
                    <div
                        key={index}
                        style={{
                            ...style,
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            border: '1px dashed rgba(0,0,0,0.2)',
                        }}
                        className="flex items-center justify-center"
                    >
                        <span className="text-[8px] text-muted-foreground opacity-50">
                            {element.type}
                        </span>
                    </div>
                );
        }
    };

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Controls */}
            <div className="flex items-center justify-center gap-2 p-2 border-b bg-muted/30">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={goToPrevSlide}
                    disabled={currentSlide <= 0}
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs tabular-nums min-w-[80px] text-center">
                    Folie {currentSlide + 1} / {pptxData.slides.length}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={goToNextSlide}
                    disabled={currentSlide >= pptxData.slides.length - 1}
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>

            {/* Slide content */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 p-4">
                <div
                    className="relative shadow-lg"
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        aspectRatio: `${slideWidth} / ${slideHeight}`,
                        backgroundColor: getBgColor(),
                        color: '#000000', // Force black text for proper contrast on slide background
                    }}
                >
                    {slide.elements.map((element, index) => renderElement(element, index))}
                </div>
            </div>

            {/* Thumbnail strip */}
            {pptxData.slides.length > 1 && (
                <div className="flex gap-1 p-2 border-t bg-muted/30 overflow-x-auto">
                    {pptxData.slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`shrink-0 w-12 h-8 rounded border-2 text-[8px] flex items-center justify-center transition-colors
                                ${index === currentSlide
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:border-primary/50'
                                }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

