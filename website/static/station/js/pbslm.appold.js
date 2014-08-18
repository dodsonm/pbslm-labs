/*global jQuery, window, document, PBSLM, PBS, jwplayer, console*/
$(function() {
    /* Initialize the video on page load if it's the only one (single video ressource) */
    var $mediaSequence = $('.jwplayer-item');
    if(typeof(jwSequence) === 'undefined'){
    jwSequence = []
    }
    jwSequence = jwSequence || [];
    
    if ($mediaSequence.length || jwSequence.length) {

        jwSettings = $.extend({}, jwSequence[0]);
        
        if(jwSequence.length > 1) {
           jwSettings.playlist = jwSequence; 
        }
    }   

    if($mediaSequence) {
        $mediaSequence.each(function(i) {
            PBSLM.jwVideoPlayer.init(jwSequence[i]);
        });
    }
    if ($('#mediaplayer').length) {
        PBSLM.jwVideoPlayer.init($.extend(jwSettings,{ playerId : 'mediaplayer'}));
    }
    // this is for the playlist
    if (PBSLM.jwp) {
        PBSLM.jwp.onComplete(function() {
            var $elem = $('.media-selected'),
            $elemNext = $elem.next(),
            playlistHeight = $('.media-playlist').offset().top + PBSLM.mediaItems.pgHeight() - $('.playlist-controls').height();
            if($elemNext.length > 0) {
                $elem.removeClass('media-selected');
                $elemNext.addClass('media-selected');
                $.each(PBSLM.getMediaItemText($elemNext[0]), function(index, value) {
                    PBSLM.updateElem(value);
                });
                if($elemNext.offset().top > playlistHeight) {
                    PBSLM.mediaItems.changePg('down');
                }
            }
        });
        PBSLM.jwp.onPlaylistComplete(function() {
            var $elem = $('.media-selected'),
            firstElem = $('.media-item')[0];
            PBSLM.mediaItems.scrollPg(0);
            PBSLM.mediaItems.currentPg(1);
            PBSLM.mediaItems.ctrlUpdate();
            $elem.removeClass('media-selected');
            $(firstElem).addClass('media-selected');
            $.each(PBSLM.getMediaItemText(firstElem), function(index, value) {
                PBSLM.updateElem(value);
            });
        });
    }
});

(function($, document, window, undefined) {

    'use strict';

    window.PBSLM = window.PBSLM || {};
    /**
     * Used to handle the jwPlayer
     * @return {object} Global accesible methods
     */

    PBSLM.jwVideoPlayer = (function() {

        function getCCSettings(initial) {
            if ($.cookie('ccSettings')) {
                return JSON.parse($.cookie('ccSettings'));
            } else {
                return initial;
            }
        }

        function showCCsettings(player) {
            setTimeout(function() {
                player.addButton(
                    STATIC_URL + 'station_site/images/cc_settings.png',
                    'Closed Captions Settings',
                    function() {
                        if (player.getFullscreen()) {
                            player.setFullscreen(false);
                        }

                        if (player.getState() === 'PLAYING') {
                            player.pause();
                        }

                        PBSLM.jwCCSettings.show();
                    },
                    'ccSettings'
                );
            }, 3000);
        }

        /**
         * Initialize the jwPlayer
         * @param  {string} file The file that will be used
         * @return {null}
         */
        function createPlayer(settings, file) {
            var player = jwplayer(settings.playerId).setup({
                width: '100%',
                aspectratio: '16:10',
                stagevideo: false,
                playlist: settings.playlist || [{
                    image: settings.image,
                    file: file,
                    tracks: settings.tracks
                }],
                captions: getCCSettings(settings.captions),
                primary: 'flash'
            });

            if (settings.captions) {
                player.onCaptionsList(showCCsettings(player));
            }
            if (PBSLM.jwAnalitycs) {
                PBSLM.jwAnalitycs({
                    videoPlayer : player,
                    duration : settings.duration,
                    title   : settings.title,
                }); 
            }
            return player;
        }

        /**
         * Initialization
         * @param  {object} settings
         * @return {null}
         */
        function init(settings) {
            /**
             * On multi video pages a string is passed to the init method
             */
            if (typeof settings === 'string') {
                settings = window[settings];
            }

            if (!settings.playerId) {
                console.error(settings.playerId + ' is not a valid DOM element!');
                return null;
            }

            if (settings.skip_geolocation === 'True') {
                PBSLM.jwp = createPlayer(settings, settings.file);
            } else {
                PBSLM.jwVideoInfo(settings);
            }
        }

        return {
            createPlayer: createPlayer,
            getCCSettings: getCCSettings,
            init: init
        };
    }());

    /**
     * Used to handle information about the jwPlayer video
     * @param  {object} settings
     * @return {null}
     */
    PBSLM.jwVideoInfo = function(settings) {
        var data = $.ajax({
            url: settings.url + '?format=jsonp',
            dataType: 'jsonp'
        });

        data.done(function(response) {
            var message;

            if (response.status !== 'error') {
                PBSLM.jwVideoPlayer.createPlayer(settings, response.url);
            } else {
                message = 'Error occured.';
                switch (response.http_code) {
                case 403:
                    message = 'We`re sorry, but this media is not available in your region due to right restrictions.';
                    break;

                case 404:
                    message = 'We are experiencing technical difficulties that are preventing us from playing the media at this time. Please check back again soon.';
                    break;

                case 410:
                    message = 'This media has expired and is no longer available for online streaming.';
                    break;
                }

                /* Arthur: temporary removing the asset download form until the URS implementation is finished */
                $('.agreement-form').remove();
                $('#' + settings.playerId)
                    .css({
                        'width': '100%',
                        'height': '100%',
                        'background-color': '#000',
                        'color': '#fff',
                        'opacity': '1'
                    })
                    .append('<p style="vertical-align: middle; padding: 30px 10px; text-align: center; font-style: normal; font-variant: normal; font-weight: normal; font-size: 15px; line-height: 20px; font-family: Arial, Helvetica, sans-serif; position: relative;">' + message + '</p>');
            }
        });
    };

    /**
     * Used for GA event tracking
     * @return {object} Global accesible methods
     */
    PBSLM.Tracking = (function() {

        function trackEvent(category, action, label) {
            var identifier = [window.resource_title, window.resource_code, window.current_asset_title];

            label = label || identifier.join(' | ');

            PBS.GA.trackEvent(category, action, label);
        }

        return {
            trackEvent: trackEvent
        };

    }());

}(jQuery, document, window));


