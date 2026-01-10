<?php
header('Content-Type: application/json');

if (function_exists('opcache_reset')) {
    opcache_reset();
    echo json_encode([
        'status' => 'ok',
        'message' => 'OPcache reset successful',
        'time' => date('Y-m-d H:i:s'),
        'fix' => 'Double tool execution fixed - using placeholder in ->using() callbacks'
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'OPcache not available']);
}
