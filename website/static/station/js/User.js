/*jslint browser: true, devel: false, nomen: true */
/*global PBSLM, jQuery */

/*
    NOTE: This file contains several modules in an effort to provide a level of
    concatenation. These modules are currently exclusive to the user profile
    edit page. Remember that since these are not asynchronous, we need to make
    sure that everything is defined in order of dependency.
*/

//------------------------------------------------------------------------------
// User

/*
    Intended to act as a Singleton although it's currently not enforcing a
    single instance of itself. It's instantiated on the user profile edit
    screen and is passed in a JSON object rendered in a HTML template. If we
    reach a point where other areas of the site need to get info about the
    currently logged in user, we'll expand on this.
*/

(function (Logger) {
    'use strict';

    window.PBSLM = window.PBSLM || {};

    PBSLM.User = function (data) {
        this.profileData = data;
        this.accountData = {}; // TK from PBS Account
        this.logger = new Logger();

        this.init();

        return this;
    };

    PBSLM.User.prototype = {
        constructor: PBSLM.User,

        init: function () {
            this.logger.log('[PBSLM.User init] profile data: %o',
                this.profileData);

            return this;
        }

    };

}(PBSLM.Logger));


//------------------------------------------------------------------------------
// Suggested School

/*
    This is based off of a quick-fix backend model change to accommodate the
    suggest a school feature. It's only used on the user profile screen so
    leaving it grouped with those modules (instead of School.js).
*/

(function ($) {
    'use strict';

    window.PBSLM = window.PBSLM || {};

    PBSLM.SuggestedSchool = function (user) {
        this.user = user;
        this.$suggestedSchoolInput = $('#id_school_suggested');
        this.$schoolDropDown = $('#id_user_school');
        this.$suggestedOption = $('<option value="" data-suggested="true">')
                .text(this.$suggestedSchoolInput.val().toUpperCase() +
                    ' (suggested)');
        this.init();

        return this;
    };

    // add static directly to parent
    PBSLM.SuggestedSchool.SUGGESTION_POSTED = 'suggestionPosted';

    PBSLM.SuggestedSchool.prototype = {
        constructor: PBSLM.SuggestedSchool,

        init: function () {
            // Clean out any exiting suggestions.
            $('option[data-suggested="true"]').remove();

            // If there's a value in school_suggested and the user doesn't have
            // a school selected in his profile data, make the suggested school
            // the current selection. Note: It's value is still null, it's just
            // a superficial selection for the end user.
            if (!this.user.profileData.user_school) {
                this.$suggestedOption.attr('selected', 'selected');
            }

            this.$schoolDropDown
                .prepend(this.$suggestedOption)
                .find('option').tsort();

            this.initClear();
        },
        initClear: function () {
            // Displays a 'clear' link that users can use to clear out a
            // suggested school next to the school drop down.

            this.toggleClear();
            this.bindEvents();
        },
        toggleClear: function () {
            var $selectedOption = $('#id_user_school').find('option:selected');
            // be sure to convert falsey types to boolean for toggle()
            $('#clear-suggested').toggle(!!$selectedOption.data('suggested'));
        },
        clearSuggested: function () {
            $('option[data-suggested="true"]').remove();
            $('#id_school_suggested').val('');
            $(this).hide();
        },
        bindEvents: function () {
            var boundClearSuggested = this.clearSuggested.bind(this),
                boundToggleClear = this.toggleClear.bind(this);

            $('#clear-suggested')
                .on('click', function (event) {
                    event.preventDefault();
                    boundClearSuggested();
                });
            // only show #clear-suggested when a suggested school is selected
            $('#id_user_school')
                .on('change', function () {
                    boundToggleClear();
                });
        }
    };

}(jQuery));


//------------------------------------------------------------------------------
// UserProfile

