/**
 * Dependencies
 */


function random_string(ln) {
    var chars = Array("a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z");
    var ret_str = '';
    for (var i = 0; i <= ln; i++) {
        ret_str += chars[Math.floor(Math.random() * 52)];
    }
    return ret_str;
}

function isJavaWebStart(file) {
    if (file.indexOf('.jnlp') != -1 || file.indexOf('.JNLP') != -1) {
        return true;
    } else {
        return false;
    }
}

/**
 feature_settings:
 object literal to store feature params to window.open.
 */
feature_settings = {};
feature_settings.DEFAULT = {
    'stat' : 'no',
    're_size' : 'yes',
    'scroll' : 'yes',
    'tools' : 'no',
    'locvar' : 'no'
};

feature_settings.get = function(type, feature) {
    if (this[type] && this[type][feature]) {
        return this[type][feature];
    } else if (this.DEFAULT[feature]) {
        return (this.DEFAULT[feature]);
    } else {
        throw new Error("Unsupported feature: " + feature);
    }
};
feature_settings['user_url'] = {
    'tools' : 'yes',
    'locvar' : 'yes',
    'stat' : 'yes'
};
feature_settings['interactive'] = {
    'stat' : 'yes',
    'tools' : 'yes'
};
feature_settings['document'] = {
    'stat' : 'yes',
    'tools' : 'yes'
};
feature_settings['help'] = {
    'stat' : 'yes'
};
feature_settings['contact'] = {
    'stat' : 'yes'
};
feature_settings['spl_data'] = {
    'stat' : 'yes',
    'tools' : 'yes',
    'locvar' : 'yes'
};

/**
 pop_dimensions:

 Object literal to store pop-type specific widths and heights.
 */
var pop_dimensions = {};
pop_dimensions.get = function(type, w, h) {
    if ((w && w == 'None') || w == 0) {
        w = '';
    }
    if ((h && h == 'None') || h == 0) {
        h = '';
    }

    var type_dims = this.DEFAULT;
    for (var prop in this) {
        if (prop == type) {
            type_dims = this[type];
            break;
        }
    }
    var width = type_dims[0];
    var height = type_dims[1];
    if (w) {
        width = w;
    }
    if (h) {
        height = h;
    }
    return [width, height];

};

pop_dimensions['DEFAULT'] = [660, 456];
pop_dimensions['audio'] = [425, 296];
pop_dimensions['document'] = [660, 450];
pop_dimensions['image'] = [660, 456];
pop_dimensions['interactive'] = [700, 510];
pop_dimensions['video'] = [425, 484];
pop_dimensions['help'] = [750, 450];
pop_dimensions['contact'] = [720, 450];
pop_dimensions['confirmation'] = [250, 100];
pop_dimensions['compare'] = [550, 350];
pop_dimensions['essay'] = pop_dimensions['compare'];

function td_pop(type, loc, w, h) {
    var window_name = type + random_string(4);
    //JNLP files don't pop-up, they get downloaded:
    if (isJavaWebStart(loc)) {
        //this should cause the browser to
        //download the jnlp instead of creating an empty window:
        document.location = loc;
        return;
    }
    //set some default window properties:
    var stat = feature_settings.get(type, 'stat');
    var re_size = feature_settings.get(type, 're_size');
    var scroll = feature_settings.get(type, 'scroll');
    var tools = feature_settings.get(type, 'tools');
    var locvar = feature_settings.get(type, 'locvar');
    var pop_dims = pop_dimensions.get(type, w, h);
    var ewindow = window.open(loc, window_name, 'width=' + pop_dims[0] + ',height=' + pop_dims[1] + ',toolbar=' + tools + ',status=' + stat + ',scrollbars=' + scroll + ',resizable=' + re_size + ',location=' + locvar);
    ewindow.focus();
}

/*
 Determine if something is in an array:
 */
function in_array(item, list) {
    var rval = false;
    for (var i = 0; i < list.length; i++) {
        if (list[i] == item) {
            rval = true;
            break;
        }
    }
    return rval;
}
if (!(window.console && console.log)) {
  (function() {
    var noop = function() {};
    var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
    var length = methods.length;
    var console = window.console = {};
    while (length--) {
        console[methods[length]] = noop;
    }
  }());
}
var Logger = console;

