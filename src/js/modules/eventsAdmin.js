import axios from 'axios';
import { MDCList } from '@material/list';
import { MDCSnackbar } from '@material/snackbar';
import { MDCTopAppBar } from '@material/top-app-bar';
import { strings as MDCListStrings } from '@material/list/constants';
import { strings as MDCSnackbarStrings } from '@material/snackbar/constants';
import { strings as MDCTopAppBarStrings } from '@material/top-app-bar/constants';

const cssClasses = {
    APP_BAR_HIDDEN: 'app-bar--hidden',
    EVENT_CARD_WORKER_LIST: 'job-list__worker-list',
    EVENT_CARD_WORKER_CHECKBOX: 'job-list__worker-checkbox',
    EVENT_CARD_JOB: 'job-list__job',
    EVENT_CARD_JOB_CHANGE: 'job-list__job--change',
    EVENT_CARD_JOB_EXPANDED: 'job-list__job--expanded',
    EVENT_CARD_JOB_HEADER: 'job-list__job-header',
    EVENT_CARD_JOB_ICON: 'job-list__job-icon',
    EVENT_CARD_JOB_ROW_ICON: 'job-list__job-row-icon',
    EVENT_CARD_JOB_ROW_TITLE: 'job-list__job-row-title'
};

const cssIds = {
    CONTEXTUAL_APP_BAR: 'events-contextual-app-bar',
    CONTEXTUAL_APP_BAR_TITLE: 'events-contextual-app-bar-title',
    CONTEXTUAL_APP_BAR_CONFIRM: 'events-contextual-app-bar-confirm',
    EVENT_CARD_JOB_PREFIX: 'job',
    MAIN_APP_BAR: 'main-app-bar',
    SNACKBAR_ASSIGNMENT_START: 'events-snackbar-assignment-start',
    SNACKBAR_ASSIGNMENT_END: 'events-snackbar-assignment-end',
    SNACKBAR_ASSIGNMENT_FAIL: 'events-snackbar-assignment-fail'
};

const strings = {
    ASSIGNMENTS_CHANGED: 'assignments changed',
    ICON_ASSIGNED: 'assignment_turned_in',
    ICON_COLLAPSE: 'expand_less',
    ICON_EXPAND: 'expand_more',
    ICON_UNASSIGNED: 'assignment'
};

/**
 * Logic for Events page admin view.
 */