(function ($, Logger, FormUtils, School, SuggestedSchool) {
    'use strict';

    window.PBSLM = window.PBSLM || {};

    PBSLM.UserProfile = function (user, el, data) {
        // can we set the educator fields in the model? -mld
        this.EDUCATOR_FIELDS = [
            '#preferred-subjects-cntr',
            '#grade-range-cntr'
        ];

        this.user = user;
        this.$el = $(el);
        this.formData = data;
        this.$defaultOption = $('<option value="">-----</option>');
        this.educatorRoles = this.formData.educator_roles;
        this.$suggestedSchoolInput = $('#id_school_suggested');
        this.logger = new Logger();
        this.school = new School();

        // form fields
        this.userRole = this.$el.find('#id_user_role');

        this.init();

        return this;
    };

    PBSLM.UserProfile.prototype = {
        constructor: PBSLM.UserProfile,

        init: function () {
            this.logger.log('[PBSLM.UserProfile init] form data: %o',
                this.formData);
            this.displayEducator();
            this.school.fetchSchool({
                postal_code: $('#id_postal_code').val()
            });
            this.bindEvents();
            this.modifyFormDOM();
        },
        displayEducator: function (method) {
            this.toggleFields(this.EDUCATOR_FIELDS.toString(),
                this.isEducator(), method);
        },
        isEducator: function () {
            // make Array.indexOf() 1-based and cast as boolean
            return !!(this.educatorRoles.indexOf(this.userRole.val()) + 1);
        },
        getSchoolOptions: function (postalCode) {
            /**
             * If the postalCode value length is 5 get the new list of schools
             * else update the scroll dropdown with an empty array to clear
             * the last values and set the zip code text to invalid zip code
             */
            if (postalCode.length === 5) {
                this.school.fetchSchool({
                    postal_code: postalCode
                });
            } else {
                this.updateSchoolDropDown([]);
            }
        },
        updateSchoolDropDown: function (options) {
            var $status = $('#postal-code-ajax-stat'),
                postalCode = $('#id_postal_code').val(),
                // if no options passed, use the list stored in the instance
                // of PBSLM.School.
                schoolAsOptions = options || this.school.schoolsAsOptions,
                $select = FormUtils.convertToSelect('#id_user_school')
                    .append(this.$defaultOption)
                    .append(schoolAsOptions);

            // If the profile data has a selected school, mark it selected. The
            // data may or may not exist on the PBSLM.User.profileData object
            // so using a try...catch.
            try {
                $select.find('option[value="' +
                    this.user.profileData.user_school.id + '"]')
                    .attr('selected', 'selected');

            } catch (e) {
                this.logger.log('[PBSLM.UserProfile setSchoolDropDown] ' +
                    'User profile data has no selected school.');
            } finally {
                if (postalCode.length === 5) {
                    $status.html(schoolAsOptions.length + ' Schools Found');
                } else {
                    $status.html('Invalid ZIP Code');
                }

                // If there's a value in suggested school, add it. Whether or
                // not it's selected is determined by the module itself.
                if (this.$suggestedSchoolInput.val()) {
                    this.suggestedSchool = new SuggestedSchool(this.user);
                }
            }
        },
        toggleFields: function (selector, status, method) {
            // Be sure to pass in the fields' container and not just the field

            switch (method) {
            case 'fade':
                if (status) {
                    $(selector).fadeIn(status);
                } else {
                    $(selector).fadeOut(status);
                }
                break;
            case 'slide':
                if (status) {
                    $(selector).slideDown(status);
                } else {
                    $(selector).slideUp(status);
                }
                break;
            default:
                // unlike the previous two cases, plain ol' toggle acts
                // appropriately on a boolean arg.
                $(selector).toggle(status);
                break;
            }

            return this;
        },
        displaySchoolStat: function () {
            // A little something extra to let the user know that their zip
            // code entry is actually doing something.
            var postalCode = $('#id_postal_code').val(),
                $status = $('#postal-code-ajax-stat');

            if ($status.css('top') !== 0) {
                $status.animate({
                    opacity: 1,
                    top: 0
                }, 'fast');
            } else if ($status.css('top') !== $status.height() + 5) {
                $status.animate({
                    opacity: 0,
                    top: $status.height() + 5
                }, 'fast');
            }
        },
        bindEvents: function () {
            // bind this to our methods here
            var boundDisplayEducator = this.displayEducator.bind(this),
                boundGetSchoolOptions = this.getSchoolOptions.bind(this),
                boundDisplaySchoolStat = this.displaySchoolStat.bind(this),
                boundUpdateSchoolDropDown =
                    this.updateSchoolDropDown.bind(this);

            $('#id_user_role')
                .on('change', function () {
                    boundDisplayEducator('slide');
                });
            $('#id_postal_code')
                .on('keyup', function (event) {
                    // don't bother on these keys
                    switch (event.keyCode) {
                    case 9: // tab
                    case 16: // shift
                    case 17: // ctrl
                    case 18: // alt
                    case 27: // esc
                    case 37: // left arrow
                    case 38: // up arrow
                    case 39: // right arrow
                    case 40: // down arrow
                    case 91: // left window/command
                    case 93: // right window/command
                        break;

                    default:
                        boundGetSchoolOptions($(this).val());
                        boundDisplaySchoolStat();
                        break;
                    }
                })
                .on('change', function () {
                    boundGetSchoolOptions($(this).val());
                    boundDisplaySchoolStat();
                });
            $(window)
                .on(School.SCHOOL_RESPONSE_READY, function (event) {
                    boundUpdateSchoolDropDown(event.schoolsAsOptions);
                })
                .on(School.SCHOOL_PARSE_ERROR, function () {
                    boundUpdateSchoolDropDown([]);
                })
                .on(PBSLM.SuggestedSchool.SUGGESTION_POSTED, function () {
                    // pass null to use the current stored list in the instance
                    // of PBSLM.School
                    boundUpdateSchoolDropDown(null);
                });
            $(document).ready(this.displaySchoolStat);
        },
        modifyFormDOM: function () {
            // Post-render layout mods.
            // I really don't like having to do this, but there isn't enough
            // time to sort through the Django particulars regarding how it
            // renders form elements. -mld
            $('#postal-code-cntr > label').append(
                $('<span class="label-stat" id="postal-code-ajax-stat" />')
            );
            $('#postal-code-cntr')
                .appendTo('#personal-information');
            $('#school-suggest-link').appendTo('label[for="id_user_school"]');
            $('#user-school-cntr')
                .prependTo('#professional-information .content');
        }
    };

}(jQuery, PBSLM.Logger, PBSLM.FormUtils, PBSLM.School, PBSLM.SuggestedSchool));
// ^ This also uses jquery.tinysort, but since it's added to the jQuery
// namespace, I don't think we want to list it here, but that *may* not jive
// well with an AMD-based module loader. Just something to remember if we
// go down that road.
