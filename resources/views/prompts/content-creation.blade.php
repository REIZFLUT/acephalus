{{-- Prompt für Content-Erstellung --}}
Erstelle Content basierend auf den Vorgaben des Benutzers.

Beachte dabei:
- Verwende die richtige Collection
- Fülle alle erforderlichen Metadaten aus
- Strukturiere den Inhalt sinnvoll mit passenden Block-Elementen
- Frage nach wenn wichtige Informationen fehlen

@if(isset($collection))
=== Aktuelle Collection ===
Name: {{ $collection->name }}
@if($collection->description)
Beschreibung: {{ $collection->description }}
@endif
@if(!empty($collection->schema?->contentMetaFields))
Metadaten-Felder:
@foreach($collection->schema->contentMetaFields as $field)
- {{ $field['name'] }}: {{ $field['type'] }}@if($field['required'] ?? false) (Pflichtfeld)@endif

@endforeach
@endif
@endif