export class EventsAdminPage {
    /**
     * Initializes events admin page.
     * @param {Map<Element, MDCComponent>} materialObjects - Map of Element keys with instantiated Material Design Component values
     */
    constructor(materialObjects) {
        console.debug('EventsAdminPage: constructor(materialObjects)', materialObjects);

        for (const [key, value] of materialObjects) {
            if (value instanceof MDCList && key.classList.contains(cssClasses.EVENT_CARD_WORKER_LIST)) {
                // Add listener to all MDCLists job lists on page
                value.listen(MDCListStrings.ACTION_EVENT, this.workerListActionEvent.bind(this));
            }

            if (value instanceof MDCTopAppBar && key.id === cssIds.MAIN_APP_BAR) {
                // Keep track of main app bar
                this.mainAppBar = [key, value];
            }

            if (value instanceof MDCTopAppBar && key.id === cssIds.CONTEXTUAL_APP_BAR) {
                // Keep track of events app bar
                this.contextualAppBar = [key, value];
                // Add listener to contextual MDCTopAppBar on page
                value.listen(MDCTopAppBarStrings.NAVIGATION_EVENT, this.contextualAppBarNavigationEvent.bind(this));
            }

            if (value instanceof MDCSnackbar && key.id === cssIds.SNACKBAR_ASSIGNMENT_START) {
                // Keep track of snackbar assignment start
                this.snackbarAssignmentStart = [key, value];
                // Disabled timeout
                this.snackbarAssignmentStart[1].timeoutMs = -1;
            }

            if (value instanceof MDCSnackbar && key.id === cssIds.SNACKBAR_ASSIGNMENT_END) {
                // Keep track of snackbar assignment end
                this.snackbarAssignmentEnd = [key, value];
            }

            if (value instanceof MDCSnackbar && key.id === cssIds.SNACKBAR_ASSIGNMENT_FAIL) {
                // Keep track of snackbar assignment fail
                this.snackbarAssignmentFail = [key, value];
                // Add listener to action event
                value.listen(MDCSnackbarStrings.CLOSING_EVENT, this.failSnackbarClosingEvent.bind(this));
            }
        }

        if (null == this.mainAppBar) {
            console.error('EventsAdminPage: Missing Main App Bar');
        }

        if (null == this.contextualAppBar) {
            console.error('EventsAdminPage: Missing Contextual App Bar');
        } else {
            this.confirmButton = this.contextualAppBar[0].querySelector('#' + cssIds.CONTEXTUAL_APP_BAR_CONFIRM);
        }

        if (null == this.confirmButton) {
            console.error('EventsPage: Missing Contextual App Bar Button');
        } else {
            this.confirmButton.addEventListener('click', this.confirmButtonClickEvent.bind(this));
        }

        if (null == this.snackbarAssignmentStart) {
            console.error('EventsPage: Missing Snackbar Assignment Start');
        }

        if (null == this.snackbarAssignmentEnd) {
            console.error('EventsPage: Missing Snackbar Assignment End');
        }

        if (null == this.snackbarAssignmentFail) {
            console.error('EventsPage: Missing Snackbar Assignment Fail');
        }

        // Keep track of assignments at page load and changes
        this.jobsChanged = new Set();
        this.initialAssignmentMap = new Map();
        this.assignmentMap = new Map();

        document
            .querySelectorAll('.' + cssClasses.EVENT_CARD_JOB)
            .forEach((jobRow) => {
                // Add listener to job row
                jobRow.querySelector('.' + cssClasses.EVENT_CARD_JOB_HEADER).addEventListener('click', this.jobRowHeaderClicked.bind(this, jobRow));

                // Populate assignment maps
                const jobId = parseInt(jobRow.dataset.jobId);

                this.initialAssignmentMap.set(jobId, new Set());
                this.assignmentMap.set(jobId, new Set());

                jobRow
                    .querySelectorAll('.' + cssClasses.EVENT_CARD_WORKER_CHECKBOX + ':checked')
                    .forEach(workerCheckbox => {
                        const workerId = parseInt(workerCheckbox.dataset.workerId);
                        this.initialAssignmentMap.get(jobId).add(workerId);
                        this.assignmentMap.get(jobId).add(workerId);
                    });
            });

        console.log(this.initialAssignmentMap, this.assignmentMap);
    }

    /**
     * Handle event from worker MDCList.
     * @param {Event} event - Event from Material Design List component
     */
    workerListActionEvent(event) {
        console.debug('EventsAdminPage: workerListActionEvent(event)', event);
        const row = event.target.children[event.detail.index];
        const checkbox = row.querySelector('.' + cssClasses.EVENT_CARD_WORKER_CHECKBOX);

        const jobId = parseInt(checkbox.dataset.jobId);
        const workerId = parseInt(checkbox.dataset.workerId);
        if (checkbox.checked) {
            this.assignmentAdded(jobId, workerId);
        } else {
            this.assignmentRemoved(jobId, workerId);
        }
    }

    /**
     * Records job assignment in job list.
     * @param {int} jobId - ID of Job for assignment
     * @param {int} workerId - ID of Worker to assign
     */
    assignmentAdded(jobId, workerId) {
        console.debug('EventsAdminPage: assignmentAdded(jobId, workerId)', jobId, workerId);

        const jobWorkers = this.assignmentMap.get(jobId);
        jobWorkers.add(workerId);

        this.assignmentMap.set(jobId, jobWorkers);
        this.jobAssignmentChange(jobId);
    }

    /**
     * Records job revoke in job list.
     * @param {int} jobId - ID of Job for assignment
     * @param {int} workerId - ID of Worker to un-assign
     */
    assignmentRemoved(jobId, workerId) {
        console.debug('EventsAdminPage: assignmentRemoved(jobId, workerId)', jobId, workerId);

        const jobWorkers = this.assignmentMap.get(jobId);
        jobWorkers.delete(workerId);

        this.assignmentMap.set(jobId, jobWorkers);
        this.jobAssignmentChange(jobId);
    }

