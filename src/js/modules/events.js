import axios from 'axios';
import { MDCDialog } from '@material/dialog';
import { MDCList } from '@material/list';
import { MDCSnackbar } from '@material/snackbar';
import { MDCTopAppBar } from '@material/top-app-bar';
import { strings as MDCDialogStrings } from '@material/dialog/constants';
import { strings as MDCListStrings } from '@material/list/constants';
import { strings as MDCSnackbarStrings } from '@material/snackbar/constants';
import { strings as MDCTopAppBarStrings } from '@material/top-app-bar/constants';

const cssClasses = {
    APP_BAR_HIDDEN: 'app-bar--hidden',
    APP_BAR_CONTENT_HIDDEN: 'app-bar--content-hidden',
    EVENT_CARD_JOB_CHECKBOX: 'event-card__job-checkbox',
    EVENT_CARD_JOB_LIST: 'event-card__job-list'
};

const cssIds = {
    MAIN_APP_BAR: 'main-app-bar',
    APP_BAR: 'events-contextual-app-bar',
    APP_BAR_TITLE: 'events-contextual-app-bar-title',
    APP_BAR_CONFIRM: 'events-contextual-app-bar-confirm',
    DIALOG: 'events-confirm-dialog',
    DIALOG_CONTENT: 'events-confirm-dialog-content',
    SNACKBAR_SIGN_UP_START: 'events-snackbar-sign-up-start',
    SNACKBAR_SIGN_UP_END: 'events-snackbar-sign-up-end',
    SNACKBAR_SIGN_UP_FAIL: 'events-snackbar-sign-up-fail'
};

const strings = {
    SELECTED: 'selected',
    DIALOG_ACTION_CONFIRM: 'confirm',
    DIALOG_CONTENT_START: 'This will sign you up for ',
    DIALOG_CONTENT_END: ' jobs.'
};

/**
 * Logic for Events page.
 */
export class EventsPage {
    /**
     * Initializes events page.
     * @param {Map<Element, MDCComponent>} materialObjects - Map of Element keys with instantiated Material Design Component values
     */
    constructor(materialObjects) {
        console.debug('EventsPage: constructor(materialObjects)', materialObjects);

        this.jobList = new Set();
        this.contextualAppBarVisible = false;

        materialObjects.forEach((value, key) => {
            if (value instanceof MDCList && key.classList.contains(cssClasses.EVENT_CARD_JOB_LIST)) {
                // Add listener to all MDCLists job lists on page
                value.listen(MDCListStrings.ACTION_EVENT, this.listActionEvent.bind(this));
            }

            if (value instanceof MDCTopAppBar && key.id === cssIds.MAIN_APP_BAR) {
                // Keep track of main app bar
                this.mainAppBar = [key, value];
            }

            if (value instanceof MDCTopAppBar && key.id === cssIds.APP_BAR) {
                // Keep track of events app bar
                this.contextualAppBar = [key, value];
                // Add listener to contextual MDCTopAppBar on page
                value.listen(MDCTopAppBarStrings.NAVIGATION_EVENT, this.contextualAppBarNavigationEvent.bind(this));
            }

            if (value instanceof MDCDialog && key.id === cssIds.DIALOG) {
                // Keep track of confirmation dialog
                this.confirmDialog = [key, value];
                // Add listener to confirm event
                value.listen(MDCDialogStrings.CLOSING_EVENT, this.confirmDialogClosingEvent.bind(this));
            }

            if (value instanceof MDCSnackbar && key.id === cssIds.SNACKBAR_SIGN_UP_START) {
                // Keep track of snackbar sign up start
                this.snackbarSignUpStart = [key, value];
                // Disabled timeout
                this.snackbarSignUpStart[1].timeoutMs = -1;
            }

            if (value instanceof MDCSnackbar && key.id === cssIds.SNACKBAR_SIGN_UP_END) {
                // Keep track of snackbar sign up end
                this.snackbarSignUpEnd = [key, value];
            }

            if (value instanceof MDCSnackbar && key.id === cssIds.SNACKBAR_SIGN_UP_FAIL) {
                // Keep track of snackbar sign up fail
                this.snackbarSignUpFail = [key, value];
                // Add listener to action event
                value.listen(MDCSnackbarStrings.CLOSING_EVENT, this.failSnackbarClosingEvent.bind(this));
            }
        });

        if (null == this.mainAppBar) {
            console.error('EventsPage: Missing Main App Bar');
        }

        if (null == this.contextualAppBar) {
            console.error('EventsPage: Missing Contextual App Bar');
        } else {
            this.confirmButton = this.contextualAppBar[0].querySelector('#' + cssIds.APP_BAR_CONFIRM);
        }

        if (null == this.confirmButton) {
            console.error('EventsPage: Missing Contextual App Bar Button');
        } else {
            this.confirmButton.addEventListener('click', this.confirmButtonClickEvent.bind(this));
        }

        if (null == this.confirmDialog) {
            console.error('EventsPage: Missing Confirm Dialog');
        } else {
            this.confirmDialogContent = this.confirmDialog[0].querySelector('#' + cssIds.DIALOG_CONTENT);
        }

        if (null == this.confirmDialogContent) {
            console.error('EventsPage: Missing Confirm Dialog Content');
        }

        if (null == this.snackbarSignUpStart) {
            console.error('EventsPage: Missing Snackbar Sign Up Start');
        }

        if (null == this.snackbarSignUpEnd) {
            console.error('EventsPage: Missing Snackbar Sign Up End');
        }

        if (null == this.snackbarSignUpFail) {
            console.error('EventsPage: Missing Snackbar Sign Up Fail');
        }
    }

