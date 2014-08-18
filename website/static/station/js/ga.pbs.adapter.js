/*global window*/
/*jslint nomen: true, plusplus: true*/
(function(window) {
    'use strict';

    if (!window.PBS) {
        window.PBS = {};
    }

    // define the PBS Google Analytics adapter
    window.PBS.GA = (function() {
        var tracker = [],
            page_tracking = [],
            event_tracking = [],
            profile_tracking = [],
            universal_page_tracking = [];

        window._gaq = window._gaq || [];

        // register a new pageview tracking code
        function registerPageviewTrackingCode(code) {
            page_tracking.push(code);
        }

        // register a new event tracking code
        function registerEventTrackingCode(code) {
            event_tracking.push(code);
        }
        // register Gigya profile tracking code
        function registerProfileTrackingCode(code) {
            profile_tracking.push(code);
        }

        // register a new pageview tracking code for universal analytics
        function registerPageviewUniversalTrackingCode(code) {
            universal_page_tracking.push(code);
        }

        // track a pageview using all the pageview tracking codes
        function trackPageview() {
            var i;
            for (i = 0; i < page_tracking.length; i++) {
                if (!tracker[i]) {
                    tracker[i] = 'pt' + i;
                }
                window._gaq.push([tracker[i] + '._setAccount', page_tracking[i]], [tracker[i] + '._trackPageview']);
            }
        }

        // track an event using all the event tracking codes
        function trackEvent(category, action, opt_label, opt_value, opt_noninteraction) {
            var i, tracker;
            for (i = 0; i < event_tracking.length; i++) {
                tracker = 'et' + (new Date()).getTime();
                window._gaq.push([tracker + '._setAccount', event_tracking[i]], [tracker + '._trackEvent', category, action, opt_label ? opt_label : null, opt_value ? opt_value : null, opt_noninteraction ? opt_noninteraction : null]);
            }
        }

        // set the value of a custom variable
        function setCustomVar(index, name, value, opt_scope) {
            var i;
            for (i = 0; i < page_tracking.length; i++) {
                if (!tracker[i]) {
                    tracker[i] = 'pt' + i;
                }
                window._gaq.push([tracker[i] + '._setCustomVar', index, name, value, opt_scope]);
            }
        }

        // gigya track add program to watchlist
        function trackProfileEvent(category, action, opt_label, opt_value, opt_noninteraction) {
            var i, tracker;
            for (i = 0; i < profile_tracking.length; i++) {
                tracker = 'et' + (new Date()).getTime();
                window._gaq.push([tracker + '._setAccount', profile_tracking[i]], [tracker + '._trackEvent', category, action, opt_label ? opt_label : null, opt_value ? opt_value : null, opt_noninteraction ? opt_noninteraction : null]);
            }
        }

        function trackUniversalPageView() {
            var i, tracker_name;
            for (i = 0; i < universal_page_tracking.length; i++) {
                tracker_name = 'uga_' + i;
                window._uga('create', universal_page_tracking[i],  {name: tracker_name});
                window._uga(tracker_name + '.send', 'pageview');
            }
        }

        return {
            registerPageviewTrackingCode : registerPageviewTrackingCode,
            registerEventTrackingCode : registerEventTrackingCode,
            registerProfileTrackingCode : registerProfileTrackingCode,
            trackPageview : trackPageview,
            trackEvent : trackEvent,
            trackProfileEvent : trackProfileEvent,
            trackUniversalPageView: trackUniversalPageView,
            registerPageviewUniversalTrackingCode: registerPageviewUniversalTrackingCode,
            setCustomVar : setCustomVar
        };
    }());
}(window));
