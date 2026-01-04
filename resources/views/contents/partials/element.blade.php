@php
    $type = $element['type'] ?? 'unknown';
    $data = $element['data'] ?? [];
@endphp

@if($type === 'wrapper')
    {{-- Wrapper: render children directly without special formatting --}}
    @foreach($element['children'] ?? [] as $child)
        @include('contents.partials.element', ['element' => $child])
    @endforeach

@elseif($type === 'text')
    @if(($data['format'] ?? 'plain') === 'html')
        <div>{!! $data['content'] ?? '' !!}</div>
    @elseif(($data['format'] ?? 'plain') === 'markdown')
        <div class="markdown-content">{{ $data['content'] ?? '' }}</div>
    @else
        <pre><code>{{ $data['content'] ?? '' }}</code></pre>
    @endif

@elseif($type === 'media')
    @if(isset($data['file_id']))
        @php
            $media = \App\Models\Mongodb\Media::find($data['file_id']);
        @endphp
        @if($media)
            <div>
                @if(str_starts_with($media->mime_type, 'image/'))
                    <img src="{{ route('media.file', $media->_id) }}" alt="{{ $data['alt'] ?? $media->filename }}">
                @elseif(str_starts_with($media->mime_type, 'video/'))
                    <video controls>
                        <source src="{{ route('media.file', $media->_id) }}" type="{{ $media->mime_type }}">
                    </video>
                @else
                    <p><a href="{{ route('media.file', $media->_id) }}" target="_blank">{{ $media->filename }}</a></p>
                @endif
                @if(isset($data['caption']) && !empty($data['caption']))
                    <p class="media-caption">{{ $data['caption'] }}</p>
                @endif
            </div>
        @endif
    @endif

@elseif($type === 'html')
    <div>{!! $data['content'] ?? '' !!}</div>

@elseif($type === 'svg')
    <div>{!! $data['content'] ?? '' !!}</div>

@elseif($type === 'katex')
    <div class="katex-formula" data-display="{{ ($data['display_mode'] ?? false) ? 'true' : 'false' }}">{{ $data['formula'] ?? '' }}</div>

@elseif($type === 'json')
    <pre><code>{{ json_encode($data['data'] ?? [], JSON_PRETTY_PRINT) }}</code></pre>

@elseif($type === 'xml')
    <pre><code>{{ $data['content'] ?? '' }}</code></pre>

@elseif($type === 'reference')
    {{-- Internal Reference Element --}}
    @php
        $referenceType = $data['reference_type'] ?? 'unknown';
        $collectionId = $data['collection_id'] ?? null;
        $contentId = $data['content_id'] ?? null;
        $elementId = $data['element_id'] ?? null;
        $displayTitle = $data['display_title'] ?? 'Unknown Reference';
        
        // Resolve the reference to get the actual data
        $referencedItem = null;
        $referenceUrl = null;
        
        if ($referenceType === 'collection' && $collectionId) {
            $referencedItem = \App\Models\Mongodb\Collection::find($collectionId);
            if ($referencedItem) {
                $displayTitle = $referencedItem->name;
            }
        } elseif ($referenceType === 'content' && $contentId) {
            $referencedItem = \App\Models\Mongodb\Content::find($contentId);
            if ($referencedItem) {
                $displayTitle = $referencedItem->title;
            }
        } elseif ($referenceType === 'element' && $contentId && $elementId) {
            $content = \App\Models\Mongodb\Content::find($contentId);
            if ($content) {
                // Find the element within the content
                $elements = $content->elements ?? [];
                // The display_title should already be set from the picker
            }
        }
    @endphp
    
    <div class="reference-element" data-reference-type="{{ $referenceType }}">
        <a href="#" class="reference-link" data-collection-id="{{ $collectionId }}" data-content-id="{{ $contentId }}" data-element-id="{{ $elementId }}">
            <span class="reference-icon">
                @if($referenceType === 'collection')
                    📁
                @elseif($referenceType === 'content')
                    📄
                @elseif($referenceType === 'element')
                    📦
                @endif
            </span>
            <span class="reference-title">{{ $displayTitle }}</span>
            <span class="reference-type-badge">[{{ ucfirst($referenceType) }}]</span>
        </a>
    </div>

@elseif(str_starts_with($type, 'custom_'))
    {{-- Custom Element: Try to load specific template, otherwise render generic --}}
    @php
        $customElementService = app(\App\Services\CustomElementService::class);
        $definition = $customElementService->get($type);
        $templateName = $definition['previewTemplate'] ?? null;
        $cssClass = $definition['cssClass'] ?? '';
    @endphp
    
    @if($templateName && View::exists("contents.partials.custom.{$templateName}"))
        <div class="{{ $cssClass }}">
            @include("contents.partials.custom.{$templateName}", ['data' => $data, 'definition' => $definition])
        </div>
    @else
        {{-- Generic custom element preview --}}
        <div class="custom-element {{ $cssClass }}" data-type="{{ $type }}">
            @if($definition)
                <div class="custom-element-header">
                    <strong>{{ $definition['label'] ?? $type }}</strong>
                </div>
                <div class="custom-element-content">
                    @foreach($definition['fields'] ?? [] as $field)
                        @php
                            $fieldName = $field['name'] ?? '';
                            $fieldValue = $data[$fieldName] ?? null;
                            $fieldLabel = $field['label'] ?? $fieldName;
                        @endphp
                        @if($fieldValue !== null && $fieldValue !== '')
                            <div class="custom-field">
                                <span class="field-label">{{ $fieldLabel }}:</span>
                                @if(is_array($fieldValue))
                                    <pre>{{ json_encode($fieldValue, JSON_PRETTY_PRINT) }}</pre>
                                @elseif(is_bool($fieldValue))
                                    <span class="field-value">{{ $fieldValue ? 'Yes' : 'No' }}</span>
                                @elseif($field['inputType'] === 'editor' || $field['inputType'] === 'html')
                                    <div class="field-value html-content">{!! $fieldValue !!}</div>
                                @else
                                    <span class="field-value">{{ $fieldValue }}</span>
                                @endif
                            </div>
                        @endif
                    @endforeach
                </div>
            @else
                <div class="custom-element-error">
                    <p>Custom element "{{ $type }}" definition not found.</p>
                    <pre><code>{{ json_encode($data, JSON_PRETTY_PRINT) }}</code></pre>
                </div>
            @endif
        </div>
    @endif

@endif

