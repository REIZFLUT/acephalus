{{--
    Preview Field Value Partial
    
    Renders a metadata field value based on its type.
    
    @param mixed $value - The field value
    @param string $fieldType - The field type (text, boolean, date, etc.)
--}}

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
    <span>{{ is_array($value) ? json_encode($value) : $value }}</span>
@endif


