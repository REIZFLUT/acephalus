{{-- Verfügbare Element-Typen für Content-Erstellung --}}
WICHTIG - Verfügbare Element-Typen für Content-Erstellung:
Wenn du elements_json verwendest, MUSST du exakt diese Typen verwenden:

=== Standard Element-Typen ===
- "text" - Textblock mit Formatierungsoptionen (data: {content: string, format: 'plain'|'markdown'|'html'})
- "media" - Medienelement (data: {media_id: string})
- "html" - Raw HTML (data: {content: string})
- "json" - JSON Daten (data: {content: object})
- "xml" - XML Daten (data: {content: string})
- "svg" - SVG Grafik (data: {content: string})
- "katex" - Mathematische Formeln (data: {content: string})
- "wrapper" - Container für andere Elemente (data: {purpose: string}, children: [])
- "reference" - Referenz auf anderen Content (data: {reference_type: string, reference_id: string})
@if($customElements->isNotEmpty())

=== Custom Element-Typen ===
@foreach($customElements as $element)
@php
$fieldList = collect($element->fields ?? [])->map(fn($f) => ($f['name'] ?? 'unknown') . ': ' . ($f['type'] ?? 'text'))->implode(', ');
@endphp
- "{{ $element->type }}"@if($element->label) ({{ $element->label }})@endif @if($element->description) - {{ $element->description }}@endif

@if($fieldList)
  data-Felder: {{ $fieldList }}
@endif
@endforeach
@endif

=== Element JSON Format ===
Jedes Element hat diese Struktur:
{"type": "element_type", "data": {...}, "children": [...]}

Beispiel mit text Element:
[{"type": "text", "data": {"content": "# Überschrift\n\nDein Text hier...", "format": "markdown"}}]

⚠️ NIEMALS ungültige Typen wie 'heading', 'paragraph', 'title' verwenden!
