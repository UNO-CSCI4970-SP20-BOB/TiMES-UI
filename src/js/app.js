import { MDCList } from '@material/list';
import { MDCRipple } from '@material/ripple';
import { MDCTopAppBar } from '@material/top-app-bar';

/**
 * Initializes page.
 */
function init() {
    // Page is ready to run JavaScript
    console.debug('init()');

    const appBarSelector = document.querySelector('.mdc-top-app-bar');
    if (appBarSelector) {
        new MDCTopAppBar(appBarSelector);
    }

    [].map.call(document.querySelectorAll('.mdc-button, .mdc-card__primary-action'), function (element) {
        return new MDCRipple(element);
    });

    [].map.call(document.querySelectorAll('.mdc-icon-button'), function (element) {
        const iconButtonRipple = new MDCRipple(element);
        iconButtonRipple.unbounded = true;
        return iconButtonRipple;
    });

    [].map.call(document.querySelectorAll('.mdc-list'), function (element) {
        return new MDCList(element);
    });
}


/**
 * Runs when page is ready.
 */
function pageReady() {
    console.debug('pageReady()');
    document.removeEventListener('DOMContentLoaded', pageReady);
    window.removeEventListener('load', pageReady);
    init();
}
document.addEventListener('DOMContentLoaded', pageReady);
window.addEventListener('load', pageReady);