    /**
     * Handle event from MDCList.
     * @param {Event} event - Event from Material Design List component
     */
    listActionEvent(event) {
        console.debug('EventsPage: listEvent(event)', event);
        const row = event.target.children[event.detail.index];
        const checkbox = row.querySelector('.' + cssClasses.EVENT_CARD_JOB_CHECKBOX);

        if (checkbox.checked) {
            this.jobSelected(checkbox.id);
        } else {
            this.jobDeselected(checkbox.id);
        }
    }

    /**
     * Records job selection in job list.
     * @param {int} jobId - Job ID that was selected
     */
    jobSelected(jobId) {
        console.debug('EventsPage: jobSelected(jobId)', jobId);
        this.jobList.add(jobId);
        this.jobListChange();
    }

    /**
     * Records job deselection in job list.
     * @param {int} jobId - Job ID that was deselected
     */
    jobDeselected(jobId) {
        console.debug('EventsPage: jobDeselected(jobId)', jobId);
        this.jobList.delete(jobId);
        this.jobListChange();
    }

    /**
     * Runs when job list is changed.
     */
    jobListChange() {
        console.debug('EventsPage: jobListChange()', this.jobList);
        this.updateContextualAppBar();
    }

    /**
     * Updates data in contextual app bar.
     */
    updateContextualAppBar() {
        console.debug('EventsPage: updateContextualAppBar()');

        let displayNumber;
        if (this.jobList.size > 0) {
            displayNumber = this.jobList.size;
            this.showContextualAppBar();
        } else {
            // Don't show below 1, the bar should hide
            displayNumber = 1;
            this.hideContextualAppBar();
        }

        const contextualAppBarTitle = this.contextualAppBar[0].querySelector('#' + cssIds.APP_BAR_TITLE);
        contextualAppBarTitle.innerHTML = displayNumber + ' ' + strings.SELECTED;
    }

    /**
     * Displays the contextual app bar instead of the main app bar.
     */
    showContextualAppBar() {
        console.debug('EventsPage: showContextualAppBar()');
        if (this.contextualAppBarVisible) {
            return;
        }

        this.contextualAppBarVisible = true;
        this.contextualAppBar[0].classList.remove(cssClasses.APP_BAR_HIDDEN);
        this.mainAppBar[0].classList.add(cssClasses.APP_BAR_CONTENT_HIDDEN);
    }

