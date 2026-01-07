{{--
    Preview Header Partial
    
    Displays the content title, collection info, status, and optional metadata.
    
    @param \App\Models\Mongodb\Content $content
--}}

<div class="preview-header">
    <h1 class="preview-title">{{ $content->title }}</h1>
    
    <div class="preview-meta">
        {{ $content->collection->name }} ·
        {{ ucfirst($content->status->value) }} ·
        {{ $content->updated_at->format('d.m.Y H:i') }}
    </div>

    @if(!empty($content->metadata))
        <div class="preview-meta-table" style="margin-top: 1rem;">
            <table class="meta-table">
                <thead>
                    <tr>
                        <th>Feld</th>
                        <th>Wert</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($content->metadata as $key => $value)
                        <tr>
                            <td><strong>{{ $key }}</strong></td>
                            <td>{{ is_array($value) ? json_encode($value) : $value }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
</div>



