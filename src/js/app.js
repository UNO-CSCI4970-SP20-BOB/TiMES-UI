
/**
 * Initializes page.
 */
function init() {
    // Page is ready to run JavaScript
}


/**
 * Runs when page is ready.
 */
function pageReady() {
    console.debug('pageReady()');
    document.removeEventListener("DOMContentLoaded", pageReady);
    window.removeEventListener("load", pageReady);
    init();
}
document.addEventListener("DOMContentLoaded", pageReady);
window.addEventListener("load", pageReady);
