import { MDCDialog } from '@material/dialog';
import { MDCList } from '@material/list';
import { MDCRipple } from '@material/ripple';
import { MDCSnackbar } from '@material/snackbar';
import { MDCTopAppBar } from '@material/top-app-bar';

import { EventsPage } from './modules/events.js';

const PAGE_MODULES = new Map();
PAGE_MODULES.set('events', EventsPage);

/**
 * Initializes page and calls page specific code if needed.
 *
 * Ran when page is ready to run JavaScript.
 */
function init() {
    console.debug('init()');

    // Initialize Material Design objects
    const materialObjects = new Map();
    document
        .querySelectorAll('.mdc-top-app-bar')
        .forEach(element => {
            const item = new MDCTopAppBar(element);
            materialObjects.set(element, item);
        });
    [...document.querySelectorAll('.mdc-button, .mdc-card__primary-action')]
        .filter(element => {
            return !(
                element.classList.contains('no-auto-js')
                || element.classList.contains('mdc-snackbar__action')
                || element.classList.contains('mdc-snackbar__dismiss')
            );
        })
        .forEach(element => {
            const item = new MDCRipple(element);
            materialObjects.set(element, item);
        });
    document
        .querySelectorAll('.mdc-icon-button:not(.no-auto-js)')
        .forEach(element => {
            const item = new MDCRipple(element);
            item.unbounded = true;
            materialObjects.set(element, item);
        });
    document
        .querySelectorAll('.mdc-list:not(.no-auto-js)')
        .forEach(element => {
            const item = new MDCList(element);
            materialObjects.set(element, item);
        });
    document
        .querySelectorAll('.mdc-dialog:not(.no-auto-js)')
        .forEach(element => {
            const item = new MDCDialog(element);
            materialObjects.set(element, item);
        });
    document
        .querySelectorAll('.mdc-snackbar:not(.no-auto-js)')
        .forEach(element => {
            const item = new MDCSnackbar(element);
            materialObjects.set(element, item);
        });


    // Check for page name
    const pageName = window['pageName'];
    if (pageName) {
        // Check for module for page name
        if (PAGE_MODULES.has(pageName)) {
            // Initialize the page
            const pageClass = PAGE_MODULES.get(pageName);
            new pageClass(materialObjects);
        }
    }
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
