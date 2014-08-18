PBSLM = window.PBSLM || {};


(function () {
    'use strict';
    var debugMode = true;

    this.scrollWindow = function(direction) {
        if(direction=='down') {
            this.pos = $(window).scrollTop();
            $('html,body').scrollTop(0);
        } else {
            $('html,body').scrollTop(this.pos || 0);
        }
    };

    this.toggleElement = function (el, toggleClassOnly, upSpeed, downSpeed) {
        /***
         *
         *   Called like so:
         *       var $el = this;
         *       PBSLM.toggleElement($el);
         *
         *   Accepts three arguments:
         *   1. el, the element to be toggled
         *   2. upSpeed (optional), the speed in milliseconds of the slideUp() animation
         *   3. downSpeed (optional), the speed in milliseconds of the slideDown() animation
         *
         *   Notes:
         *   1. Default values for upSpeed and downSpeed
         *   2. The data- elements of the element that called toggleElement() are passed into a
         *      data array
         *   3. The item to be toggled should be defined in the data-target attribute of the
         *      element that calls toggleElement()
         *   4. iconTarget is a visual caret _inside_ the el element that indicates open or closed
         *   5. A reference to the parent namespace to prevent conflicts with 'this' when called
         *      from inside a jquery function referencing a DOM element
         *   6. Sanity check: do not fire slideUp /slideDown if an animation is in progress
         */
        upSpeed = upSpeed || 250;                               /* 1 */
        downSpeed = downSpeed || 400;                           /* 1 */
        var data = $(el).data(),                                /* 2 */
            targetElement = data.target,                        /* 3 */
            ns = this;                                          /* 5 */
            if ($(targetElement).hasClass('js-open')) {         /* 6 */
                if(toggleClassOnly) {
                    $(targetElement).removeClass('js-open');
                    $(el).removeClass('js-open');
                } else {
                    $(targetElement).slideUp({
                        duration    : upSpeed,
                        start       : function () {
                            $(this).removeClass('js-open');
                            $(el).removeClass('js-open');
                        }
                    });
                }
            } else {
                if(toggleClassOnly) {
                    $(targetElement).addClass('js-open');
                    $(el).addClass('js-open');
                } else {
                    $(targetElement).slideDown({
                        duration    : downSpeed,
                        complete    : function () {
                            $(this).addClass('js-open');
                            $(el).addClass('js-open');
                        }
                    });
                }
            }
    };

    this.switchPage = function (el) {
        /***
         *
         *   HTML as follows:
         *      <div class="page-holder" id="myName">
         *          <div class="page  is-active  default-page" id="mainPage">A</div
         *          <div class="page"  id="secondPage">B</div>
         *      </div>
         *      <a href="#myName" class="switchPage"  data-target="#mainPage">Show Main Page</div>
         *      <a href="#myName" class="switchPage"  data-target="#secondPage">Show Second Page</div>
         *
         *  NB There should only be one page in the HTML document with a .default-page class. You can
         *     nest as many sets of pages as you like, but only have one default page, and it should be
         *     in the outermost set of pages in the DOM.
         *
         *  Elements with a class of switchPage have this function attached ay $(document).ready()
         *
         *   1. Get the target from the links' data-target attribute
         *   2. An active page will have the class .is-active and does not need to be made active.
         *      If it's inactive, we add the .is-active class then remove that class from any siblings,
         *   3. A sanity check - remove all body styling for the default page.
         *   4. We flipped the page, so let's fix the height of the body to match it, eh?
         */
        var data = $(el).data(),                                        /* 1. */
            targetElement = data.target,
            resizeTarget = data.resizetarget,
            ns = this;
        if (!$(targetElement).hasClass('is-active')) {                  /* 2. */
            $(targetElement).addClass('is-active').siblings().removeClass('is-active');
            if (resizeTarget) {                       /* 4. */
                ns.resizeScreenToTarget(resizeTarget);
            } else {
                $('html, body').removeAttr('style');
            }
        }
    };

    this.resetPage = function () {
        /***
         *  reset to the default page, which has a class of '.default-page'.
         */
        var targetElement = $('.default-page'),
            ns = this;
        if (!$(targetElement).hasClass('is-active')) {
            $(targetElement).addClass('is-active').siblings().removeClass('is-active');
            $('html, body').removeAttr('style');
        }
    };

    this.doResize = function () {
        /***
         *   No arguments. Grab the current window width and show/hide the main navigation as
         *   appropriate.
         *
         *  NOTES
         *  1. Just in case the user has the menu open when they resize the window
         */

        var viewportWidth = $(window).width(),
            ns = this;
            ns.currentViewPort = viewportWidth;
            ns.hasMultiMedia = ns.hasMultiMedia || $('#media-playlist');
        //resize media items
        if (ns.hasMultiMedia) ns.mediaItems.pgResize();

        if (ns.debugMode===true) {
            var titleString = "Panda-UX @ " + viewportWidth + "px";
            document.title = titleString;
        }
        PBSLM.resetPage();
        if (viewportWidth > 759) {
            $('#mainNavigation').show().removeClass('js-open');
            $('#searchbar').removeAttr('style');
            $('#mainNavigation').find('.open').removeClass('js-open');
        } else {
            $('#mainNavigation').hide();
            if(PBSLM.jwp) {
                PBSLM.jwp.stop();
            }
        }
    };

    this.getMediaItemInfo = function(elem) {
        //An array of data so that multiple updates can be bundled up
        var $elem = $(elem);
        return [
            { target: '#featured-title', value: $elem.find('.media-item-xs .media-open-text').text() },
            { target: '#featured-body', value: $elem.find('.media-item-text').text() },
            { target: '#info-permitted-use', value: $elem.find('.info-permitted-use').text() },
            { target: '#info-accessibility', value: $elem.find('.info-accessibility').text() },
            { target: '#featured-img', value: $elem.find('.media-item-img').attr('src'), changeType: 'attr', attr: 'src'},
            { target: '#option-transcript', value: $elem.find('.info-transcript a').attr('href'), changeType: 'attr', attr: 'href'},
            { target: '#option-transcript', value: $elem.find('.info-transcript a').attr('href')?"":"display: none;", changeType: 'attr', attr: 'style'},
            { target: '#option-download', value: $elem.find('.info-download').attr('data-download')?"":"display:none;", changeType: 'attr', attr: 'style'},
            { target: '#download_form', value: $elem.find('.info-download').attr('data-download')?"":"display:none;", changeType: 'attr', attr: 'style'},
            { target: '#download_form', value: $elem.find('.info-download').attr('data-download'), changeType: 'attr', attr: 'action'},
            { target: '#download_licence', value: $elem.find('.info-download').attr('data-licence'), changeType: 'attr', attr: 'href'},
        ];
    };

    this.updateElem = function(elem) {
        //a generic function to update an element.  takes in an obj, defaults to text but can type==attr or type ==html
        if (elem.changeType) {
            if(elem.changeType === "attr") {
                $(elem.target).attr(elem.attr, elem.value);
            } else {
                $(elem.target).html(elem.value);
            }
        } else {
            $(elem.target).text(elem.value);
        }
    };

    this.mediaItems = (function(ns) {
        //this function has the methods to control scrolling of the playlist

        return {
            $listElem : (function () {

                return $('#media-playlist-wrapper');

            })(),
            $itemElem: (function () {

                return $('.media-selected');

            })(),
            totalItems: (function () {

                return  $('.media-item').length;

            })(),
            itemsPerPg: function() {
                    //playlist items shown depend on viewport
                    return ns.currentViewPort > 1260 ? 3 : 2;
            },
            itemHeight: function() {
                return this.$itemElem.height();
            },
            pgHeight: function() {
                return this.itemsPerPg() * this.itemHeight();
            },
            currentPg : function(setPg) {
                return setPg ? this.pg = setPg : (this.pg || 1);
            },
            totalPgs: function() {
                return Math.ceil(this.totalItems / this.itemsPerPg());
            },
            pgDown: function() {
                var pg = this.currentPg();
                return ((pg + 1) <= this.totalPgs()) ? this.currentPg(++pg) : false;
            },
            pgUp: function() {
                var pg = this.currentPg();
                return ((pg - 1) > 0 ) ? this.currentPg(--pg) : false;
            },
            ctrlUpdate:  function() {
                var ctrlInfo = this.currentPg()+'/'+this.totalPgs();
                ns.updateElem({ target: '#playlist-count', value:  ctrlInfo });
            },
            scrollPg: function(offset) {
                this.$listElem.animate({ top: offset*-1 }, this.ctrlUpdate(this.currentPg(), this.totalPgs()));
            },
            changePg: function(direction) {
                //handler for pg up or down requests
                var posChng = 0;

                if (direction == 'down' && this.pgDown()) {
                    posChng = 2;
                } else if (direction == 'up' && this.pgUp()) {
                    posChng = -2;
                }
                this.scrollPg((this.currentPg()-1)*this.pgHeight()+posChng);
            },
            pgResize: function() {
                //handler for pg resize (corrects for the fact that the list changes the # of items shown at diff breakpoints)
                if (this.currentPg() > this.totalPgs()) {
                    this.changePg('up');
                } else {
                    this.scrollPg((this.currentPg()-1)*this.pgHeight()+2);
                }
                this.ctrlUpdate();
            }

        };
    })(this);

    this.resizeScreenToTarget = function (myTarget) {
        /***
         *   Resize the screen to match the size of the target page myTarget.
         *   This means, when showing a page smaller than the overall document
         *   height, the user will not be able to scroll beyond the bounds
         *   of the active page.
         *
         *   NOTES:
         *   1. The default was visible when the page was rendered. No need to do any
         *      resizing here. Also, if we are targeting .default-page, we want to do
         *      something else (see X, below)
         *   2. Gather the height of the viewport, the height of the target, and the
         *      offset().top of the target to determine which is taller, the viewport
         *      or the target (including offset)
         *   3. If the element is shorter than the viewport, we want to shrink the page
         *      height to fill the viewport. If it's taller then the user will need to
         *      be able to scroll through the element so viewportHeight will need to
         *      match the outer height of the element
         *   4. Thanks to a WebKit bug, we need to target both html and body, rather
         *      than just body
         *   5. Since we are targeting the default, we just need to remove the CSS from
         *      everything else.
         */

        myTarget = myTarget || 'default';
        var ns = this;
        if ( (myTarget !== 'default') && (!$(myTarget).hasClass('default-page')) ) { /* 1 */
            var viewportHeight = $(window).height(),                          /* 2 */
                targetOffset = $(myTarget).offset().top,
                targetOuterHeight = $(myTarget).outerHeight(),
                targetSumHeight = targetOffset + targetOuterHeight;
            if (targetSumHeight > viewportHeight) {
                $(myTarget).css({
                    'height'    : viewportHeight,
                    'overflow'  : 'scroll-y'
                });
                viewportHeight = targetSumHeight;           /* 3 */
            }
            $('html,body').css({                           /* 4 */
                'height'    : viewportHeight,
                'overflow': 'hidden'
            });
        } else {
            $('html, body').removeAttr('style');             /* 5 */
        }
    };

}).apply(PBSLM);

