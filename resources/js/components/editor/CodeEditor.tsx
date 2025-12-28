import { useRef, useEffect, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { markdown } from '@codemirror/lang-markdown';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { php } from '@codemirror/lang-php';
import { oneDark } from '@codemirror/theme-one-dark';
import { cn } from '@/lib/utils';

type Language = 'html' | 'json' | 'xml' | 'text' | 'markdown' | 'javascript' | 'css' | 'php';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: Language;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    readOnly?: boolean;
}

const languageExtensions = {
    html: html(),
    json: json(),
    xml: xml(),
    markdown: markdown(),
    javascript: javascript(),
    css: css(),
    php: php(),
    text: null,
};

export function CodeEditor({
    value,
    onChange,
    language = 'text',
    placeholder,
    className,
    minHeight = '200px',
    readOnly = false,
}: CodeEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);

    // Keep onChange ref updated
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Initialize editor
    useEffect(() => {
        if (!containerRef.current) return;

        const languageExt = languageExtensions[language];
        
        const extensions = [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            foldGutter(),
            drawSelection(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            bracketMatching(),
            closeBrackets(),
            autocompletion(),
            rectangularSelection(),
            crosshairCursor(),
            highlightActiveLine(),
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...historyKeymap,
                ...foldKeymap,
                ...completionKeymap,
                indentWithTab,
            ]),
            oneDark,
            EditorView.lineWrapping,
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    onChangeRef.current(update.state.doc.toString());
                }
            }),
            EditorState.readOnly.of(readOnly),
        ];

        if (languageExt) {
            extensions.push(languageExt);
        }

        if (placeholder) {
            extensions.push(
                EditorView.contentAttributes.of({ 'aria-placeholder': placeholder })
            );
        }

        const state = EditorState.create({
            doc: value,
            extensions,
        });

        const view = new EditorView({
            state,
            parent: containerRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, [language, placeholder, readOnly]);

    // Update value when it changes externally
    useEffect(() => {
        const view = viewRef.current;
        if (view && value !== view.state.doc.toString()) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: value,
                },
            });
        }
    }, [value]);

    // Prevent drag events from bubbling up to parent (block drag & drop)
    // We only want to prevent this if we were dragging the whole block by the editor
    // but since the block is only draggable by the handle, this shouldn't be needed.
    // However, if there are issues with dragging, we can re-enable this check.
    /*
    const handleDragStart = useCallback((e: React.DragEvent) => {
        // Only prevent if not from a draggable element
        if (!(e.target as HTMLElement).closest('[draggable="true"]')) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, []);
    */

    return (
        <div
            ref={containerRef}
            // onDragStart={handleDragStart}
            className={cn(
                'border rounded-md overflow-hidden bg-[#282c34]',
                '[&_.cm-editor]:min-h-[var(--min-height)]',
                '[&_.cm-scroller]:overflow-auto',
                '[&_.cm-content]:py-2',
                '[&_.cm-gutters]:bg-[#21252b]',
                '[&_.cm-activeLineGutter]:bg-[#2c313a]',
                '[&_.cm-activeLine]:bg-[#2c313a]',
                className
            )}
            style={{ '--min-height': minHeight } as React.CSSProperties}
        />
    );
}

// Specialized editors for specific languages
export function HtmlCodeEditor(props: Omit<CodeEditorProps, 'language'>) {
    return <CodeEditor {...props} language="html" placeholder="<div>\n  <!-- Your HTML here -->\n</div>" />;
}

export function JsonCodeEditor(props: Omit<CodeEditorProps, 'language'>) {
    return <CodeEditor {...props} language="json" placeholder='{\n  "key": "value"\n}' />;
}

export function XmlCodeEditor(props: Omit<CodeEditorProps, 'language'>) {
    return <CodeEditor {...props} language="xml" placeholder='<?xml version="1.0"?>\n<root>\n  <!-- Your XML here -->\n</root>' />;
}

export function MarkdownCodeEditor(props: Omit<CodeEditorProps, 'language'>) {
    return <CodeEditor {...props} language="markdown" placeholder="# Markdown Heading" />;
}

