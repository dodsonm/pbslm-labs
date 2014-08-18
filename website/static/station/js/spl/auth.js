/*
 Authentication and other things related to a users logged in status/state
 are kept here.

 Dependent on jQuery being loaded first.
 */
var Global = this;

function AuthManager() {
    /**
     class AuthManager:

     AuthManager = authentication manager.
     AuthManager.status Will have one of two values:

     auth_user -> user is a regular user and is logged in

     auth_unknown -> user hasn't signed in yet

     */
}

AuthManager.AUTH_UNKNOWN = 'auth_unknown';
AuthManager.AUTH_USER = 'auth_user';
AuthManager.status = AuthManager.AUTH_UNKNOWN;
AuthManager.user = null;
AuthManager.initialized = false;
AuthManager.init = function() {
    AuthManager.user = PBSLM.User.getInfo();
    if (AuthManager.user.is_authenticated) {
        AuthManager.status = AuthManager.AUTH_USER;
    }
    AuthManager.initialized = true;
    return false;
};

$(document).ready(function() {
    AuthManager.init();
});

(function(window, $) {
    if (window.PBSLM == undefined) {
        PBSLM = {};
    }

    PBSLM.User = (function() {
        var userData = null;

        function doCall() {
            $.ajax({
                url : '/get_user_data/',
                cache : false,
                async : false,
                success : function(data) {
                    userData = data;
                }
            });
        }

        return {
            getInfo : function() {
                if (!userData) {
                    doCall();
                }

                return userData;
            }
        }
    })();
})(window, jQuery);