$(document).ready(function () {
    /* 1.  If Modernizr reports no SVG support, replace the filename extension of all <img> tags
     *     containing .svg' with '.png'.
     * 2.  Check if the device is mobile or not using window.orientation and then attach doResize()
     *     to the appropriate method (reize or orientationchange)
     * 3.  Add Owl Carousel to the page
     * 4.  Remove the manual, HTML nav from the carousel to allow Owl Carousel's own nav to take
     *     over
     * 5.  Hide the search filters and the mobile-only secondary nav. We do this here because if we
     *     did in in CSS and JS failed, there would be no way for users to get to the filters or nav
     * 6.  Pass the clicked element to the toggleElement() function
     * 7.  Any element with a class of scroll-to has a behaviour attached so that on click we grab
     *     the data-target (an id), get its offset in the document, and then animate a scroll to its
     *     y-coordinates
     * 8. Functions fired when the window is scrolled - currently just one to show/hide the search
     *     icon.
     * 9. Hook add-to-favorite behaviour on elements.
     *
     */

     /* 1. */
     if (!Modernizr.svg) {
        $('img[src$=".svg"]').each(function() {
            $(this).attr('src', $(this).attr('src').replace('.svg', '.png'));
        });
    }

    /* 2. */
    $(window).smartresize(function (){
        PBSLM.doResize();
    });


    /* 3. */
    $("#owl-slider").owlCarousel({
        paginationSpeed : 800,
        singleItem      : true,
        autoPlay        : 10000,
        stopOnHover     : false,
        navigation      : true,
        navigationText  : ["K","J"]
    });
    /* 4. */
    $("#carouselOne__nav").remove();    /* 5. */
    /* 5. */
    $('.browse-grade, .browse-options').on('click touchstart', function(e) {
        var $filters = $('.search-form-filters');
        var $browse_grade_arrow = $('.lm-triangle-toggle', $(this));
        e.preventDefault();
        if($filters.hasClass('is-open')) {
            $filters.slideUp();
            $filters.removeClass('is-open');
            $browse_grade_arrow.removeClass('lm-triangle-up').addClass('lm-triangle-down');
        } else {
            $filters.slideDown();
            $filters.addClass('is-open');
            $browse_grade_arrow.removeClass('lm-triangle-down').addClass('lm-triangle-up');
        }

    });
    /* 6. */
    $(document).on('click touchstart', '.nav-btn, .navbar-toggle, .lesson-open, .coll-show-hide, .help-show-hide, .toggle-facet-container', function(event) {
        event.preventDefault();
        var toggleClass = (this.id == 'topics-title');
        PBSLM.toggleElement(this, toggleClass);
    });

    //Show/hide text on XS media items - traverse DOM to find elements instead of using unique ids for each playlist element
    $('.media-open-text').on('click touchstart',function(event) {

        var findTargetEl;

        if(PBSLM.currentViewPort > 768) {
            return false;
        } else {
            event.preventDefault();
            PBSLM.toggleElement(this, true);
        }
    });

    $('.media-close-text').on('click touchstart',function(event) {
        event.preventDefault();
        var findTriggerEl = $(this).parent().parent().find('.media-open-text');
        $(findTriggerEl).trigger('click');
    });

    $('#media-playlist').on('click touchstart','.media-item',function(event) {
        var mediaIndex = $('.media-item').index(this);
        if (PBSLM.currentViewPort < 768 || $(this).hasClass('media-selected')) return;        //these actions should not happen on mobile

        if($(event.target).hasClass('playlist-item-link') && PBSLM.currentViewPort > 768) {
            event.preventDefault();
        }

        $(this).siblings().removeClass('media-selected');
        $(this).addClass('media-selected');

        $.each(PBSLM.getMediaItemInfo(this), function(index, value) {
           PBSLM.updateElem(value);
        });

        if(PBSLM.jwp) {
            PBSLM.jwp.playlistItem(mediaIndex);
        }

    });

    $('#playlist-down').on('click touchstart',function(event) {
        event.preventDefault();
        PBSLM.mediaItems.changePg('down');
    });

    $('#playlist-up').on('click touchstart',function(event) {
        event.preventDefault();
        PBSLM.mediaItems.changePg('up');
    });

    $('.lesson-min').on('click touchstart',function(event) {
        $('.lesson-open').trigger('click');
    });

    $('#video-info').on('click touchstart',function(event) {
        var viewportWidth = $(window).width();
        var smallScreen = (viewportWidth <769);
        event.preventDefault();
        event.stopPropagation();
        if($(this).hasClass('btn-open')) {
            if(smallScreen && $('#page-info').is(':hidden')) {
                $(this).addClass('btn-active');
                $('#page-info').slideDown();
            } else {
                $('#page-info').slideUp();
                $(this).removeClass('btn-open btn-active');
                $(this).addClass('btn-closed');
            }
        } else {
            if ($(this).hasClass('btn-closed')) {
                if (smallScreen) {
                    $('#page-info').slideDown();
                } else {
                    $('#page-info').slideDown();
                }
            }
            $(this).removeClass('btn-closed');
            $(this).addClass('btn-open btn-active');
        }
    });

    $('#play-video').on('click',function() {
       PBSLM.jwp.play();
    });

    $('#social-info').on('click touchstart',function(event) {
        event.preventDefault();
        if($(this).hasClass('btn-open')) {
            $('.social-btns').slideUp();
            $(this).removeClass('btn-open btn-active');
            $(this).addClass('btn-closed');
        } else {
            $(this).removeClass('btn-closed');
            $(this).addClass('btn-open btn-active');
            $('.social-btns').slideDown();
        }
    });

    $('.hide-images-toggle').on('click touchstart', function(event) {

        var $searchResults = $('#search-results-container'),
        $hideImgToggle = $('.hide-images-toggle'),
        outerThis = this,
        checkboxState = $(this).prop('checked');

        if($(this).is(':checked')) {
            $searchResults.addClass('hide-images');
        } else {
            $searchResults.removeClass('hide-images');
        }

        //make sure other checkboxes are updated to this state
        $hideImgToggle.each(function(i) {
           if(outerThis.id != this.id) $(this).prop('checked', checkboxState);
        });

    });

    /* 7. */
    $('.toggle').click( function (event) {
        event.preventDefault();
        var $el = this;
        PBSLM.toggleElement($el);
        if($(this).hasClass('active')) {
            $(this).removeClass('active');
        } else {
            $(this).addClass('active');
        }
    });

    $('#coll-pg-toggle').on('click touchstart',function(event) {
        var $pgShown = $('.pg-shown'),
        $pgHidden = $('.pg-hidden');

        event.preventDefault();

        $pgShown.each(function() {
            $(this).addClass('pg-hidden').removeClass('pg-shown');
        });
        $pgHidden.each(function() {
            $(this).addClass('pg-shown').removeClass('pg-hidden');
        });
    });

    /* 8. */
    $('.scroll-to').on('click', function(event) {
        event.preventDefault();
        var myData = $(this).data(),
            myTarget = myData.target,
            offset = $(myTarget).offset(),
            offsetY = offset.top - $('.site-header').height();
        $("html, body").animate({ scrollTop: offsetY }, "slow");
        $(myTarget).find('input[type="search"]').focus();
        return false;
    });

    PBSLM.doResize();

    //this is for brand list logo when hover will change color
    $('.brand-img').hover(
        function () {
            var _this = $(this),
                color = _this.data("color");

            _this.attr("src", color);
            _this.animate({'opacity': 0.5}, {
                'complete': function () {
                    _this.animate({'opacity': 1});
                }
            });
        },
        function () {
            var _this = $(this),
                grayscale = _this.data("grayscale");

            _this.attr("src", grayscale);
        }
    );

    /* 9. */
    $(".lm-favorite-this").on('click touchstart', function(){
        var link = $(this);

        //determine data url
        if (link.attr("data-is-fav") == "1"){
            fav_url = link.attr("data-unfav-url");
        }
        else {
            fav_url = link.attr("data-fav-url");
        }
        $.ajax({
            url : fav_url,
            success : function() {
                // Set the fav state
                if (link.attr("data-is-fav") == "1"){
                    link.attr("data-is-fav", "0");
                    // TODO: setting icon to star instead of hart just to see a visual change
                    $("i", link).removeClass("lm-star").addClass("lm-heart");
                } else {
                    link.attr("data-is-fav", "1");
                    $("i", link).removeClass("lm-heart").addClass("lm-star");
                }
            }
        });
    });

    $('.lm-star-outline').click(function(e) {
        /**********************************************
        TODO: cleanup once unrate is implemented
        use the data-atributes instead of indexes
        or remove the data-attributes;
        move the vistual changes in success callbacks
        on the ajax call
        **********************************************/
        var $allStars = $('.lm-star-outline'),
            currentIndex = $allStars.index(this)+1,
            $selectedStars = $allStars.filter('.selected'),
            resource_id = $(this).data('rate-id');

        // current rating will change if the star clicked is different otherwise set to not rated

        if(currentIndex == $selectedStars.length) {
            if($(this).hasClass('selected')) {
                // ignore the unrate, untill implemented
                // $('.lm-star-outline').removeClass('selected');
                currentIndex = 0;
            }

        } else {
            $(this).addClass('selected').nextAll().removeClass('selected');
            $(this).prevAll().addClass('selected');
        }
        if (currentIndex != 0) { // ignore the unrate, utill implemented
            $.post("/rate_it/"+resource_id+"/", {'rating': currentIndex});
        }
    });

});

/***
 *   smartresize
 *   http://www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/
 ***/
(function ($,sr){
  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function (func, threshold, execAsap) {
      var timeout;
      return function debounced () {
          var obj = this, args = arguments;
          function delayed () {
              if (!execAsap)
                  func.apply(obj, args);
              timeout = null;
          }
          if (timeout)
              clearTimeout(timeout);
          else if (execAsap)
              func.apply(obj, args);

          timeout = setTimeout(delayed, threshold || 100);
      };
  };
  // smartresize
  jQuery.fn[sr] = function (fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

})(jQuery,'smartresize');
