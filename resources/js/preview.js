/**
 * Content Preview JavaScript
 * 
 * Handles Markdown rendering, KaTeX math formulas, and CodeMirror JSON display
 * for the standalone content preview page.
 */

/**
 * Initialize Markdown rendering with KaTeX support
 */
function initializeMarkdown() {
    if (typeof marked === 'undefined') {
        console.warn('marked.js is not loaded');
        return;
    }

    // Configure marked
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    // Find and render all markdown content elements
    document.querySelectorAll('.markdown-content').forEach(element => {
        const markdown = element.textContent;
        element.innerHTML = marked.parse(markdown);

        // Render KaTeX in the markdown content
        renderKaTeXInElement(element);
    });
}

/**
 * Render KaTeX math formulas within an element
 * @param {HTMLElement} element - The element to search for math expressions
 */
function renderKaTeXInElement(element) {
    if (typeof renderMathInElement === 'undefined') {
        console.warn('KaTeX auto-render is not loaded');
        return;
    }

    renderMathInElement(element, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
    });
}

/**
 * Initialize standalone KaTeX formula elements
 */
function initializeKaTeX() {
    if (typeof katex === 'undefined') {
        console.warn('KaTeX is not loaded');
        return;
    }

    document.querySelectorAll('.katex-formula').forEach(element => {
        const formula = element.textContent;
        const displayMode = element.dataset.display === 'true';
        
        try {
            katex.render(formula, element, {
                displayMode: displayMode,
                throwOnError: false
            });
        } catch (error) {
            console.error('KaTeX rendering error:', error);
        }
    });
}

/**
 * Initialize CodeMirror for JSON display fields
 */
function initializeCodeMirror() {
    if (typeof CodeMirror === 'undefined') {
        console.warn('CodeMirror is not loaded');
        return;
    }

    document.querySelectorAll('.json-codemirror-container').forEach(container => {
        const sourceTextarea = container.querySelector('.json-codemirror-source');
        
        if (!sourceTextarea) {
            return;
        }

        const jsonContent = sourceTextarea.value;

        // Create a new textarea for CodeMirror
        const cmTextarea = document.createElement('textarea');
        container.appendChild(cmTextarea);

        // Initialize CodeMirror
        const editor = CodeMirror.fromTextArea(cmTextarea, {
            value: jsonContent,
            mode: { name: 'javascript', json: true },
            theme: 'material-darker',
            readOnly: true,
            lineNumbers: true,
            lineWrapping: true,
            viewportMargin: Infinity,
            tabSize: 2,
        });

        // Set the content
        editor.setValue(jsonContent);
    });
}

/**
 * Initialize all preview functionality
 */
function initializePreview() {
    initializeMarkdown();
    initializeKaTeX();
    initializeCodeMirror();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePreview);
} else {
    initializePreview();
}

// Export functions for potential external use
window.PreviewHelpers = {
    initializeMarkdown,
    initializeKaTeX,
    initializeCodeMirror,
    initializePreview,
    renderKaTeXInElement
};


