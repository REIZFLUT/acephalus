{{--
    Preview Elements Partial
    
    Renders content elements for standard (non-meta-only) content types.
    
    @param array $elements - Array of content elements
--}}

@if(!empty($elements))
    @foreach($elements as $element)
        @include('contents.partials.element', ['element' => $element])
    @endforeach
@else
    <p class="preview-empty">Keine Inhalte vorhanden.</p>
@endif

