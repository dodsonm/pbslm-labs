/*globals PBSLM, jQuery, window, jwplayer, setTimeout*/
/*jslint regexp: true*/
(function (window, $) {
    'use strict';

    if (!window.PBSLM) {
        window.PBSLM = {};
    }

    PBSLM.jwCCSettings = (function() {
        var ccSettings,
            initialSetting = {
                back : true,
                color : 'ffffff',
                fontSize : 20,
                fontFamily : 'Arial',
                edgeStyle : 'none',
                backgroundColor : '#000000',
                windowColor : '#000000',
                fontOpacity : 100,
                backgroundOpacity : 100,
                windowOpacity : 0
            },
            main = '#cc-settings',
            preview = '#cc-preview',
            previewWColor = '.cc-preview-window',
            previewText = '.cc-preview-text',
            colorSelector = '#cc-settings li[data-setting]',
            rangeSelector = '.cc-font-size, .cc-font-opacity, .cc-background-opacity, .cc-window-opacity',
            optionSelector = '.cc-font-family, .cc-edge-style',
            defaultTextColorRGB,
            defaultBackgroundColorRGB,
            defaultWindowColorRGB,

            hex2rgb = function(hex) {
                hex = /^#?(([0-9a-fA-F]{2}){3}|([0-9a-fA-F]){3})$/i.exec(hex)[1];
                /* double each item if the hex is a shorthand version */
                hex = hex.length === 3 ? hex.replace(/(.)/g, '$1$1') : hex;
                /* split the hex string into an array */
                hex = hex.match(/../g);

                return [parseInt(hex[0], 16), parseInt(hex[1], 16), parseInt(hex[2], 16)];
            },

            updateRangePreview = function(id, val) {
                if (id !== 'fontSize') {
                    val += "%";
                }

                $('#' + id).next('span').text(val);
            },

            rangePercentOptimiziation = function(val) {
                return parseInt(val, 10) / 100;
            },

            rgba = function(rgb, a, decorator) {
                if (decorator === false) {
                    return rgb.join(',') + ',' + rangePercentOptimiziation(a);
                }

                return 'rgba(' + rgb.join(',') + ',' + rangePercentOptimiziation(a) + ')';
            },

            updatePreview = function(prop, val) {

                if (typeof val === 'undefined') { return; }

                switch (prop) {
                case 'fontSize':
                    $(preview).css('font-size', val + 'px');
                    ccSettings.fontSize = val;
                    break;
                case 'fontFamily':
                    $(preview).css('font-family', val);
                    ccSettings.fontFamily = val;
                    break;
                case 'edgeStyle':
                    $(preview).attr('class', val);
                    ccSettings.edgeStyle = val;
                    break;
                case 'color':
                    defaultTextColorRGB = hex2rgb(val);
                    $('.cc-font-opacity').val(100);
                    updateRangePreview('fontOpacity', 100);
                    $(previewText).css('color', '#' + val);
                    ccSettings.color = val;
                    updatePreview('fontOpacity', 100);
                    break;
                case 'backgroundColor':
                    defaultBackgroundColorRGB = hex2rgb(val);
                    $('.cc-background-opacity').val(100);
                    updateRangePreview('backgroundOpacity', 100);
                    $(previewText).css('background-color', '#' + val);
                    ccSettings.backgroundColor = val;
                    updatePreview('backgroundOpacity', 100);
                    break;
                case 'windowColor':
                    defaultWindowColorRGB = hex2rgb(val);
                    $('.cc-window-opacity').val(100);
                    updateRangePreview('windowOpacity', 100);
                    $(previewWColor).css('border-color', '#' + val);
                    ccSettings.windowColor = val;
                    updatePreview('windowOpacity', 100);
                    break;
                case 'fontOpacity':
                    $(previewText).css('color', rgba(defaultTextColorRGB, val));
                    ccSettings.fontOpacity = val;
                    break;
                case 'backgroundOpacity':
                    $(previewText).css('background-color', rgba(defaultBackgroundColorRGB, val));
                    ccSettings.backgroundOpacity = val;
                    break;
                case 'windowOpacity':
                    $(previewWColor).css('border-color', rgba(defaultWindowColorRGB, val));
                    ccSettings.windowOpacity = val;
                    break;
                }
            },

            resetCCSettings = function() {
                ccSettings = $.extend({}, initialSetting);

                // erase ccSettings cookie
                $.cookie("ccSettings", null, {
                    expires : -1,
                    path : '/',
                    domain : ".pbs.org"
                });

                // remove styles and classes from preview div
                $(preview).removeAttr('class').removeAttr('style');
                $(previewWColor).removeAttr('style');
                $(previewText).removeAttr('style');

                // set font-size to default size
                $('.cc-font-size').val(ccSettings.fontSize);
                updateRangePreview('fontSize', ccSettings.fontSize);

                // reset opacity selectors to default
                $('.cc-font-opacity, .cc-background-opacity').each(function(index, obj) {
                    $(obj).val(100);
                    updateRangePreview($(obj)[0].id, 100);
                });

                $('.cc-window-opacity').val(ccSettings.windowOpacity);
                updateRangePreview($('.cc-window-opacity')[0].id, ccSettings.windowOpacity);
                updatePreview('windowOpacity', ccSettings.windowOpacity);

                // reset font options selectors to default
                $('.cc-font-family').val('arial');
                $('.cc-edge-style').val('none');

                // reset color options to default
                $('.cc-font-color > li').siblings().removeClass('active');
                $('.cc-font-color > li[data-option="ffffff"]').addClass('active');

                $('.cc-background-color > li').siblings().removeClass('active');
                $('.cc-background-color > li[data-option="000000"]').addClass('active');

                $('.cc-window-color > li').siblings().removeClass('active');
                $('.cc-window-color > li[data-option="000000"]').addClass('active');
            },

            saveCCSettings = function() {
                if (!$.isEmptyObject(ccSettings)) {
                    $.cookie("ccSettings", JSON.stringify(ccSettings), {
                        expires : 356,
                        path : '/'
                    });

                    $('.cc-save').addClass('btn-warning').text('Saving ...');

                    setTimeout(function() {
                        window.location.reload();
                    }, 1000);
                }
            },

            setHandlers = function() {
                // all the options that have data-settings
                $(colorSelector).on('click', function() {
                    var $this = $(this);

                    $this.addClass('active').siblings().removeClass('active');

                    updatePreview($this.attr('data-setting'), $this.attr('data-option'));
                });

                // font size range input
                $(rangeSelector).on('change click', function() {
                    var $this = $(this),
                        min = $this.attr('min'),
                        max = $this.attr('max'),
                        val = parseInt($this.val(), 10);

                    
                        val = (val < min) ? min : val;
                        val = (val > max) ? max : val;
                        $this.val(val);

                    updatePreview(this.id, val);
                    updateRangePreview(this.id, val);
                });

                $(optionSelector).on('change click', function() {
                    var $this = $(this);

                    updatePreview($this[0].id, $this.val());
                });

                // reset button
                $('.cc-reset').on('click', resetCCSettings);

                // save button
                $('.cc-save').on('click', saveCCSettings);
            },

            show = function() {
                $(main).modal({
                    keyboard: false
                }).on('hide', function() {
                    if (jwplayer().getState() === "PAUSED") {
                        jwplayer().play();
                    }
                });
                $(main).removeClass('hide');
            },

            init = function() {
                ccSettings = $.cookie("ccSettings") ? JSON.parse($.cookie("ccSettings")) : $.extend({}, initialSetting);

                setHandlers();

                defaultTextColorRGB = hex2rgb(ccSettings.color);
                defaultBackgroundColorRGB = hex2rgb(ccSettings.backgroundColor);
                defaultWindowColorRGB = hex2rgb(ccSettings.windowColor);

                // set active the colors
                $('.cc-font-color > li[data-option="' + ccSettings.color + '"]').addClass('active');
                $('.cc-background-color > li[data-option="' + ccSettings.backgroundColor + '"]').addClass('active');
                $('.cc-window-color > li[data-option="' + ccSettings.windowColor + '"]').addClass('active');

                // set the alphas for the preview div
                $(previewText).css('color', rgba(defaultTextColorRGB, ccSettings.fontOpacity));
                $(previewText).css('background-color', rgba(defaultBackgroundColorRGB, ccSettings.backgroundOpacity));
                $(previewWColor).css('border-color', rgba(defaultWindowColorRGB, ccSettings.windowOpacity));
            };

        return {
            show : show,
            init : init
        };

    }());
}(window, jQuery));