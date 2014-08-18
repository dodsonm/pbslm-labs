function open_feedback_form(url){
    var $form = $.get(url, function (data){
        $("#feedback_form").html(data);
        var modal_height = screen.availHeight/2;
        $('#feedbackModal .modal-body').css('min-height', modal_height);
        var form_title = $.trim($("#form-title").html());
        $("#helpLabel").html(form_title);
    });

    return $form;
}

function show_feedback_form () {
    $("#feedbackModal").modal('show');
    $("#id_name").focus();    
    $("#feedback").ajaxForm({
        target: "#feedback_form",
    });
}

(function($) {
    "use strict";

    $(document).ready(function () {
        var $openform;

        $("#contactLink, #feedbackLink").click(function() {
            $openform = $openform || open_feedback_form($(this).data('url'));   //only call form once
            $openform.done(show_feedback_form);

        });

        if ((window.location.pathname == "/help/") && (window.location.hash == "#feedback")) {
           open_feedback_form($("#feedbackLink").data('url'));
        }
    });
}(jQuery));
