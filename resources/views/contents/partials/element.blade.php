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
    {{-- Internal Reference Element - Fully Rendered --}}
    @php
        $referenceType = $data['reference_type'] ?? 'unknown';
        $collectionId = $data['collection_id'] ?? null;
        $contentId = $data['content_id'] ?? null;
        $elementId = $data['element_id'] ?? null;
        $displayTitle = $data['display_title'] ?? 'Unknown Reference';
        
        // Resolve the reference to get the actual data
        $referencedCollection = null;
        $referencedContent = null;
        $referencedElement = null;
        $collectionContents = [];
        $totalCount = 0;
        
        if ($referenceType === 'collection' && $collectionId) {
            $referencedCollection = \App\Models\Mongodb\Collection::find($collectionId);
            if ($referencedCollection) {
                $displayTitle = $referencedCollection->name;
                // Get the 3 newest contents from this collection
                $collectionContents = \App\Models\Mongodb\Content::where('collection_id', $collectionId)
                    ->orderByDesc('created_at')
                    ->limit(3)
                    ->get();
                $totalCount = \App\Models\Mongodb\Content::where('collection_id', $collectionId)->count();
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
                    <p class="reference-box__empty">Diese Collection hat keine Einträge.</p>
                @endif
                <p class="reference-box__total">Gesamt: {{ $totalCount }} {{ $totalCount === 1 ? 'Eintrag' : 'Einträge' }}</p>
                
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