    /**
     * Runs when a job assignment map changes.
     * @param {int} jobId - ID of job changing
     */
    jobAssignmentChange(jobId) {
        console.debug('EventsAdminPage: jobAssignmentChange(jobId)', jobId);

        const initialWorkers = this.initialAssignmentMap.get(jobId);
        const workers = this.assignmentMap.get(jobId);

        // Check if assignment is different from original
        let change = initialWorkers.size !== workers.size;
        if (!change) {
            // Sets are the same size, see if items are the same
            for (let worker of workers) {
                if (!initialWorkers.has(worker)) {
                    change = true;
                    break;
                }
            }
        }

        // Update job row CSS and changed job list
        const jobRow = document.querySelector('#' + cssIds.EVENT_CARD_JOB_PREFIX + jobId);
        if (change) {
            jobRow.classList.add(cssClasses.EVENT_CARD_JOB_CHANGE);
            this.jobsChanged.add(jobId);
        } else {
            jobRow.classList.remove(cssClasses.EVENT_CARD_JOB_CHANGE);
            this.jobsChanged.delete(jobId);
        }

        // Update job row icon and title
        const jobRowIcon = jobRow.querySelector('.' + cssClasses.EVENT_CARD_JOB_ICON);
        const jobRowTitle = jobRow.querySelector('.' + cssClasses.EVENT_CARD_JOB_ROW_TITLE);
        if (workers.size > 0) {
            jobRowIcon.innerText = strings.ICON_ASSIGNED;

            const workerNames = [];
            jobRow
                .querySelectorAll('.' + cssClasses.EVENT_CARD_WORKER_CHECKBOX + ':checked')
                .forEach(workerCheckbox => {
                    workerNames.push(workerCheckbox.dataset.workerName);
                });
            jobRowTitle.innerText = jobRow.dataset.jobName + ': ' + workerNames.join(', ');
        } else {
            jobRowIcon.innerText = strings.ICON_UNASSIGNED;
            jobRowTitle.innerText = jobRow.dataset.jobName;
        }

        this.updateContextualAppBar();
    }

    /**
     * Updates data in contextual app bar.
     */
    updateContextualAppBar() {
        console.debug('EventsAdminPage: updateContextualAppBar()');

        let displayNumber;
        if (this.jobsChanged.size > 0) {
            displayNumber = this.jobsChanged.size;
            this.showContextualAppBar();
        } else {
            // Don't show below 1, the bar should hide
            displayNumber = 1;
            this.hideContextualAppBar();
        }

        const contextualAppBarTitle = this.contextualAppBar[0].querySelector('#' + cssIds.CONTEXTUAL_APP_BAR_TITLE);
        contextualAppBarTitle.innerText = displayNumber + ' ' + strings.ASSIGNMENTS_CHANGED;
    }

    /**
     * Displays the contextual app bar instead of the main app bar.
     */
    showContextualAppBar() {
        console.debug('EventsAdminPage: showContextualAppBar()');
        this.contextualAppBar[0].classList.remove(cssClasses.APP_BAR_HIDDEN);
        this.mainAppBar[0].classList.add(cssClasses.APP_BAR_CONTENT_HIDDEN);
    }

    /**
     * Displays the main app bar instead of the contextual app bar.
     */
    hideContextualAppBar() {
        console.debug('EventsAdminPage: hideContextualAppBar()');
        this.contextualAppBar[0].classList.add(cssClasses.APP_BAR_HIDDEN);
        this.mainAppBar[0].classList.remove(cssClasses.APP_BAR_CONTENT_HIDDEN);
    }

    /**
     * Handle navigation event from contextual app bar.
     * @param {Event} event - Event from Material Design App Bar component
     */
    contextualAppBarNavigationEvent(event) {
        console.debug('EventsAdminPage: contextualAppBarEvent(event)', event);
        this.resetAllChanges();
    }

    /**
     * Resets all jobs to initial state of page
     */
    resetAllChanges() {
        console.debug('EventsAdminPage: resetAllChanges()');
        for (let jobId of this.jobsChanged) {
            this.resetJobChanges(jobId);
        }
    }

