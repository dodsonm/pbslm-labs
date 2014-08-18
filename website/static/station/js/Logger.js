/*jslint browser: true, devel: false, nomen: true */
/*global PBSLM, $, console */

/*
    Use this module instead of console.log directly. This will allow us to use
    log statements in our scripts without worrying about removing them for
    production.

    Example usage (oututs an inspectable copy the PBSLM object to the console):

    var logger = new PBSLM.Logger();
    logger.log('Explore PBSLM: %o', PBSLM);
*/

// IDEA: maybe implement a DEBUG control that can be tied to a server-side conf
// which would supress writing anything to the console.

(function () {
    'use strict';

    window.PBSLM = window.PBSLM || {};

    PBSLM.Logger = function () {
        return this;
    };

    PBSLM.Logger.prototype = {
        constructor: PBSLM.Logger,

        log: function () {
            // Don't decalre any params. Use the 'arguments' keyword to pass
            // args into the console.log method.

            window.console = window.console || {
                log: function () {
                    // Empty function just so non-console browsers have
                    // something to chew on.
                }
            };

            if (PBSLM) {
                console.log.apply(console, arguments);
            }

            return this;
        }

    };

}());
