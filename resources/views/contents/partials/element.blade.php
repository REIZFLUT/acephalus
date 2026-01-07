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
    @if(isset($data['folder_id']) && !empty($data['folder_id']))
        {{-- Folder selected: Display all media of the selected type as gallery --}}
        @php
            $mediaType = $data['media_type'] ?? null;
            $folder = \App\Models\Mongodb\MediaFolder::find($data['folder_id']);
            $mediaQuery = \App\Models\Mongodb\Media::where('folder_id', $data['folder_id']);
            if ($mediaType) {
                $mediaQuery->where('media_type', $mediaType);
            }
            $mediaItems = $mediaQuery->orderBy('original_filename')->get();
        @endphp
        @if($folder)
            <div class="media-folder-gallery">
                <div class="media-folder-gallery__header">
                    <span class="media-folder-gallery__icon">📁</span>
                    <span class="media-folder-gallery__title">{{ $folder->name }}</span>
                    <span class="media-folder-gallery__count">{{ $mediaItems->count() }} {{ $mediaItems->count() === 1 ? 'Element' : 'Elemente' }}</span>
                </div>
                @if($mediaItems->count() > 0)
                    @if($mediaType === 'image')
                        {{-- Image Gallery Grid --}}
                        <div class="media-folder-gallery__grid media-folder-gallery__grid--images">
                            @foreach($mediaItems as $mediaItem)
                                <figure class="media-folder-gallery__item">
                                    <img 
                                        src="{{ route('media.file', $mediaItem->_id) }}" 
                                        alt="{{ $mediaItem->original_filename }}"
                                        loading="lazy"
                                    >
                                    <figcaption>{{ $mediaItem->original_filename }}</figcaption>
                                </figure>
                            @endforeach
                        </div>
                    @elseif($mediaType === 'video')
                        {{-- Video List --}}
                        <div class="media-folder-gallery__list media-folder-gallery__list--videos">
                            @foreach($mediaItems as $mediaItem)
                                <div class="media-folder-gallery__video-item">
                                    <video controls preload="metadata">
                                        <source src="{{ route('media.file', $mediaItem->_id) }}" type="{{ $mediaItem->mime_type }}">
                                    </video>
                                    <span class="media-folder-gallery__filename">{{ $mediaItem->original_filename }}</span>
                                </div>
                            @endforeach
                        </div>
                    @elseif($mediaType === 'audio')
                        {{-- Audio List --}}
                        <div class="media-folder-gallery__list media-folder-gallery__list--audio">
                            @foreach($mediaItems as $mediaItem)
                                <div class="media-folder-gallery__audio-item">
                                    <span class="media-folder-gallery__audio-icon">🎵</span>
                                    <span class="media-folder-gallery__filename">{{ $mediaItem->original_filename }}</span>
                                    <audio controls preload="metadata">
                                        <source src="{{ route('media.file', $mediaItem->_id) }}" type="{{ $mediaItem->mime_type }}">
                                    </audio>
                                </div>
                            @endforeach
                        </div>
                    @elseif($mediaType === 'document')
                        {{-- Document List --}}
                        <div class="media-folder-gallery__list media-folder-gallery__list--documents">
                            @foreach($mediaItems as $mediaItem)
                                @php
                                    $extension = strtoupper(pathinfo($mediaItem->original_filename, PATHINFO_EXTENSION));
                                    $docIcon = match($extension) {
                                        'PDF' => '📕',
                                        'DOC', 'DOCX' => '📘',
                                        'XLS', 'XLSX' => '📗',
                                        'PPT', 'PPTX' => '📙',
                                        default => '📄',
                                    };
                                @endphp
                                <a href="{{ route('media.file', $mediaItem->_id) }}" target="_blank" class="media-folder-gallery__document-item">
                                    <span class="media-folder-gallery__doc-icon">{{ $docIcon }}</span>
                                    <span class="media-folder-gallery__filename">{{ $mediaItem->original_filename }}</span>
                                    <span class="media-folder-gallery__doc-type">{{ $extension }}</span>
                                </a>
                            @endforeach
                        </div>
                    @else
                        {{-- Mixed/All types - Simple list --}}
                        <div class="media-folder-gallery__list">
                            @foreach($mediaItems as $mediaItem)
                                <a href="{{ route('media.file', $mediaItem->_id) }}" target="_blank" class="media-folder-gallery__item-link">
                                    @if(str_starts_with($mediaItem->mime_type, 'image/'))
                                        <img src="{{ route('media.file', $mediaItem->_id) }}" alt="{{ $mediaItem->original_filename }}" class="media-folder-gallery__thumb">
                                    @else
                                        <span class="media-folder-gallery__file-icon">📎</span>
                                    @endif
                                    <span class="media-folder-gallery__filename">{{ $mediaItem->original_filename }}</span>
                                </a>
                            @endforeach
                        </div>
                    @endif
                @else
                    <p class="media-folder-gallery__empty">Keine {{ $mediaType ? ucfirst($mediaType) . '-' : '' }}Dateien in diesem Ordner.</p>
                @endif
                @if(isset($data['caption']) && !empty($data['caption']))
                    <p class="media-caption">{{ $data['caption'] }}</p>
                @endif
            </div>
        @endif
    @elseif(isset($data['file_id']))
        {{-- Single file selected --}}
        @php
            $media = \App\Models\Mongodb\Media::find($data['file_id']);
        @endphp
        @if($media)
            <div class="media-single">
                @if(str_starts_with($media->mime_type, 'image/'))
                    <img src="{{ route('media.file', $media->_id) }}" alt="{{ $data['alt'] ?? $media->original_filename }}">
                @elseif(str_starts_with($media->mime_type, 'video/'))
                    <video controls>
                        <source src="{{ route('media.file', $media->_id) }}" type="{{ $media->mime_type }}">
                    </video>
                @elseif(str_starts_with($media->mime_type, 'audio/'))
                    <div class="media-audio">
                        <span class="media-audio__icon">🎵</span>
                        <span class="media-audio__filename">{{ $media->original_filename }}</span>
                        <audio controls>
                            <source src="{{ route('media.file', $media->_id) }}" type="{{ $media->mime_type }}">
                        </audio>
                    </div>
                @else
                    @php
                        $extension = strtoupper(pathinfo($media->original_filename, PATHINFO_EXTENSION));
                        $docIcon = match($extension) {
                            'PDF' => '📕',
                            'DOC', 'DOCX' => '📘',
                            'XLS', 'XLSX' => '📗',
                            'PPT', 'PPTX' => '📙',
                            default => '📄',
                        };
                    @endphp
                    <a href="{{ route('media.file', $media->_id) }}" target="_blank" class="media-document">
                        <span class="media-document__icon">{{ $docIcon }}</span>
                        <span class="media-document__filename">{{ $media->original_filename }}</span>
                        <span class="media-document__type">{{ $extension }}</span>
                    </a>
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
    {{-- Internal Reference Element - Fully Rendered --}}
    @php
        $referenceType = $data['reference_type'] ?? 'unknown';
        $collectionId = $data['collection_id'] ?? null;
        $contentId = $data['content_id'] ?? null;
        $elementId = $data['element_id'] ?? null;
        $filterViewId = $data['filter_view_id'] ?? null;
        $displayTitle = $data['display_title'] ?? 'Unknown Reference';
        
        // Resolve the reference to get the actual data
        $referencedCollection = null;
        $referencedContent = null;
        $referencedElement = null;
        $collectionContents = [];
        $totalCount = 0;
        $appliedFilterView = null;
        
        if ($referenceType === 'collection' && $collectionId) {
            $referencedCollection = \App\Models\Mongodb\Collection::find($collectionId);
            if ($referencedCollection) {
                $displayTitle = $referencedCollection->name;
                
                // Build query - optionally apply filter view
                $query = $referencedCollection->contents();
                
                if ($filterViewId) {
                    $appliedFilterView = \App\Models\Mongodb\FilterView::find($filterViewId);
                    if ($appliedFilterView && $appliedFilterView->belongsToCollection($collectionId)) {
                        $filterService = app(\App\Services\ContentFilterService::class);
                        $query = $filterService->applyFilterView($query, $appliedFilterView, $referencedCollection);
                    }
                }
                
                // Get total count and the 3 newest/filtered contents
                $totalCount = (clone $query)->count();
                $collectionContents = $query
                    ->orderByDesc('created_at')
                    ->limit(3)
                    ->get();
            }
        } elseif ($referenceType === 'content' && $contentId) {
            $referencedContent = \App\Models\Mongodb\Content::with('collection')->find($contentId);
            if ($referencedContent) {
                $displayTitle = $referencedContent->title;
            }
        } elseif ($referenceType === 'element' && $contentId && $elementId) {
            $referencedContent = \App\Models\Mongodb\Content::with('collection')->find($contentId);
            if ($referencedContent) {
                // Find the element within the content (including nested elements)
                $findElement = function($elements, $targetId) use (&$findElement) {
                    foreach ($elements as $el) {
                        if (($el['id'] ?? null) === $targetId) {
                            return $el;
                        }
                        if (!empty($el['children']) && is_array($el['children'])) {
                            $found = $findElement($el['children'], $targetId);
                            if ($found) return $found;
                        }
                    }
                    return null;
                };
                $referencedElement = $findElement($referencedContent->elements ?? [], $elementId);
            }
        }
    @endphp
    
    <div class="reference-box reference-box--{{ $referenceType }}">
        <div class="reference-box__header">
            <span class="reference-box__icon">
                @if($referenceType === 'collection')
                    📁
                @elseif($referenceType === 'content')
                    📄
                @elseif($referenceType === 'element')
                    📦
                @endif
            </span>
            <span class="reference-box__badge">{{ ucfirst($referenceType) }}-Referenz</span>
            <span class="reference-box__title">{{ $displayTitle }}</span>
            @if($appliedFilterView)
                <span class="reference-box__filter-badge">🔍 {{ $appliedFilterView->name }}</span>
            @endif
        </div>
        
        <div class="reference-box__content">
            @if($referenceType === 'collection' && $referencedCollection)
                {{-- Collection Reference: Show 3 newest entries --}}
                @if($referencedCollection->description)
                    <p class="reference-box__description">{{ $referencedCollection->description }}</p>
                @endif
                
                @if(count($collectionContents) > 0)
                    <div class="reference-box__list">
                        @foreach($collectionContents as $item)
                            <div class="reference-box__list-item">
                                <span class="reference-box__list-icon">📄</span>
                                <div class="reference-box__list-info">
                                    <span class="reference-box__list-title">{{ $item->title }}</span>
                                    <span class="reference-box__list-meta">{{ $item->slug }}</span>
                                </div>
                                <span class="reference-box__list-status reference-box__list-status--{{ $item->status->value ?? 'draft' }}">
                                    {{ ucfirst($item->status->value ?? 'draft') }}
                                </span>
                            </div>
                        @endforeach
                    </div>
                    @if($totalCount > 3)
                        <p class="reference-box__more">+ {{ $totalCount - 3 }} weitere Einträge</p>
                    @endif
                @else
                    <p class="reference-box__empty">
                        @if($appliedFilterView)
                            Keine Einträge entsprechen diesem Filter.
                        @else
                            Diese Collection hat keine Einträge.
                        @endif
                    </p>
                @endif
                <p class="reference-box__total">
                    @if($appliedFilterView)
                        Gefiltert: {{ $totalCount }} {{ $totalCount === 1 ? 'Eintrag' : 'Einträge' }}
                    @else
                        Gesamt: {{ $totalCount }} {{ $totalCount === 1 ? 'Eintrag' : 'Einträge' }}
                    @endif
                </p>
                
            @elseif($referenceType === 'content' && $referencedContent)
                {{-- Content Reference: Render all elements from the referenced content --}}
                @if(count($referencedContent->elements ?? []) > 0)
                    <div class="reference-box__elements">
                        @foreach($referencedContent->elements as $refElement)
                            @include('contents.partials.element', ['element' => $refElement])
                        @endforeach
                    </div>
                @else
                    <p class="reference-box__empty">Dieser Content hat keine Elemente.</p>
                @endif
                
            @elseif($referenceType === 'element' && $referencedElement)
                {{-- Element Reference: Render only the specific element --}}
                <div class="reference-box__elements">
                    @include('contents.partials.element', ['element' => $referencedElement])
                </div>
                
            @else
                <p class="reference-box__error">Referenz konnte nicht aufgelöst werden.</p>
            @endif
        </div>
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

