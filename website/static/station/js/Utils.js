/*jslint browser: true, devel: false, nomen: true, todo: true */
/*global PBSLM, jQuery, _ */

/*

    TODO: move Utils methods off of prototype and assign to Utils object
    directly so they can be referenced statically.

    Contains separate modules for general Utils and form-specific FormUtils

*/

//------------------------------------------------------------------------------
// Utils

(function ($) {
    "use strict";

    // Make sure we always add to PBSLM space and never directly to global.
    // Also make sure not to overwrite the namespacer if it already exists.
    window.PBSLM = window.PBSLM || {};

    PBSLM.Utils = function () {
        // Static, no inititialize needed.
    };

    // Add static members directly to Utils
    PBSLM.Utils.updateImagePathsForDev = function (selector) {
        // Brute-force S3 images into your page. Make sure to wrap this
        // function's call in a conditional to make sure it doesn't get
        // called on qa & prod.
        if (PBSLM.settings.DEBUG === true) {
            var re = new RegExp('http://.+?/'),
                NEW_DOMAIN = 'http://d43fweuh3sg51.cloudfront.net/',
                $imgs = $(selector);

            $imgs.each(function () {
                this.src = this.src.replace(re, NEW_DOMAIN);
            });
        }
    };

    // Add instance members to prototype
    PBSLM.Utils.prototype = {
        extractData: function (el, key) {
            // Given a jQuery selector (el) and a data-attribute (key),
            // returns an array of its values for each element selected.
            var arr, $el;

            $el = $(el);
            arr = [];

            $el.each(function () {
                arr.push($(this).data(key));
            });

            return arr.sort();
        },
        extractObjects: function (el, keys) {
            // Given a jQuery selector (el) and data-attributes (keys),
            // returns an array of objects with those keys.
            var arr, $el, i, obj;

            $el = $(el);
            arr = [];

            $el.each(function () {
                obj = {};

                for (i = 0; i < keys.length; i += 1) {
                    obj[keys[i]] = $(this).data(keys[i]);
                }
                arr.push(obj);
            });

            return arr;
        }
    };

}(jQuery));

//------------------------------------------------------------------------------
// Utils

(function () {
    "use strict";

    window.PBSLM = window.PBSLM || {};

    PBSLM.FormUtils = function () {
        // Static, no inititialize needed.
    };

    PBSLM.FormUtils.convertToSelect = function (selector) {
        var $select, $el = $(selector);

        if (!$el.attr('name') || !$el.attr('id')) {
            throw ('Error [PBSLM.FormUtils convertToSelect]' +
                'Selected element must have a name & id attribute.');
        }

        $select = $('<select name="' + $el.attr('name') + '" id="' +
            $el.attr('id') + '" />');

        $el.replaceWith($select);

        return $select;
    };

}());
