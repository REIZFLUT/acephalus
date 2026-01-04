{{-- Quote Custom Element Template --}}
@php
    $quote = $data['quote'] ?? '';
    $author = $data['author'] ?? '';
    $source = $data['source'] ?? '';
    $sourceUrl = $data['sourceUrl'] ?? '';
    $style = $data['style'] ?? 'simple';
    $showQuoteMarks = $data['showQuoteMarks'] ?? true;
    
    $styleClass = match($style) {
        'bordered' => 'quote-bordered border-l-4 border-primary pl-4',
        'highlighted' => 'quote-highlighted bg-primary/5 p-6 rounded-lg',
        default => 'quote-simple',
    };
@endphp

<blockquote class="quote-element {{ $styleClass }} my-6">
    <div class="quote-text text-lg italic">
        @if($showQuoteMarks)
            <span class="quote-mark text-3xl text-primary/30 leading-none">"</span>
        @endif
        {{ $quote }}
        @if($showQuoteMarks)
            <span class="quote-mark text-3xl text-primary/30 leading-none">"</span>
        @endif
    </div>
    
    @if($author || $source)
        <footer class="quote-attribution mt-3 text-sm text-gray-600">
            @if($author)
                <cite class="quote-author font-medium not-italic">— {{ $author }}</cite>
            @endif
            @if($source)
                @if($sourceUrl)
                    <span class="quote-source">, <a href="{{ $sourceUrl }}" class="underline hover:no-underline" target="_blank" rel="noopener">{{ $source }}</a></span>
                @else
                    <span class="quote-source">, {{ $source }}</span>
                @endif
            @endif
        </footer>
    @endif
</blockquote>

