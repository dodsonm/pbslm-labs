function intializeGlossaryTermTooltip(trigger, glossary_url) {
    var trigger_obj = $(trigger);
    var term = trigger_obj.attr('rel');
    var tooltip_id = 'glossary_tooltip_' + term;
    var loader_img_id = 'tooltip_loader';
    var loader_img = '<img style="" id="' + loader_img_id + '" src="' + SPL_STATIC_URL + 'images/loader.gif" />';
    var tooltip_str = '<div class="glossary_tooltip" id="' + tooltip_id + '"><div class="tooltip_top"><div class="tipMid"></div><div class="tipBtm">&nbsp;</div></div></div>';
    var ajax_error_msg = '<div>There was an error retrieving this glossary term.</div>';
    var term_url = glossary_url.replace('--term--', term);

    trigger_obj.click(function(event) {
        // hide all the tooltips
        $('.glossary_tooltip').hide();

        if (!trigger_obj.pbs_tooltip) {
            $('body').append(tooltip_str);
            trigger_obj.pbs_tooltip = new PBSLM.Tooltip(trigger_obj, $('#' + tooltip_id));

            $.ajax({
                url : term_url,
                async : true,
                error : function(data) {
                    $('#' + tooltip_id + ' .tipMid').html(ajax_error_msg);
                },
                success : function(data) {
                    $('#' + tooltip_id + ' .tipMid').html(data);
                },
                beforeSend : function(XMLHttpRequest) {
                    trigger_obj.after(loader_img);
                },
                complete : function(XMLHttpRequest) {
                    $('#' + loader_img_id).remove();
                }
            });
        }

        trigger_obj.pbs_tooltip.show(function() {
            $('body').not(trigger_obj).one('click', function() {
                trigger_obj.pbs_tooltip.hide();
            });
        });

        event.stopPropagation();
    });
}