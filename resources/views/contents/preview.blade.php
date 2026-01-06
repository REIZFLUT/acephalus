<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $content->title }}</title>

    {{-- Preview Assets --}}
    @vite(['resources/css/preview.css', 'resources/js/preview.js'])

    {{-- External Libraries: Markdown, KaTeX, CodeMirror --}}
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/theme/material-darker.min.css">

    <script src="https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/javascript/javascript.min.js"></script>
</head>

<body class="preview-page">
    <div class="preview-container">
        @include('contents.partials.preview-header', ['content' => $content])

        <div class="preview-content">
            @php
                $schema = $content->collection?->getSchemaObject();
                $isMetaOnlyContent = $schema?->isMetaOnlyContent() ?? false;
                $contentMetaFields = $schema?->getContentMetaFields() ?? [];
            @endphp

            @if($isMetaOnlyContent)
                @include('contents.partials.preview-meta-table', [
                    'contentMetaFields' => $contentMetaFields,
                    'metadata' => $content->metadata
                ])
            @else
                @include('contents.partials.preview-elements', [
                    'elements' => $content->elements ?? []
                ])
            @endif
        </div>
    </div>
</body>

</html>
