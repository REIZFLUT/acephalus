{{-- Info Box Custom Element Template --}}
@php
    $type = $data['type'] ?? 'info';
    $title = $data['title'] ?? '';
    $content = $data['content'] ?? '';
    $dismissible = $data['dismissible'] ?? false;
    $showIcon = $data['icon'] ?? true;
    
    $typeConfig = match($type) {
        'success' => [
            'class' => 'bg-green-50 border-green-500 text-green-800',
            'icon' => '✓',
            'iconClass' => 'text-green-600'
        ],
        'warning' => [
            'class' => 'bg-yellow-50 border-yellow-500 text-yellow-800',
            'icon' => '⚠',
            'iconClass' => 'text-yellow-600'
        ],
        'error' => [
            'class' => 'bg-red-50 border-red-500 text-red-800',
            'icon' => '✕',
            'iconClass' => 'text-red-600'
        ],
        'tip' => [
            'class' => 'bg-purple-50 border-purple-500 text-purple-800',
            'icon' => '💡',
            'iconClass' => 'text-purple-600'
        ],
        default => [
            'class' => 'bg-blue-50 border-blue-500 text-blue-800',
            'icon' => 'ℹ',
            'iconClass' => 'text-blue-600'
        ],
    };
@endphp

<div 
    class="info-box {{ $typeConfig['class'] }} border-l-4 p-4 my-4 rounded-r-lg"
    @if($dismissible) x-data="{ open: true }" x-show="open" @endif
>
    <div class="flex items-start gap-3">
        @if($showIcon)
            <span class="info-box-icon {{ $typeConfig['iconClass'] }} text-xl leading-none shrink-0">
                {{ $typeConfig['icon'] }}
            </span>
        @endif
        
        <div class="info-box-content flex-1">
            @if($title)
                <h4 class="info-box-title font-semibold mb-1">{{ $title }}</h4>
            @endif
            <div class="info-box-text">
                {!! $content !!}
            </div>
        </div>
        
        @if($dismissible)
            <button 
                type="button" 
                class="info-box-close text-current opacity-50 hover:opacity-100 transition-opacity"
                @click="open = false"
                aria-label="Close"
            >
                ✕
            </button>
        @endif
    </div>
</div>

