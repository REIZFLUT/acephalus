import { useState, useEffect } from 'react';
import { JsonCodeEditor } from '../CodeEditor';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Wand2 } from 'lucide-react';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../SchemaContext';
import { MetaFieldsEditor } from '../MetaFieldsEditor';

export default function JsonBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { schema } = useSchema();
    const content = (block.data.content as string) || '{}';
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(true);

    // Get custom fields for JSON element from schema
    const customFields = schema?.element_meta_fields?.json;
    const hasCustomFields = Array.isArray(customFields) && customFields.length > 0;

    const handleMetaChange = (updates: Record<string, any>) => {
        onUpdate({ ...block.data, ...updates });
    };

    useEffect(() => {
        validateJson(content);
    }, [content]);

    const validateJson = (value: string) => {
        try {
            if (value.trim()) {
                JSON.parse(value);
            }
            setError(null);
            setIsValid(true);
        } catch (e) {
            setError((e as Error).message);
            setIsValid(false);
        }
    };

    const handleContentChange = (newContent: string) => {
        onUpdate({ ...block.data, content: newContent });
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            handleContentChange(formatted);
        } catch {
            // Don't format if invalid
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(content);
            const minified = JSON.stringify(parsed);
            handleContentChange(minified);
        } catch {
            // Don't minify if invalid
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isValid ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="size-3" />
                            Valid JSON
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="size-3" />
                            Invalid JSON
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={formatJson}
                        disabled={!isValid}
                        className="h-7 text-xs"
                    >
                        <Wand2 className="size-3 mr-1" />
                        Format
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={minifyJson}
                        disabled={!isValid}
                        className="h-7 text-xs"
                    >
                        Minify
                    </Button>
                </div>
            </div>

            <JsonCodeEditor
                value={content}
                onChange={handleContentChange}
                minHeight="200px"
            />

            {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
                    {error}
                </p>
            )}

            {/* Custom Meta Fields */}
            {hasCustomFields && (
                <MetaFieldsEditor 
                    fields={customFields} 
                    data={block.data as Record<string, any>} 
                    onChange={handleMetaChange} 
                />
            )}
        </div>
    );
}
