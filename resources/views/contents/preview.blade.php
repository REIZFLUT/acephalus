<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $content->title }}</title>
    @vite(['resources/css/app.css'])
    
    <!-- Markdown and KaTeX -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    
    <!-- CodeMirror for JSON display -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/theme/material-darker.min.css">
    <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/javascript/javascript.min.js"></script>
    
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.7;
            color: #1f2937;
            background: #fff;
            margin: 0;
            padding: 0;
        }
        .preview-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }
        .preview-header {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 2rem;
            margin-bottom: 3rem;
        }
        .preview-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 0.5rem 0;
            color: #111827;
        }
        .preview-meta {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .preview-content > * {
            margin-bottom: 2rem;
        }
        .preview-content > *:last-child {
            margin-bottom: 0;
        }
        
        /* Typography */
        .preview-content h1 {
            font-size: 2em;
            font-weight: 700;
            margin-bottom: 0.75em;
            margin-top: 1.5em;
            line-height: 1.2;
        }
        .preview-content h2 {
            font-size: 1.5em;
            font-weight: 600;
            margin-bottom: 0.65em;
            margin-top: 1.3em;
            line-height: 1.3;
        }
        .preview-content h3 {
            font-size: 1.25em;
            font-weight: 600;
            margin-bottom: 0.5em;
            margin-top: 1em;
            line-height: 1.4;
        }
        .preview-content h1:first-child,
        .preview-content h2:first-child,
        .preview-content h3:first-child {
            margin-top: 0;
        }
        .preview-content p {
            margin-bottom: 1em;
        }
        .preview-content ul,
        .preview-content ol {
            margin-bottom: 1em;
            padding-left: 2em;
        }
        .preview-content li {
            margin-bottom: 0.5em;
        }
        .preview-content strong {
            font-weight: 700;
        }
        .preview-content em {
            font-style: italic;
        }
        .preview-content a {
            color: #2563eb;
            text-decoration: underline;
        }
        .preview-content code {
            background: #f3f4f6;
            padding: 0.2em 0.4em;
            border-radius: 0.25rem;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .preview-content pre {
            background: #1f2937;
            color: #f3f4f6;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin-bottom: 1em;
        }
        .preview-content pre code {
            background: transparent;
            padding: 0;
            color: #f3f4f6;
        }
        .preview-content blockquote {
            border-left: 4px solid #d1d5db;
            padding-left: 1em;
            margin: 1em 0;
            font-style: italic;
            color: #6b7280;
        }
        .preview-content table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
        }
        .preview-content th,
        .preview-content td {
            border: 1px solid #e5e7eb;
            padding: 0.5em;
            text-align: left;
        }
        .preview-content th {
            background: #f9fafb;
            font-weight: 600;
        }
        .preview-content hr {
            border: 0;
            border-top: 2px solid #e5e7eb;
            margin: 2em 0;
        }
        
        /* Media */
        .preview-content img,
        .preview-content video {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            display: block;
        }
        .media-caption {
            color: #6b7280;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            font-style: italic;
        }
        
        /* KaTeX */
        .katex-display {
            margin: 2rem 0;
        }
        
        /* Meta Table for Meta Only Content */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            overflow: hidden;
        }
        .meta-table th,
        .meta-table td {
            padding: 1rem 1.25rem;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .meta-table th {
            background: #f9fafb;
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
        }
        .meta-table tr:last-child td {
            border-bottom: none;
        }
        .meta-table tr:hover td {
            background: #f9fafb;
        }
        .meta-table td strong {
            font-weight: 600;
            color: #374151;
        }
        .meta-table td code {
            background: #f3f4f6;
            padding: 0.15em 0.4em;
            border-radius: 0.25rem;
            font-family: 'Courier New', monospace;
            font-size: 0.875em;
        }
        
        /* CodeMirror JSON container */
        .json-codemirror-container {
            border-radius: 0.5rem;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }
        .json-codemirror-container .CodeMirror {
            height: auto;
            max-height: 400px;
            font-size: 0.875rem;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
        }
        .json-codemirror-container .CodeMirror-scroll {
            max-height: 400px;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <h1 class="preview-title">{{ $content->title }}</h1>
            <div class="preview-meta">
                {{ $content->collection->name }} · 
                {{ ucfirst($content->status->value) }} · 
                {{ $content->updated_at->format('d.m.Y H:i') }}
            </div>
        </div>

        <div class="preview-content">
            @php
                $schema = $content->collection?->getSchemaObject();
                $isMetaOnlyContent = $schema?->isMetaOnlyContent() ?? false;
                $contentMetaFields = $schema?->getContentMetaFields() ?? [];
            @endphp

            @if($isMetaOnlyContent)
                {{-- Meta Only Content Mode: Display metadata in a table --}}
                @if(count($contentMetaFields) > 0 && !empty($content->metadata))
                    <table class="meta-table">
                        <thead>
                            <tr>
                                <th style="width: 30%;">Feld</th>
                                <th>Wert</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($contentMetaFields as $field)
                                @php
                                    $fieldName = $field['name'] ?? '';
                                    $fieldLabel = $field['label'] ?? $fieldName;
                                    $fieldType = $field['type'] ?? 'text';
                                    $value = $content->metadata[$fieldName] ?? null;
                                @endphp
                                <tr>
                                    <td><strong>{{ $fieldLabel }}</strong></td>
                                    <td>
                                        @if($value === null || $value === '')
                                            <span style="color: #9ca3af; font-style: italic;">—</span>
                                        @elseif($fieldType === 'boolean')
                                            <span>{{ $value ? 'Ja' : 'Nein' }}</span>
                                        @elseif($fieldType === 'date')
                                            <span>{{ \Carbon\Carbon::parse($value)->format('d.m.Y') }}</span>
                                        @elseif($fieldType === 'datetime')
                                            <span>{{ \Carbon\Carbon::parse($value)->format('d.m.Y H:i') }}</span>
                                        @elseif($fieldType === 'url')
                                            <a href="{{ $value }}" target="_blank" rel="noopener">{{ $value }}</a>
                                        @elseif($fieldType === 'email')
                                            <a href="mailto:{{ $value }}">{{ $value }}</a>
                                        @elseif($fieldType === 'color')
                                            <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                                                <span style="width: 1rem; height: 1rem; border-radius: 0.25rem; background: {{ $value }}; border: 1px solid #e5e7eb;"></span>
                                                <code>{{ $value }}</code>
                                            </span>
                                        @elseif($fieldType === 'multi_select' && is_array($value))
                                            <span>{{ implode(', ', $value) }}</span>
                                        @elseif($fieldType === 'json')
                                            <div class="json-codemirror-container">
                                                <textarea class="json-codemirror-source" style="display: none;">{{ json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) }}</textarea>
                                            </div>
                                        @elseif($fieldType === 'textarea')
                                            <div style="white-space: pre-wrap;">{{ $value }}</div>
                                        @else
                                            <span>{{ $value }}</span>
                                        @endif
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <p style="color: #9ca3af; text-align: center;">Keine Metadaten vorhanden.</p>
                @endif
            @else
                {{-- Standard Mode: Display elements --}}
                @foreach($content->elements ?? [] as $element)
                    @include('contents.partials.element', ['element' => $element])
                @endforeach

                @if(empty($content->elements))
                    <p style="color: #9ca3af; text-align: center;">Keine Inhalte vorhanden.</p>
                @endif
            @endif
        </div>
    </div>

    <script>
        // Configure marked to preserve math expressions
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        // Render Markdown
        document.querySelectorAll('.markdown-content').forEach(el => {
            const markdown = el.textContent;
            el.innerHTML = marked.parse(markdown);
            
            // Render KaTeX in the markdown content
            renderMathInElement(el, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\[', right: '\\]', display: true},
                    {left: '\\(', right: '\\)', display: false}
                ],
                throwOnError: false
            });
        });

        // Render standalone KaTeX formulas
        document.querySelectorAll('.katex-formula').forEach(el => {
            const formula = el.textContent;
            const displayMode = el.dataset.display === 'true';
            try {
                katex.render(formula, el, {
                    displayMode: displayMode,
                    throwOnError: false
                });
            } catch (e) {
                console.error('KaTeX rendering error:', e);
            }
        });

        // Initialize CodeMirror for JSON fields (readonly)
        document.querySelectorAll('.json-codemirror-container').forEach(container => {
            const sourceTextarea = container.querySelector('.json-codemirror-source');
            if (sourceTextarea) {
                const jsonContent = sourceTextarea.value;
                
                // Create a new textarea for CodeMirror
                const cmTextarea = document.createElement('textarea');
                container.appendChild(cmTextarea);
                
                // Initialize CodeMirror
                const editor = CodeMirror.fromTextArea(cmTextarea, {
                    value: jsonContent,
                    mode: { name: 'javascript', json: true },
                    theme: 'material-darker',
                    readOnly: true,
                    lineNumbers: true,
                    lineWrapping: true,
                    viewportMargin: Infinity,
                    tabSize: 2,
                });
                
                // Set the content
                editor.setValue(jsonContent);
            }
        });
    </script>
</body>
</html>