    /**
     * Resets job to initial state of page
     * @param {int} jobId - ID of Job to reset
     */
    resetJobChanges(jobId) {
        console.debug('EventsAdminPage: resetJobChanges(jobId)', jobId);

        const initialAssignment = this.initialAssignmentMap.get(jobId);

        const jobRow = document.querySelector('#' + cssIds.EVENT_CARD_JOB_PREFIX + jobId);
        jobRow
            .querySelectorAll('.' + cssClasses.EVENT_CARD_WORKER_CHECKBOX)
            .forEach(workerCheckbox => {
                const workerId = parseInt(workerCheckbox.dataset.workerId);
                if (initialAssignment.has(workerId)) {
                    // Should be checked
                    if (!workerCheckbox.checked) {
                        workerCheckbox.click();
                    }
                } else {
                    // Should not be checked
                    if (workerCheckbox.checked) {
                        workerCheckbox.click();
                    }
                }
            });
    }

    /**
     * Handle click event from contextual app bar confirm button.
     * @param {Event} event - Event from button
     */
    confirmButtonClickEvent(event) {
        console.debug('EventsAdminPage: confirmButtonClickEvent(event)', event);
        this.saveAssignments(this.assignmentMap);
    }

    /**
     * Save job assignments.
     * @param {Map<int, Set<int>>} assignmentMap - Set of job ids to sign up for
     */
    saveAssignments(assignmentMap) {
        console.debug('EventsAdminPage: saveAssignments(assignmentMap)', assignmentMap);

        const sentAssignmentMap = new Map();
        const assignments = [];

        // Only send changes
        for (let jobId of this.jobsChanged) {
            const workerSet = assignmentMap.get(jobId);

            sentAssignmentMap.set(jobId, new Set(workerSet));

            assignments.push({
                jobId: jobId,
                assignedWorkerIds: Array.from(workerSet)
            });
        }

        this.showAssignmentSnackbarStart();

        axios
            .patch('./assignments', assignments)
            .then(() => {
                this.showAssignmentSnackbarEnd();
            }).catch(() => {
                this.showAssignmentSnackbarFail(sentAssignmentMap);
            });
    }

    /**
     * Handle event from clicking a job row header.
     * @param {Element} jobRow - Element of job row clicked
     * @param {MouseEvent} event - Mouse event from JavaScript
     */
    jobRowHeaderClicked(jobRow, event) {
        console.debug('EventsAdminPage: jobRowHeaderClicked(jobRow, event)', jobRow, event);

        const clickedRowClassList = jobRow.classList;
        const clickedRowIcon = jobRow.querySelector('.' + cssClasses.EVENT_CARD_JOB_ROW_ICON);

        if (clickedRowClassList.contains(cssClasses.EVENT_CARD_JOB_EXPANDED)) {
            clickedRowClassList.remove(cssClasses.EVENT_CARD_JOB_EXPANDED);
            clickedRowIcon.innerText = strings.ICON_EXPAND;
        } else {
            clickedRowClassList.add(cssClasses.EVENT_CARD_JOB_EXPANDED);
            clickedRowIcon.innerText = strings.ICON_COLLAPSE;
        }
    }

    /**
     * Show start assignment snackbar.
     */
    showAssignmentSnackbarStart() {
        console.debug('showAssignmentSnackbarStart()');
        this.snackbarAssignmentEnd[1].close();
        this.snackbarAssignmentFail[1].close();

        this.snackbarAssignmentStart[1].open();
    }

    /**
     * Show end assignment snackbar.
     */
    showAssignmentSnackbarEnd() {
        console.debug('showAssignmentSnackbarEnd()');
        this.snackbarAssignmentStart[1].close();
        this.snackbarAssignmentFail[1].close();

        this.snackbarAssignmentEnd[1].open();
        this.failedAssignment = null;
    }

    /**
     * Show failed assignment snackbar.
     * @param {Map<int, Set<int>>} assignmentMap - Set of job ids that failed
     */
    showAssignmentSnackbarFail(assignmentMap) {
        console.debug('showAssignmentSnackbarFail(assignmentMap)', assignmentMap);
        this.snackbarAssignmentStart[1].close();
        this.snackbarAssignmentEnd[1].close();

        this.snackbarAssignmentFail[1].open();
        this.failedAssignment = assignmentMap;
    }

    /**
     * Handle closing event from assignment fail snackbar.
     * @param {Event} event - Event from Material Design Dialog component
     */
    failSnackbarClosingEvent(event) {
        console.debug('failSnackbarClosingEvent(event)', event);

        if (event.detail.reason == MDCSnackbarStrings.REASON_ACTION) {
            this.saveAssignments(this.failedAssignment);
        }
    }
}
