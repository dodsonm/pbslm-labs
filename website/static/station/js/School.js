/*jslint browser: true, devel: true */
/*global PBSLM, jQuery */

/*
    School.js encapsulates functionality around authorization.models.School.
    The getSchool endpoint currently only handles fetching by either name or
    postal_code.
*/


(function ($, Logger) {
    'use strict';

    window.PBSLM = window.PBSLM || {};

    PBSLM.School = function () {
        this.endpoints = {};
        this.endpoints.schoolSearchURL =
            PBSLM.urls.schoolSearch; // {% url 'user_profile_school_search' %}
        this.logger = new Logger();
        this.currentQuery = null;
        this.currentResponse = null;
        this.schoolsAsOptions = [];
        this.logger.log(this.endpoints);

        return this;
    };

    //static properties
    PBSLM.School.SCHOOL_RESPONSE_READY = 'schoolResponseReady';
    PBSLM.School.SCHOOL_PARSE_ERROR = 'schoolParseError';

    PBSLM.School.prototype = {
        constructor: PBSLM.School,

        fetchSchool: function (queryObj) {
            // Allows search by either name or postal_code

            //this.logger.log('[PBSLM.School.getSchool]');
            var boundHandleSchoolResponse =
                this.handleSchoolResponse.bind(this);

            // Store the query.
            this.currentQuery = queryObj;

            if (!queryObj.postal_code) {
                this.logger.log('WARNING [PBSLM.School fetchSchool] ' +
                    'Will not process. Not a valid query object: %o', queryObj);
            } else {
                $.ajax({
                    url: this.endpoints.schoolSearchURL,
                    data: queryObj,
                    complete: boundHandleSchoolResponse,
                    dataType: 'json',
                    type: 'GET'
                });
            }

            return this;
        },
        handleSchoolResponse: function (jqXHR, textStatus) {
            this.logger.log('jqXHR: %o; textStatus: %o', jqXHR, textStatus);
            var response, event;

            switch (textStatus) {
            case 'success':
                response = JSON.parse(jqXHR.responseText);
                break;
            default:
                throw ('ERROR [PBSLM.School handleSchoolResponse]' +
                    'Problem with AJAX response.');
            }

            this.currentResponse = response;
            this.buildSchoolsAsOptions();

            event = $.Event(PBSLM.School.SCHOOL_RESPONSE_READY);
            event.schoolsAsOptions = this.schoolsAsOptions;
            $(window).trigger(event);

            return this;
        },
        buildSchoolsAsOptions: function () {
            var i, rawHtml = '';

            if (!this.currentResponse.schools ||
                    this.currentResponse.schools.length === 0) {

                this.throwSchoolParseError();

                throw ('Error [PBSLM.School buildschoolsAsOptions] ' +
                    'No parsable school data in currentResponse.');
            }

            for (i = 0; i < this.currentResponse.schools.length; i += 1) {
                // until we upgrade jQuery, just cancat a long string for $()
                rawHtml += '<option value="' +
                    this.currentResponse.schools[i].id + '">' +
                    this.currentResponse.schools[i].name + '</option>';
            }

            if (!rawHtml) {

                this.throwSchoolParseError();

                throw ('Error [PBSLM.School buildschoolsAsOptions] ' +
                    'Unable to build schools <option> list.');
            }

            this.schoolsAsOptions = $(rawHtml);

            return this.schoolsAsOptions;
        },
        throwSchoolParseError: function () {
            var event;

            event = $.Event(PBSLM.School.SCHOOL_PARSE_ERROR);
            event.schoolsAsOptions = this.schoolsAsOptions;
            event.currentResponse = this.currentResponse;
            $(window).trigger(event);
        }
    };
}(jQuery, PBSLM.Logger));