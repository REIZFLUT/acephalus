import {
    Image as ImageIcon,
    File,
    Video,
    Music,
    FileText,
    type LucideIcon,
} from 'lucide-react';

/**
 * Get the appropriate Lucide icon for a given MIME type
 */
export function getFileIcon(mimeType: string): LucideIcon {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.startsWith('text/') || mimeType.includes('pdf')) return FileText;
    return File;
}

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * MIME type to file extension mapping
 */
const MIME_TYPE_MAP: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WEBP',
    'image/svg+xml': 'SVG',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
    'video/mp4': 'MP4',
    'video/webm': 'WEBM',
    'video/quicktime': 'MOV',
    'video/x-msvideo': 'AVI',
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/ogg': 'OGG',
    'audio/flac': 'FLAC',
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'application/json': 'JSON',
    'text/plain': 'TXT',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'text/javascript': 'JS',
    'application/javascript': 'JS',
};

/**
 * Get user-friendly file type label from filename or MIME type
 */
export function getFileTypeLabel(filename: string, mimeType: string): string {
    // First try to get extension from filename
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && ext !== filename.toLowerCase()) {
        return ext.toUpperCase();
    }
    
    // Check MIME type map
    if (MIME_TYPE_MAP[mimeType]) {
        return MIME_TYPE_MAP[mimeType];
    }
    
    // Try to extract from MIME type (e.g., "image/png" -> "PNG")
    const parts = mimeType.split('/');
    if (parts.length === 2) {
        const subtype = parts[1].split('+')[0].split('.').pop();
        if (subtype && subtype.length <= 5) {
            return subtype.toUpperCase();
        }
    }
    
    return 'FILE';
}
