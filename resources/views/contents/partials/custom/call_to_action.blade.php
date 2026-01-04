{{-- Call to Action Custom Element Template --}}
@php
    $headline = $data['headline'] ?? '';
    $subtext = $data['subtext'] ?? '';
    $buttonText = $data['buttonText'] ?? 'Mehr erfahren';
    $buttonUrl = $data['buttonUrl'] ?? '#';
    $buttonStyle = $data['buttonStyle'] ?? 'primary';
    $openInNewTab = $data['openInNewTab'] ?? false;
    $alignment = $data['alignment'] ?? 'center';
    
    $alignmentClass = match($alignment) {
        'left' => 'text-left',
        'right' => 'text-right',
        default => 'text-center',
    };
    
    $buttonClass = match($buttonStyle) {
        'secondary' => 'btn btn-secondary',
        'outline' => 'btn btn-outline',
        default => 'btn btn-primary',
    };
@endphp

<div class="cta-element {{ $alignmentClass }} py-8">
    @if($headline)
        <h2 class="cta-headline text-2xl font-bold mb-2">{{ $headline }}</h2>
    @endif
    
    @if($subtext)
        <p class="cta-subtext text-lg text-gray-600 mb-4">{{ $subtext }}</p>
    @endif
    
    @if($buttonUrl)
        <a 
            href="{{ $buttonUrl }}" 
            class="{{ $buttonClass }}"
            @if($openInNewTab) target="_blank" rel="noopener noreferrer" @endif
        >
            {{ $buttonText }}
        </a>
    @endif
</div>

