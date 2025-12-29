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

@endif

