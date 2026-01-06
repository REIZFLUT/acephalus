{{--
    Preview Meta Table Partial
    
    Displays metadata fields in a structured table for meta-only content types.
    
    @param array $contentMetaFields - Field definitions from schema
    @param array|null $metadata - The actual metadata values
--}}

@if(count($contentMetaFields) > 0 && !empty($metadata))
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
                    $value = $metadata[$fieldName] ?? null;
                @endphp
                <tr>
                    <td><strong>{{ $fieldLabel }}</strong></td>
                    <td>
                        @include('contents.partials.preview-field-value', [
                            'value' => $value,
                            'fieldType' => $fieldType
                        ])
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
@else
    <p class="preview-empty">Keine Metadaten vorhanden.</p>
@endif

