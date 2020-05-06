import $ from 'jquery';
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
    $('.mdc-top-app-bar').each(function () {
        const item = new MDCTopAppBar(this);
        materialObjects.set(this, item);
    });
    $('.mdc-button, .mdc-card__primary-action')
        .filter(':not(.mdc-snackbar__action, .mdc-snackbar__dismiss)')
        .each(function () {
            const item = new MDCRipple(this);
            materialObjects.set(this, item);
        });
    $('.mdc-icon-button').each(function () {
        const item = new MDCRipple(this);
        item.unbounded = true;
        materialObjects.set(this, item);
    });
    $('.mdc-list').each(function () {
        const item = new MDCList(this);
        materialObjects.set(this, item);
    });
    $('.mdc-dialog').each(function () {
        const item = new MDCDialog(this);
        materialObjects.set(this, item);
    });
    $('.mdc-snackbar').each(function () {
        const item = new MDCSnackbar(this);
        materialObjects.set(this, item);
    });
    console.log(materialObjects);


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

$(document).ready(init);