var SPLManager = $.extend(SPLManager,{
    init : function() {
        /**
         Initialize the self-paced lesson:
         */
        this.set_usage_mode();
        //Set the title:
        $('#spl_title').html(this.resource_title);
        $('.spl_title_intro').html(this.resource_title);

        //See what the auth status is for the viewing user:
        if (this.usage_mode == 'active') {
            this.get_user_data();
        } else {
            this.set_first_screen_options();
            this.process_activities();
        }
        //See if we need to hide the 'For Teachers' tab:
        if (AuthManager.user && AuthManager.user.user_type && AuthManager.user.user_type == 'student') {
            $('.tab_type_for_teachers').hide();
        }

        //define a parent reference for 'this' disambaguity in nested anonymous functions:
        var parent = this;
        //Assign the bottom nav click handlers:
        $('.spl_nav_link').click(function() {
            var sec_id_str = $(this).attr('id');
            var sec_id = parent.id_from_string(sec_id_str);
            parent.show_section(sec_id);
        });

        //Assign the 'credits' nav click handler:
        $('#spl_credits_trigger').click(function() {
            if ($(this).html() == 'credits') {
                $(this).html("back to lesson");
                parent.show_section('credits');
            } else {
                $(this).html("credits");
                parent.show_section(parent.credits_back_section_number);
            }

        });

        //Assign the bottom nav hover handlers:
        $('.spl_nav_link').hover(function() {
            //OVER:
            var sec_id_str = $(this).attr('id');
            var sec_id = parent.id_from_string(sec_id_str);
            var sec_title = $('#sec_title_' + sec_id).html();
            $('#section_title_roll').html(sec_title);
        }, function() {
            //OUT:
            $('#section_title_roll').html("");
        });
        //Set up the Next/Previous graphic links:
        $('#spl_next_link').hover(function() {
            $('#spl_next_img').hide();
            $('#spl_next_img_hover').show();
        }, function() {
            $('#spl_next_img_hover').hide();
            $('#spl_next_img').show();
        });
        $('#spl_back_link').hover(function() {
            $('#spl_back_img').hide();
            $('#spl_back_img_hover').show();
        }, function() {
            $('#spl_back_img_hover').hide();
            $('#spl_back_img').show();
        });
        //Click handlers for 'Back/Next' links:
        $('#spl_back_link').click(function() {
            parent.previous_section();
        });
        $('#spl_next_link').click(function() {
            parent.next_section();
        });

        this.show_section(1);
        $('#spl_review_my_work').click(function() {
            parent.review_work();
        });
    },
    is_preview : function() {
        /**
         Return a boolean indicating whether the SPL is being taken in 'cms_preview' or 'preview' usage mode
         */
        var rval = false;
        if (this.usage_mode && (this.usage_mode == 'preview' || this.usage_mode == 'cms_preview')) {
            rval = true;
        }
        return rval;
    },
    set_usage_mode : function(mode) {
        /**
         Determine the usage mode for the SPL, and make changes as necessary. If 'mode' argument
         isn't passed in, we'll determine mode from current AuthManager state.

         Possible values:
         'not_signed_in': user is not signed in

         'active': user is signed in and wants to do the SPL, saving data along the way

         'cms_preview': CMS user

         'preview': user is signed in and wants to do the SPL but not save data

         */
        if (!mode) {
            if (AuthManager.status == AuthManager.AUTH_USER) {
                mode = 'active';
            } else if (AuthManager.status == AuthManager.AUTH_PREVIEW) {
                mode = 'cms_preview';
            } else {
                mode = 'not_signed_in';
            }
        }
        //see if we have to clean up when switching from one usage_mode to another:
        //Really should only be able to switch from 'active' to 'preview' and 'preview' to 'active':
        if (this.usage_mode && this.usage_mode == 'preview') {
            this.completed_work = [];
            this.preview_completed_data = [];
        }

        this.usage_mode = mode;
    },
    set_first_screen_options : function() {
        /**
         The first screen will have different content based on usage_mode.
         */
        var spl_reset_html = '';
        if (this.usage_mode == 'active') {
            if (this.completed_work.length > 0) {
                var spl_loader_img_url = SPL_STATIC_URL + 'images/loader.gif';
                spl_reset_html += "<p>You have saved work. To continue, use the page links below to find where left off. If you'd rather not keep the work you've done so far, you may <a href='javascript:void(0)' onclick='SPLManager.show_reset_ui();return false;'><b>start over</b></a>.</p>";
                spl_reset_html += "<div id='reset_ui' style='display:none'><p><strong>Your previously saved work will no longer be available to you!</strong></p>";
                spl_reset_html += "<div><a class='button_1' href='javascript:void(0)' onclick='SPLManager.reset(); return false;'>YES, START OVER</a> <img src='" + spl_loader_img_url + "' alt='Loading Content' class='loader' style='display:none' id='spl_reset_loader' /><a class='button_1' href='javascript:void(0)' onclick='SPLManager.cancel_reset();return false;'>CANCEL</a></div></div>";
            } else {
                spl_reset_html += "<p><strong>Use the navigation controls below to take this lesson.</strong><br />If you would rather not save your work as you go through this activity, you may <a href='javascript:void(0)' onclick='SPLManager.do_preview();return false;'><b>preview this lesson</b></a>.</p>";
            }
        } else if (this.usage_mode == 'preview') {
            spl_reset_html = "<p><strong>You are now previewing this lesson.</strong><br />Any work you do in this lesson will not be saved. If you would like to save your work, you can <a href='javascript:void(0)' onclick='SPLManager.end_preview();return false;'><b>end this preview</b></a>.</p>";
        } else if (this.usage_mode == 'cms_preview') {
            spl_reset_html = '<p><b>CMS PREVIEW MODE</b></p>';
        } else {
            spl_reset_html += "<p>You must be signed in to save and submit your answers in this activity.</p><div><a class='button_1' href='javascript:void(0)' onclick='SPLManager.close_spl();return false;'>SIGN IN</a></div>";
        }
        $('#spl_reset').html(spl_reset_html);
        $('#spl_reset').show();
    },
    do_preview : function() {
        this.set_usage_mode('preview');
        this.set_first_screen_options();
        this.process_activities();
    },
    end_preview : function() {
        this.set_usage_mode('active');
        this.set_first_screen_options();
        this.process_activities();
    },
    cancel_reset : function() {
        /**
         Hide reset UI.
         */
        $('#reset_ui').hide();
        $('#spl_reset_loader').hide();
    },
    show_reset_ui : function() {
        /**
         Show the reset UI.
         */
        $('#reset_ui').show();
        $('#spl_reset_loader').hide();
    },
    reset : function() {
        /**
         Reset an assignment for a user.
         */
        $('#spl_reset_loader').show();
        $.ajax({
            url : this.reset_assignment_url,
            dataType : 'json',
            data : {
                resource_code : this.resource_code
            },
            type : 'POST',
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                SPLManager.reset_fail(XMLHttpRequest, textStatus, errorThrown)
            },
            success : function(data, textStatus, XMLHttpRequest) {
                SPLManager.reset_success(data, textStatus, XMLHttpRequest)
            }
        });
    },
    reset_fail : function(XMLHttpRequest, textStatus, errorThrown) {
        $('#spl_reset_loader').hide();
        $('#spl_reset').html("<p class='alert'>There was a server error. Please try again later.</p>");
        $('#spl_reset').show();
    },
    reset_success : function(data, textStatus, XMLHttpRequest) {
        $('#spl_reset_loader').hide();
        if (data['error']) {
            $('#spl_reset').html("<p class='alert'>" + data['error'] + "</p>");
            $('#spl_reset').show();
        } else {
            this.completed_work = [];
            this.set_first_screen_options();
            this.process_activities();
        }
        this.show_review_link();
    },
    close_spl : function() {
        /**
         Close the self paced lesson. Triggered off of the 'Sign in' button for non-logged in users.
         */
        SPLOverlay.hide();
    },
    get_user_data : function() {
        /**
         AJAX call to get user data. Will call 'process_activities' when complete:
         */
        if (AuthManager.status == AuthManager.AUTH_USER) {
            Logger.log("Getting user data");
            $.ajax({
                url : this.assignment_data_url,
                dataType : 'json',
                data : {
                    resource_code : this.resource_code
                },
                type : 'POST',
                error : function(XMLHttpRequest, textStatus, errorThrown) {
                    SPLManager.get_user_data_fail(XMLHttpRequest, textStatus, errorThrown)
                },
                success : function(data, textStatus, XMLHttpRequest) {
                    SPLManager.get_user_data_success(data, textStatus, XMLHttpRequest)
                }
            });
        }
    },
    get_user_data_success : function(data, textStatus, XMLHttpRequest) {
        /**
         Save user data retrieval and call next action.
         */
        if (data['error']) {
            $('#spl_reset').html("<p class='alert'>Error loading your saved data: " + data['error'] + "</p>");
            $('#spl_reset').show();
        } else if (data['assignment'] && data['assignment']['assignment_data']) {
            for (var i = 0; i < data['assignment']['assignment_data'].length; i++) {
                var adata = data['assignment']['assignment_data'][i];
                this.completed_work.push(adata['uid']);
            }
            this.process_activities();
        } else {
            this.process_activities();
        }
        if (data['assignment'] && data['assignment']['assignment_id']) {
            this.assignment_id = data['assignment']['assignment_id'];
        }
        this.set_first_screen_options();
        this.show_review_link();
    },
    show_review_link : function() {
        /**
         Determine if it's appropriate to show the 'Review My Work' global link, and if so, do it.
         */
        if (this.completed_work.length > 0) {
            $('#spl_review_link').show();
        } else {
            $('#spl_review_link').hide();
        }
    },
    get_adtype : function(uid) {
        /**
         Derive a assignment data type from the uid.

         NOTE: this is highly coupled to the AssignmentData model.
         */
        var uid_bits = uid.split('-');
        return uid_bits[0];
    },
    get_user_data_fail : function(XMLHttpRequest, textStatus, errorThrown) {
        /**
         Deal with errors related to 500 errors:
         */
        $('#spl_reset').html("<p class='alert'>Error. Could not retrieve your saved data. Please try again later.</p>");
        $('#spl_reset').show();
    },
    process_activities : function() {
        /**
         Display activity related triggers in the regular SPL content (i.e. triggers for activities, embedded activity types,
         or messaging related to completed work).
         */
        for (var i = 0; i < this.activity_data.length; i++) {
            this.process_activity(this.activity_data[i]['id']);
        }
    },
    process_activity : function(uid) {
        /**
         Either show an activity trigger or data about the status of that activity (i.e. "you've already done this activity")
         */
        var act_data = null;
        for (var i = 0; i < this.activity_data.length; i++) {
            if (this.activity_data[i]['id'] == uid) {
                act_data = this.activity_data[i];
                break;
            }
        }
        if (!act_data) {
            Logger.log("No data for uid: " + uid);
            return;
        }
        if (this.usage_mode != 'not_signed_in') {
            if (in_array(act_data['id'], this.completed_work)) {
                //Activity has been completed:
                //Figure out what wording to use.
                var wording = '<p class="spl_done_callout">';
                if (act_data['activity_type'] == 'quiz') {
                    wording += "You have answered the multiple-choice questions.";
                } else if (act_data['activity_type'] == 'notes') {
                    wording += "You have submitted these notes.";
                } else {
                    wording += "You have done this activity.";
                }
                if (this.is_preview()) {
                    //preview mode will get the uid so we can display just that content during previews:
                    wording += "<br />You may <a href='javascript:void(0)' onclick='SPLManager.review_work(\"" + act_data['id'] + "\");return false;'><b>review your work</b></a>.";
                } else {
                    wording += "<br />You may <a href='javascript:void(0)' onclick='SPLManager.review_work();return false;'><b>review your work</b></a>.";
                }
                wording += "</p>";
                if (act_data['activity_type'] == 'quiz' || act_data['activity_type'] == 'notes') {
                    //The target div for swfobject gets removed from the DOM, so for embedded activities, we will
                    //inject into a container div (*-cont):
                    $('#' + act_data['id'] + '-cont').html(wording);
                } else {
                    $('#' + act_data['id']).html(wording);
                }
            } else {
                //Activity not done yet:
                if (act_data['activity_type'] == 'quiz' || act_data['activity_type'] == 'notes') {
                    //Display activity:
                    var params = {};
                    params.allowscriptaccess = 'always';

                    var flashvars = {};
                    flashvars.xmlURL = SPL_STATIC_URL + "spl_support/" + this.resource_code + "/" + act_data['xml_file'];
                    flashvars.uid = act_data['id'];
                    var swf_name = null;
                    var swf_width = null;
                    var swf_height = null;
                    if (act_data['activity_type'] == 'quiz') {
                        swf_name = 'quiz.swf';
                        swf_width = "450";
                        swf_height = "300";
                    } else {
                        swf_name = 'notes.swf';
                        swf_width = "370";
                        swf_height = "160";
                    }
                    var swf_loc = SPL_STATIC_URL + "fludata/" + swf_name;
                    //If a quiz or notes has already been added to the dom, then removed (post completion), and then the assignment
                    //is reset, the target div id will be missing. So, we'll need to add it back in:
                    if ($('#' + act_data['id']).length == 0) {
                        //pop an empty div in for swfobject to inject the swf into:
                        $('#' + act_data['id'] + '-cont').html('<div id="' + act_data['id'] + '"></div>');
                    }
                    var parent_node = $('#' + act_data['id']).parent();
                    swfobject.embedSWF(swf_loc, act_data['id'], swf_width, swf_height, "9.0.0", "expressInstall.swf", flashvars, params, {});
                } else {
                    /**
                     Generate the trigger for this activity:
                     */
                    var large_tmpl = '<div class="view_container">IMG<div class="trigger_2_col_container"><div class="trigger_2_col_left" style="width:60px"><button id="UID" class="button_4">VIEW</button></div><div class="trigger_2_col_right" style="width:187px"><h3>ACT_TITLE</h3><p>Interactive</p></div></div></div>';
                    var medium_tmpl = '<div class="trigger_2_col_container view_container"><div class="trigger_2_col_left" style="width:107px">IMG</div><div class="trigger_2_col_right" style="width:140px"><h3>ACT_TITLE</h3><p>Interactive</p><button id="UID" class="button_4">VIEW</button></div></div>';
                    var small_tmpl = '<div class="trigger_2_col_container view_container"><div class="trigger_2_col_left" style="width:40px">IMG</div><div class="trigger_2_col_right" style="width:207px"><h3>ACT_TITLE</h3><p>Interactive</p><button id="UID" class="button_4">VIEW</button></div></div>';
                    var none_tmpl = '<div class="trigger_2_col_container view_container"><div class="trigger_2_col_left" style="width:60px"><button id="UID" class="button_4">VIEW</button></div><div class="trigger_2_col_right" style="width:187px"><h3>ACT_TITLE</h3><p>Interactive</p></div></div>';

                    var icon_size = act_data['icon_size'];
                    var icon_image = '';
                    if (icon_size != 'none') {
                        var img_src = SPL_STATIC_URL + "images/udata_icons/" + act_data['activity_type'] + "_" + act_data['icon_size'] + ".gif";
                        var alt_text_bits = act_data['activity_type'].split('_');
                        var alt_text = alt_text_bits.join(' ');
                        icon_image = "<img class='spl_act_icon' src='" + img_src + "' alt='" + alt_text + "' />";
                    }
                    var tmpl = null;
                    if (icon_size == 'large') {
                        tmpl = large_tmpl;
                    } else if (icon_size == 'medium') {
                        tmpl = medium_tmpl;
                    } else if (icon_size == 'small') {
                        tmpl = small_tmpl;
                    } else {
                        tmpl = none_tmpl;
                    }
                    var trigger_id_root = 'trigger_';
                    var trigger_id = trigger_id_root + act_data['id'];
                    tmpl = tmpl.replace('IMG', icon_image);
                    tmpl = tmpl.replace('ACT_TITLE', this.act_type_title_map[act_data['activity_type']]);
                    tmpl = tmpl.replace('UID', trigger_id)

                    $('#' + act_data['id']).html(tmpl);
                    var parent = this;
                    var trigger_id_root = 'trigger_';
                    /**
                     Set the call for when the trigger is clicked:
                     */
                    $('#' + trigger_id).click(function(e) {
                        var trigger_id = $(this).attr('id');
                        parent.show_activity(trigger_id.replace(trigger_id_root, ''));
                    });
                }
            }
        } else {
            //NOT LOGGED IN:
            var act_callout = null;
            if (act_data['activity_type'] == 'notes') {
                act_callout = ' add and save notes.';
            } else if (act_data['activity_type'] == 'quiz') {
                act_callout = ' take this quiz.';
            } else {
                act_callout = ' do this activity.';
            }
            var content = '<div style="text-align:left"><p class="alert"><b>You must be signed in to ' + act_callout + '</b></p>';
            content += '<div><a class="button_1" href="javascript:void(0)" onclick="SPLManager.close_spl(); return false;">SIGN IN</a></div></div>'
            $('#' + act_data['id']).html(content);
        }

    },
    show_activity : function(uid) {
        /**
         Display an activity in a pop-up style window. If the activity is already done, show some
         text to that effect.
         */
        var act_id = 'spl_activity_content';
        $('#spl_act_pop').html("<div id='" + act_id + "'></div>");
        var act_data = null;
        for (var i = 0; i < this.activity_data.length; i++) {
            act_data = this.activity_data[i];
            if (act_data['id'] == uid) {
                break;
            }
        }
        if (act_data && in_array(act_data['activity_type'], this.pop_up_activity_types)) {

            var params = {};
            params.allowscriptaccess = 'always';

            var flashvars = {};
            flashvars.xmlURL = SPL_STATIC_URL + "spl_support/" + this.resource_code + "/" + act_data['xml_file'];
            flashvars.uid = act_data['id'];
            var act_loc = SPL_STATIC_URL + "fludata/" + act_data['activity_type'] + ".swf";
            if (act_data['activity_type'] == 'arrange_it') {
                flashvars.imageURL = SPL_STATIC_URL + "spl_support/" + this.resource_code + "/" + act_data['image_file'];
            } else if (act_data['activity_type'] == 'highlight_it') {
                flashvars.swfURL = SPL_STATIC_URL + "spl_support/" + this.resource_code + "/" + act_data['swf_file'];
            }

            swfobject.embedSWF(act_loc, act_id, "800", "600", "9.0.0", "expressInstall.swf", flashvars, params, {});
        } else {

            Logger.log("Problem with activity: " + act_data['id']);
        }
        $('#spl_top_banner').hide();
        $('#spl_content_container').hide();
        $('#spl_bottom_nav').hide();
        $('#spl_act_pop').show();
    },
    close_activity_window : function(uid) {
        /**
         Close activity window. Also, update content display triggers.
         */
        $('#spl_act_pop').hide();
        $('#spl_top_banner').show();
        $('#spl_content_container').show();
        $('#spl_bottom_nav').show();
    },
    review_work : function(uid) {
        /**
         Call the review work app. assignment_id
         */
        if (!uid && this.assignment_id) {
            td_pop('spl_data', this.view_assignment_url + this.assignment_id, 560, 700);
        } else if (uid) {
            //show the preview for the given uid content:
            var uid_data = null;
            for (var i = 0; i < this.preview_completed_data.length; i++) {
                if (this.preview_completed_data[i]['uid'] == uid) {
                    uid_data = this.preview_completed_data[i];
                    break;
                }
            }
            if (uid_data) {
                $('#preview_assignment_data').val(uid_data['ad_data']);
                $('#preview_assignment_type').val(uid_data['ad_type']);
                $('#preview_assignment_image_type').val(uid_data['image_type']);
                var ewindow = window.open(null, 'spl_preview_content', 'width=560,height=700');
                $('#spl_preview_form').submit();
                ewindow.focus();

            }
        }
    },
    show_section : function(section_number) {
        /**
         Show the indicated section:
         */
        if (this.active_section_number) {
            $('#sa_sec_' + this.active_section_number).hide();
            if ($('#sa_nav_link_' + this.active_section_number)) {
                $('#sa_nav_link_' + this.active_section_number).removeClass('spl_active');
            }

            if (this.active_section_number == 'credits') {
                $('#spl_credits_trigger').html('credits');
            }
        }
        $('#sa_sec_' + section_number).show();
        if ($('#sa_nav_link_' + this.active_section_number)) {
            $('#sa_nav_link_' + section_number).addClass('spl_active');
        }
        if (section_number == 'credits') {
            //need to remember the last 'active_section_number' so that when we show credits, the
            //'back to lesson' link can find it:
            this.credits_back_section_number = this.active_section_number;
        }
        this.active_section_number = section_number;
        //figure out about the next/back buttons:
        if (this.active_section_number == 'credits') {
            $('#spl_next_link').hide();
            $('#spl_back_link').hide();
        } else {
            var sec_num = parseInt(this.active_section_number);
            if (sec_num < this.number_of_sections) {
                $('#spl_next_link').show();
            } else {
                $('#spl_next_link').hide();
            }
            if (sec_num > 1) {
                $('#spl_back_link').show();
            } else {
                $('#spl_back_link').hide();
            }
        }

    },
    next_section : function() {
        //Show the next section:
        if (this.active_section_number == 'credits') {
            return;
        } else {
            var next_id = this.active_section_number + 1;
            if (next_id > this.number_of_sections) {
                return;
            }
            this.show_section(next_id);
        }
    },
    previous_section : function() {
        //Show the previous section:
        if (this.active_section_number == 'credits') {
            return;
        } else {
            var back_id = this.active_section_number - 1;
            if (back_id == 0) {
                return;
            }
            this.show_section(back_id);
        }
    },
    id_from_string : function(id_str) {
        /**
         Given an id that is divided by underscores and ends with a number, return the number:
         */
        var id_bits = id_str.split('_');
        return parseInt(id_bits.pop());
    },
    save : function(uid, ad_data, image_type) {
        /**
         Process the saving of text or image:
         */
        if (!image_type) {
            image_type = '';
        }
        var ad_type = this.get_adtype(uid);

        if (this.usage_mode == 'active') {
            $.ajax({
                url : this.save_data_url,
                dataType : 'json',
                data : {
                    resource_code : this.resource_code,
                    uid : uid,
                    ad_type : ad_type,
                    ad_data : ad_data,
                    image_type : image_type
                },
                type : 'POST',
                error : function(XMLHttpRequest, textStatus, errorThrown) {
                    SPLManager.save_fail(XMLHttpRequest, textStatus, errorThrown)
                },
                success : function(data, textStatus, XMLHttpRequest) {
                    SPLManager.save_success(data, textStatus, XMLHttpRequest)
                }
            });
        } else if (this.is_preview()) {
            //store it locally:
            this.preview_completed_data.push({
                uid : uid,
                ad_type : ad_type,
                ad_data : ad_data,
                image_type : image_type
            });
            this.completed_work.push(uid);
            this.process_activity(uid);
            var act_type = this.get_adtype(uid);
            if (in_array(act_type, this.pop_up_activity_types)) {
                this.close_activity_window(uid);
            }
        }
    },
    save_success : function(data, textStatus, XMLHttpRequest) {
        /**
         Deal with the successful saving of data.
         */
        if (data['error']) {
            alert("Error saving your data:" + data['error']);
        } else {
            var saved_uid = data['assignment']['current_uid'];
            this.completed_work.push(saved_uid);
            this.process_activity(saved_uid);
            this.set_first_screen_options();
            var act_type = this.get_adtype(saved_uid);
            if (in_array(act_type, this.pop_up_activity_types)) {
                this.close_activity_window(saved_uid);
            }
            this.assignment_id = data['assignment']['assignment_id'];
        }
        this.show_review_link();
    },
    save_fail : function(XMLHttpRequest, textStatus, errorThrown) {
        /**
         Deal with the unsuccessful saving of data.
         */
        alert("Error saving your data:" + data['error']);
    },
    save_text : function(uid, data) {
        /**
         Save textual data for the user.
         */
        this.save(uid, data);
    },
    save_image : function(uid, base64text, image_type) {
        /**
         Save an Flash derived image (encoded as base64).
         */
        if (!image_type) {
            image_type = 'jpg';
        }
        this.save(uid, base64text, image_type);
    }
});