    /**
     * Displays the main app bar instead of the contextual app bar.
     */
    hideContextualAppBar() {
        console.debug('EventsPage: hideContextualAppBar()');
        if (!this.contextualAppBarVisible) {
            return;
        }

        this.contextualAppBarVisible = false;
        this.contextualAppBar[0].classList.add(cssClasses.APP_BAR_HIDDEN);
        this.mainAppBar[0].classList.remove(cssClasses.APP_BAR_CONTENT_HIDDEN);
    }

    /**
     * Handle navigation event from contextual app bar.
     * @param {Event} event - Event from Material Design App Bar component
     */
    contextualAppBarNavigationEvent(event) {
        console.debug('EventsPage: contextualAppBarEvent(event)', event);
        this.deselectAllJobs();
    }


    /**
     * Deselect all selected jobs.
     */
    deselectAllJobs() {
        console.debug('EventsPage: deselectAllJobs()');

        [].map.call(document.querySelectorAll('.' + cssClasses.EVENT_CARD_JOB_CHECKBOX + ':checked'), function (element) {
            element.click();
            return;
        });
    }

    /**
     * Handle click event from contextual app bar confirm button.
     * @param {Event} event - Event from button
     */
    confirmButtonClickEvent(event) {
        console.debug('EventsPage: confirmButtonClickEvent(event)', event);
        this.confirmJobs();
    }

    /**
     * Show confirm jobs dialog.
     */
    confirmJobs() {
        console.debug('EventsPage: confirmJobs()');

        this.confirmDialogContent.innerHTML =
            strings.DIALOG_CONTENT_START
            + this.jobList.size
            + strings.DIALOG_CONTENT_END;

        this.confirmDialog[1].open();
    }


    /**
     * Handle closing event from confirm dialog.
     * @param {Event} event - Event from Material Design Dialog component
     */
    confirmDialogClosingEvent(event) {
        console.debug('EventsPage: confirmDialogClosingEvent(event)', event);

        if (event.detail.action == strings.DIALOG_ACTION_CONFIRM) {
            this.signUpJobs(this.jobList);
        }
    }


    /**
     * Sign up for selected jobs.
     * @param {Set<int>} jobList - Set of job ids to sign up for
     */
    signUpJobs(jobList) {
        console.debug('EventsPage: signUpJobs(jobList)', jobList);

        this.showSignUpSnackbarStart();

        const sentJobList = new Set(jobList);

        axios
            .post('./sign-up', Array.from(sentJobList))
            .then(() => {
                this.deselectAllJobs();
                this.showSignUpSnackbarEnd();
            }).catch(() => {
                this.showSignUpSnackbarFail(sentJobList);
            });
    }

    /**
     * Show start signup snackbar.
     */
    showSignUpSnackbarStart() {
        console.debug('showSignUpSnackbarStart()');
        this.snackbarSignUpEnd[1].close();
        this.snackbarSignUpFail[1].close();

        this.snackbarSignUpStart[1].open();
    }

    /**
     * Show end signup snackbar.
     */
    showSignUpSnackbarEnd() {
        console.debug('showSignUpSnackbarEnd()');
        this.snackbarSignUpStart[1].close();
        this.snackbarSignUpFail[1].close();

        this.snackbarSignUpEnd[1].open();
        this.failedSignUp = null;
    }

    /**
     * Show failed signup snackbar.
     * @param {Set<int>} jobList - Set of job ids that failed
     */
    showSignUpSnackbarFail(jobList) {
        console.debug('showSignUpSnackbarFail(jobList)', jobList);
        this.snackbarSignUpStart[1].close();
        this.snackbarSignUpEnd[1].close();

        this.snackbarSignUpFail[1].open();
        this.failedSignUp = jobList;
    }


    /**
     * Handle closing event from sign up fail snackbar.
     * @param {Event} event - Event from Material Design Dialog component
     */
    failSnackbarClosingEvent(event) {
        console.debug('failSnackbarClosingEvent(event)', event);

        if (event.detail.reason == MDCSnackbarStrings.REASON_ACTION) {
            this.signUpJobs(this.failedSignUp);
        }
    }
}
