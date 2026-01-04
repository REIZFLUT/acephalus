{{-- Contact Data Custom Element Template --}}
@php
    $contactType = $data['contactType'] ?? 'phone';
    $value = $data['value'] ?? '';
    $info = $data['info'] ?? '';
    
    $typeConfig = match($contactType) {
        'phone' => [
            'icon' => '📞',
            'label' => 'Telefon',
            'href' => 'tel:' . preg_replace('/[^\d+]/', '', $value),
        ],
        'mobile' => [
            'icon' => '📱',
            'label' => 'Mobil',
            'href' => 'tel:' . preg_replace('/[^\d+]/', '', $value),
        ],
        'email' => [
            'icon' => '✉️',
            'label' => 'E-Mail',
            'href' => 'mailto:' . $value,
        ],
        'website' => [
            'icon' => '🌐',
            'label' => 'Website',
            'href' => str_starts_with($value, 'http') ? $value : 'https://' . $value,
        ],
        'address' => [
            'icon' => '📍',
            'label' => 'Adresse',
            'href' => 'https://maps.google.com/?q=' . urlencode($value),
        ],
        'fax' => [
            'icon' => '📠',
            'label' => 'Fax',
            'href' => null,
        ],
        'linkedin' => [
            'icon' => '💼',
            'label' => 'LinkedIn',
            'href' => str_starts_with($value, 'http') ? $value : 'https://linkedin.com/in/' . $value,
        ],
        'xing' => [
            'icon' => '🔗',
            'label' => 'XING',
            'href' => str_starts_with($value, 'http') ? $value : 'https://xing.com/profile/' . $value,
        ],
        'twitter' => [
            'icon' => '𝕏',
            'label' => 'Twitter / X',
            'href' => str_starts_with($value, 'http') ? $value : 'https://x.com/' . ltrim($value, '@'),
        ],
        'instagram' => [
            'icon' => '📷',
            'label' => 'Instagram',
            'href' => str_starts_with($value, 'http') ? $value : 'https://instagram.com/' . ltrim($value, '@'),
        ],
        'facebook' => [
            'icon' => '👤',
            'label' => 'Facebook',
            'href' => str_starts_with($value, 'http') ? $value : 'https://facebook.com/' . $value,
        ],
        'youtube' => [
            'icon' => '▶️',
            'label' => 'YouTube',
            'href' => str_starts_with($value, 'http') ? $value : 'https://youtube.com/' . $value,
        ],
        'tiktok' => [
            'icon' => '🎵',
            'label' => 'TikTok',
            'href' => str_starts_with($value, 'http') ? $value : 'https://tiktok.com/@' . ltrim($value, '@'),
        ],
        'whatsapp' => [
            'icon' => '💬',
            'label' => 'WhatsApp',
            'href' => 'https://wa.me/' . preg_replace('/[^\d]/', '', $value),
        ],
        'telegram' => [
            'icon' => '✈️',
            'label' => 'Telegram',
            'href' => 'https://t.me/' . ltrim($value, '@'),
        ],
        'signal' => [
            'icon' => '🔒',
            'label' => 'Signal',
            'href' => null,
        ],
        'skype' => [
            'icon' => '☁️',
            'label' => 'Skype',
            'href' => 'skype:' . $value . '?chat',
        ],
        default => [
            'icon' => '📋',
            'label' => 'Sonstiges',
            'href' => null,
        ],
    };
@endphp

<div class="contact-data-element flex items-center gap-3 py-2">
    <span class="contact-icon text-xl" title="{{ $typeConfig['label'] }}">
        {{ $typeConfig['icon'] }}
    </span>
    
    <div class="contact-content flex-1">
        <div class="contact-value">
            @if($typeConfig['href'])
                <a 
                    href="{{ $typeConfig['href'] }}" 
                    class="text-primary hover:underline"
                    @if(in_array($contactType, ['website', 'linkedin', 'xing', 'twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'address']))
                        target="_blank" 
                        rel="noopener noreferrer"
                    @endif
                >
                    {{ $value }}
                </a>
            @else
                <span>{{ $value }}</span>
            @endif
        </div>
        
        @if($info)
            <div class="contact-info text-sm text-gray-500">
                {{ $info }}
            </div>
        @endif
    </div>
</div>

