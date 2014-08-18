/*jslint browser: true, devel: false, nomen: true */
/*global PBSLM, $, _ */

/*
    @author: MLD

    Architecture meant to imitate Backbone.js and is intended to be easily
    chopped up into AMD modules or into a true Backbone app.

    (I'm not liking that single object structure after a while -mld)

    Refactor Note: Update: PBSLM moving away from Backbone-like things and
    Underscore. Let's keep things as generic OO modules similar to Bootstrap.
    Also, I think this tries to map modules to the related views.py functions,
    and may be easier to DRY out if the modules were more object oriented.
*/

(function () {

    "use strict";
    window.PBSLM = window.PBSLM || {};

    // Favorites app.
    PBSLM.Favorites = {
        // Refactor note: Originally misunderstood the concept of 'Favorites'
        // and should rename this to be more encompassing, like 'MyFaves'
        initialize: function (endpoints) {
            this.endpoints = endpoints;
            this.utils = new PBSLM.Utils();
            this.currentFolder = {};
            this.pagination = {};
            this.pagination.default_break_point = 5;
            this.pagination.break_point = this.pagination.default_break_point;

            // apply jQuery UI Sortable to favorites list
            if (this.endpoints.sortFolder) {
                this.SortableList.initialize("#favorites",
                    this.endpoints.sortFolder);
            }

            this.events();

            this.Guide.initialize();
        },
        events: function () {
            var root = PBSLM.Favorites;

            // Please keep callback logic to bare minimum.
            // Also make sure to unbind any existing listeners so we don't
            // dupe the script steps on each event.

            $(window)
                .unbind('beforeunload')
                .on('beforeunload', function () {
                    // Check for unsaved notes.
                    var conf, $unsaved;

                    $unsaved = $('#favorites').find('.notes')
                        .find('.ico-save:not(.saved)');
                    if ($unsaved.length > 0) {
                        return 'Looks like you have some unsaved changes.';
                    }
                });

            // How much do we really want to do in this document ready?
            //
            // The unbinding here causes order of operations issues
            //
            // Move whataver needs to happen on ready into each module and call
            // each initialize() in this.initialize() to set them like for
            // this.Guide above
            $(document)
                .unbind('ready')
                .on('ready', function () {

                    root.FavoritesFolderSet.initialize();
                    root.MyFavesControls.initialize();
                    root.Notes.initialize();
                    root.paginateFavorites();

                    // REMOVE BEFORE PULL REQUEST
                    // root.utils.updateImagePathsForDev();
                });
            $('.edit.folder')
                .unbind('click')
                .on('click', function (event) {
                    event.preventDefault();
                    root.EditFolder.initialize($(event.target).data('id'));
                });
            $('#manage-folders-link')
                .on('click', function (event) {
                    event.preventDefault();
                    root.FolderManager.initialize();
                });
            // EXPERIMENTAL FOLDER SORTER
            $('#folder-sorter')
                .unbind('click')
                .on('click', function (event) {
                    if ($(this).data('sort-order') === 'asc') {
                        $('#folder-list > li').tsort('', {
                            attr: 'data-name',
                            order: 'desc'
                        });
                        $(this).data('sort-order', 'desc');
                    } else if ($(this).data('sort-order') === 'desc') {
                        $('#folder-list > li').tsort('', {
                            attr: 'data-name',
                            order: 'asc'
                        });
                        $(this).data('sort-order', 'asc');
                    }
                });
        },
        updateMyFaves: function (endpoint, data, flexParam1, test) {
            // Just a decorator/delegate for $.post()
            // Pass a function to flexParam1 for a callback
            // Pass a bool as either third or fourth arg to indicate test mode.
            var testMode, callback;

            testMode = test || false;
            callback = function () {};

            // If flexParam1 is a function, then it's a callback, otherwise if
            // it's a boolean, then it's a flag for test mode.
            if (typeof flexParam1 !== 'function' &&
                    typeof flexParam1 === 'boolean') {

                testMode = flexParam1;

            } else if (typeof flexParam1 === 'function') {
                callback = flexParam1;
            }

            /* Only enable this conditional with jslint directive, 'devel:true'
            if (testMode === true) {
                console.log('[PBSLM updateFavorite]\n\tendpoint: %s\n' +
                    '\tdata: %o', endpoint, data);
            } else {
                $.post(endpoint, data, callback);
            }

            OTHERWISE: Use the $.post() method sequentially instead */
            $.post(endpoint, data, callback);
        },
        sortFolders: function (key, order) {
            // Refactor Note: Move to Favorites obj
            var $folderItems = $('#folder-list-main-content > li');

            $folderItems.tsort({
                attr: 'data-' + key,
                order: order
            });
        },
        sortFavorites: function (key, order) {
            // Refactor Note: Move to Favorites obj
            var $favoriteItems = $('#favorites > li');

            $favoriteItems.show();

            $favoriteItems.tsort({
                attr: 'data-' + key,
                order: order
            });

            this.paginateFavorites();
        },
        paginateFavorites: function (itemsPerPage) {
            // Refactor Note: Move to Favorites obj; Show All functionality
            // brutally added at the very last minute.

            this.itemsPerPage = itemsPerPage || this.pagination.break_point;

            var $favoritesContainer = $('#favorites-container'),
                showAllFavorites = _.bind(this.showAllFavorites, this),
                showLessFavorites = _.bind(this.showLessFavorites, this);

            // Reset display of paginated items
            $favoritesContainer.find('li.favorite').show();

            $favoritesContainer.pajinate({
                items_per_page: this.itemsPerPage,
                num_page_links_to_display : 8,
                nav_label_prev : 'Previous',
                nav_label_next : 'Next',
                show_first_last: false
            });

            $('.page_navigation span.ellipse').hide();

            $favoritesContainer.find('.page_navigation')
                .append('<a id="paj-show-all" href="javascript:void(0)">Show All</a>')
                .append('<a id="paj-show-less" href="javascript:void(0)">Show Less</a>');
            $('#paj-show-all')
                .on('click', function (event) {
                    event.preventDefault();
                    showAllFavorites();
                });
            $('#paj-show-less')
                .on('click', function (event) {
                    event.preventDefault();
                    showLessFavorites();
                }).hide();

            $favoritesContainer.find('.page_navigation').show();
        },
        showAllFavorites: function () {
            this.pagination.break_point = $('#favorites-container').find('li.favorite').length;
            this.paginateFavorites(this.pagination.break_point);
            $('#paj-show-less').show();
            $('#paj-show-all').hide();
        },
        showLessFavorites: function () {
            this.pagination.break_point = this.pagination.default_break_point;
            this.paginateFavorites();
            $('#paj-show-less').hide();
            $('#paj-show-all').show();
        },
        tallyFavorites: function () {
            // Refactor Note: Move to Favorites obj
            // Used after removing/adding favorites to the DOM during API
            // responses. Not useful when inside a folder view.
            var i, folders, tally, totalFaves;

            totalFaves = $('#favorites > li.favorite').length;

            folders = $('#folder-list > li');

            for (i = 0; i < folders.length; i += 1) {
                // Use the folder-set list from the favorites list items to
                // tally the favorite counts.
                tally = $('#favorites')
                    .find('li.favorite')
                        .find('ul.folder-set')
                            .find('li[id$="folder-' +
                                $(folders[i]).data('id') + '"]')
                                .length;

                $(folders[i]).find('.count').text('(' + tally + ')');

            }
            $('section.favorites header').find('.count')
                .text('(' + totalFaves + ')');
        },
        countFolders: function () {
            // This function checks for the total number of folders
            // available. It requires the DOM to be fully loaded. It
            // should be refactored to get the count from the API instead.
            var totalFolders = $('#folder-list > li').length;

            return totalFolders;
        },
        refreshMyFaves: function () {
            // Refactor Note: Kill this method.
            this.paginateFavorites();
            // This only works when all favorites are loaded into the DOM.
            // Getting favorite counts from API responses instead. At least for
            // now.
            //this.tallyFavorites();
        },
        // Refactor Note: Make these *modular* & not just obj properties
        //-- Start Modals
        NewFolder: {
            initialize: function () {
                var newFolderForm;
                _.bindAll(this);
                this.root = PBSLM.Favorites;

                newFolderForm = this.root.Templates.newFolderForm();

                this.$el = $(this.root.Templates.modal({
                    modalBody: newFolderForm,
                    modalId: 'newFolderModal',
                    modalTitle: 'Add Folder',
                    modalBtnPrimary: 'Save',
                    modalBtnSecondary: 'Cancel'
                }));

                this.$el.modal();
                this.shimBackend();
                this.events();
            },
            events: function () {
                var createFolder = _.bind(this.createFolder, this);

                // Please keep callback logic to bare minimum.
                this.$el
                    .on('click', '.btn-primary', function (event) {
                        event.preventDefault();
                        createFolder();
                    });
            },
            createFolder: function () {
                var data = {
                    name: $.trim(this.$el.find('#id_name')[0].value),
                    description: this.$el.find('#id_description')[0].value,
                    parent: this.$el.find('#id_parent')[0].value
                };
                if (!data.name) {
                    throw ('[ERROR] PBSLM.Favorites.NewFolder.createFolder: ' +
                        '"name" contains no data');
                }
                this.root.updateMyFaves(this.root.endpoints.newFolder, data,
                    this.handleNewFolderSubmission);
            },
            handleNewFolderSubmission: function (response) {
                if (response.status === 'form_error') {
                    var input = this.$el.find('#id_name');

                    input.closest('p').addClass('control-group error');
                    input.siblings('label').addClass('control-label');
                } else {
                    var $listItem = this.root.Templates.folderListItem(response.folder);

                    $('#folder-list').append($listItem);
                    $('#folder-list > li').tsort({
                        attr: 'data-name',
                        order: $('#folder-sorter').data('sort-order')
                    });

                    if($('#folder-list-main-content').length > 0) {
                        $('#folder-list-main-content').append($listItem);
                    }

                    // Yellow flag: Do we have to re-bind the entire list of root
                    // events? Can we cherry-pick certain ones to re-bind? Maybe
                    // those events should live in the view-object
                    // (e.g. PBSLM.Favorites.EditFolder)
                    //
                    // Update: this is happening in pieces
                    this.root.events();

                    // If the folder count is 1, we have just added the first
                    // folder. The controls must be refreshed to reflect the change
                    // in folder count.
                    this.root.MyFavesControls.confirmChecked();

                    this.$el.modal('hide');
                }
            },
            shimBackend: function () {
                // This fixes issues on the client that should be followed-up
                // with proper fixes in the backend and removed.

                // Fields & labels that are no longer used
                var hideables = [
                    'input[name="shared_with_class"]',
                    'label[for="id_shared_with_class"]',
                    'input[name="shared_with_colleagues"]',
                    'label[for="id_shared_with_colleagues"]'
                ];
                this.$el.find(hideables.toString()).hide();

            }
        },
        EditFolder: {
            initialize: function (folderId) {
                var self;
                _.bindAll(this);
                this.root = PBSLM.Favorites;
                self = this;

                // $el relies on HTML obtained from this XHR
                $.getJSON(this.root.endpoints.editFolder +
                    "?folder_pk=" + folderId, function (response) {
                        self.handleFormResponse(response);
                    });

            },
            handleFormResponse: function (response) {
                this.$el = $(this.root.Templates.modal({
                    modalBody: '<form id="edit-folder">' + response.form + '</form>',
                    modalId: 'editFolderModal',
                    modalTitle: 'Edit Folder',
                    modalBtnPrimary: 'Save',
                    modalBtnSecondary: 'Cancel'
                }));

                this.$el.modal();
                this.shimBackend();
                this.events();
            },
            events: function () {
                var self = this;

                // Please keep callback logic to bare minimum.
                this.$el
                    .on('click', '.btn-primary', function (event) {
                        event.preventDefault();
                        self.editFolder();
                    });
            },
            editFolder: function () {
                var data = {
                    name: this.$el.find('#id_name')[0].value,
                    description: this.$el.find('#id_description')[0].value,
                    folder_pk: this.$el.find('input[name="folder_pk"]')[0]
                        .value,
                    parent: this.$el.find('#id_parent')[0].value
                };
                if (this.$el.find('#confirm-delete-folder')[0].checked) {
                    data['delete'] = this.$el.find('#confirm-delete-folder')[0]
                        .checked;
                }

                if (!data.name) {
                    throw ('[ERROR] PBSLM.Favorites.NewFolder.createFolder: ' +
                        '"name" contains no data');
                }
                this.root.updateMyFaves(this.root.endpoints.editFolder, data,
                    this.handleEditFolderSubmission);
            },
            handleEditFolderSubmission: function(response) {
                var pk = response.pk,
                    name = this.$el.find('#id_name')[0].value,
                    description = this.$el.find('#id_description')[0].value;

                var folderInMain = $('#folder-list-main-content').find('li[data-id=' + pk + ']'),
                    linkInMain = folderInMain.find('a[data-id=' + pk + ']'),
                    descriptionInMain = folderInMain.find('div.main-content');

                var folderInAside = $('#folder-list').find('li[data-id=' + pk + ']'),
                    linkInAside = folderInAside.find('a[data-id=' + pk + ']')

                linkInMain.text(name);
                linkInAside.text(name);
                descriptionInMain.text(description);

                this.$el.modal('hide');
            },
            shimBackend: function () {
                // This fixes issues on the client that should be followed-up
                // with proper fixes in the backend and removed.

                // Fields & labels that are no longer used
                var hideables = [
                    'input[name="delete"]',
                    'label[for="confirm-delete-folder"]',
                    'input[name="shared_with_class"]',
                    'label[for="id_shared_with_class"]',
                    'input[name="shared_with_colleagues"]',
                    'label[for="id_shared_with_colleagues"]'
                ];
                this.$el.find(hideables.toString()).hide();

            }
        },
        CopyShareLink: {
            initialize: function (url) {
                _.bindAll(this);
                this.root = PBSLM.Favorites;
                this.link = 'http://www.pbslearningmedia.org' + url + '/';

                this.$el = $(this.root.Templates.modal({
                    modalBody: 'Copy the link below<br/>' +
                        '<div id="share-folder"><input type="text" value="' + this.link + '"></div>',
                    modalId: 'copyShareLinkModal',
                    modalTitle: 'Custom Folder Link',
                    modalBtnPrimary: '',
                    modalBtnSecondary: 'Close'
                }));

                this.$el.find('.btn-primary').hide();

                this.$el.modal();
                this.events();
            },
            events: function () {
                var self = this;

                // Please keep callback logic to bare minimum.
                this.$el
                    .on('focus', 'input[type="text"]', function (event) {
                        event.preventDefault();
                        this.select();

                        // Work around Chrome's little problem of losing the
                        // selection on mouseup.
                        this.onmouseup = function () {
                            // Prevent further mouseup intervention
                            this.onmouseup = null;
                            return false;
                        };
                    });
            }
        },
        NewFavorite: { // I.E. Add an External Link
            initialize: function () {
                _.bindAll(this);

                var newFavoriteForm;

                this.root = PBSLM.Favorites;
                newFavoriteForm = this.root.Templates.newFavoriteForm();

                this.$el = $(this.root.Templates.modal({
                    modalBody: newFavoriteForm,
                    modalId: 'newFavoriteModal',
                    modalTitle: 'Add a favorite external link',
                    modalBtnPrimary: 'Save',
                    modalBtnSecondary: 'Cancel'
                }));

                this.$el.modal();
                this.shimBackend();
                this.events();
            },
            events: function () {
                var self = this;

                // Please keep callback logic to bare minimum.
                this.$el
                    .on('click', '.btn-primary', function (event) {
                        event.preventDefault();
                        self.createFavorite();
                    });
            },
            createFavorite: function () {
                var data = {
                        title: this.$el.find('#id_title')[0].value,
                        external_link: this.$el.find('#id_external_link')[0].value,
                        notes: this.$el.find('#id_notes')[0].value,
                        folder_id: this.$el.find('#id_folder_id')[0].value
                    },
                    errors = [],
                    validUrl = /(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

                /* Title should not be blank */
                if (!data.title) {
                    this.$el.find('#id_title').closest('.control-group').addClass('error');
                    errors.push('title');
                } else {
                    this.$el.find('#id_title').closest('.control-group').removeClass('error');
                }

                /* Notes should have at most 260 characters*/
                if(data.notes.length >260){
                    this.$el.find('#id_notes').closest('.control-group').addClass('error');
                    this.$el.find('label[for=id_notes').siblings('.help-inline').text(' must have at most 260 characters');
                    errors.push('notes');
                }else{
                    this.$el.find('#id_notes').closest('.control-group').removeClass('error');
                }

                /* External Link should not be blank and should be a valid link */
                if (!data.external_link || !validUrl.test(data.external_link)) {
                    this.$el.find('#id_external_link').closest('.control-group').addClass('error');
                    this.$el.find('label[for=id_external_link]').siblings('.help-inline').text('should be valid');
                    errors.push('external_link');
                } else {
                    this.$el.find('#id_external_link').closest('.control-group').removeClass('error');
                }

                /* Proceed if no errors are present */
                if (errors.length === 0) {
                    this.root.updateMyFaves(this.root.endpoints.newFavorite, data,
                        this.handleNewFavoriteSubmission);
                }
            },
            handleNewFavoriteSubmission: function (response) {
                this.$el.modal('hide');

                // This would need to return all the new favorite data in order
                // to add it to the DOM, just reload for now.
                window.location.reload(true);
            },
            shimBackend: function () {
                // This fixes issues on the client that should be followed-up
                // with proper fixes in the backend and removed.

                var hideables = [
                    'input[name="shared_with_class"]',
                    'label[for="id_shared_with_class"]',
                    'input[name="shared_with_colleagues"]',
                    'label[for="id_shared_with_colleagues"]'
                ];
                this.$el.find(hideables.toString()).hide();

            }
        },
        FolderSelection: {
            // Only handles one folder at a time.
            initialize: function () {
                var folderList, folderMenuList;
                this.root = PBSLM.Favorites;

                folderList = this.root.utils.extractObjects(
                    $('#folder-list > li'),
                    ['id', 'name']
                );

                folderMenuList = this.root.Templates.folderMenuList(
                    {folders: folderList}
                );

                this.$selectedFavorites = $('#favorites .selector:checked')
                    .parents('.favorite');
                this.$el = $(this.root.Templates.modal({
                    modalBody: folderMenuList,
                    modalId: 'folderModal',
                    modalTitle: 'Select a folder',
                    modalBtnPrimary: '',
                    modalBtnSecondary: ''
                }));
                this.selectedFavoriteIds = this.root.utils
                    .extractData(this.$selectedFavorites, 'id');

                this.$el.find('.modal-footer').hide();
                this.$el.modal();
                this.events();
            },
            events: function () {
                var self = this;

                // Please keep callback logic to bare minimum.
                this.$el
                    .on('click', 'li', function (event) {
                        event.preventDefault();
                        self.addToFolder($(this).data('id'),
                            self.selectedFavoriteIds);
                    })
                    .on('hide', function () {
                        // reset checkboxes
                        $(':checkbox').attr('checked', false);
                        self.root.MyFavesControls.confirmChecked();
                    });
            },
            addToFolder: function (folderId, favoriteIds) {
                var self, data;

                self = this;
                data = {
                    folder_pk: folderId,
                    // The API expects an array-looking string
                    fav_ids: '[' + favoriteIds.toString() + ']'
                };
                this.root.updateMyFaves(this.root.endpoints.addToFolder, data,
                    function (response) {
                        self.handleAddToFolder(response);
                    });
                this.$el.modal('hide');
            },
            handleAddToFolder: function (response) {
                var i, $folderSet, $folder;

                for (i = 0; i < response.fav_ids.length; i += 1) {
                    // Make sure we're not adding duplicates
                    if ($('#favorite-' + response.fav_ids[i] +
                            '-folder-' + response.folder.pk).length === 0) {

                        $folderSet = $('#favorite-' + response.fav_ids[i])
                            .find('ul.folder-set');
                        $folder = this.root.Templates
                            .favoriteFolderItem({
                                favoriteId: response.fav_ids[i],
                                folderId: response.folder.pk,
                                folderName: response.folder.name
                            });

                        $folderSet.append($folder);
                    }

                }
                // Now that we have new elements, need to re-initialize the
                // folder set.
                this.root.FavoritesFolderSet.initialize();

                // Update favorite counts
                $('section.favorites')
                    .find('header')
                        .find('.count')
                            .text('(' + response.all_favorites_count + ')');
                $('#folder-item-' + response.folder.pk).find('.count')
                    .text('(' + response.folder.favorites_count + ')');


            }
        },
        // Refactor Note: The two Deleters are VERY similar
        FolderDeleter: {
            initialize: function () {
                this.root = PBSLM.Favorites;
                this.selectedFolderIds = this.root.utils
                    .extractData($('#folder-list-main-content ' +
                        '.selector:checked').parents('li.folder'), 'id');

                this.$el = $(this.root.Templates.modal({
                    modalBody: 'Once you delete the selected folders, you ' +
                        'will not be able to undo this action. The resources ' +
                        'in your folders will remain in your favorites. Are ' +
                        'you sure you would like to delete these folders? ',
                    modalId: 'deleteModal',
                    modalTitle: 'Delete Selected Folders?',
                    modalBtnPrimary: 'Yes, Delete',
                    modalBtnSecondary: 'No, Cancel'
                }));

                this.$el.modal();
                this.events();
            },
            events: function () {
                var self = this;

                // Please keep callback logic to bare minimum.
                this.$el
                    .on('click', '.btn-primary', function (event) {
                        event.preventDefault();
                        self.deleteFolders();
                    })
                    .on('hide', function () {
                        // reset checkboxes
                        $(':checkbox').attr('checked', false);
                        self.root.MyFavesControls.confirmChecked();
                    });
            },
            deleteFolders: function () {
                var data, i;
                data = {
                    // The API expects an array-looking string
                    folder_ids: '[' + this.selectedFolderIds.toString() + ']'
                };
                this.root.updateMyFaves(this.root.endpoints.deleteFolders,
                    data);
                for (i = 0; i < this.selectedFolderIds.length; i += 1) {
                    $('.folder[data-id=' + this.selectedFolderIds[i] + ']')
                        .remove();
                }
                // Refactor Note: this is kind of a shim, probably a better
                // way of handling deleting a folder when on that folder's
                // page.

                this.$el.modal('hide');
                this.root.refreshMyFaves();

                if (typeof window.history.pushState != 'undefined') {
                    window.history.pushState("", "Favorites", "/favorites");
                } else {
                    setTimeout(function() {
                        window.location.href = '/favorites';
                    }, 300);
                }
            }
        },
        // Refactor Note: Deleter & Remover share a lot of things
        FavoriteDeleter: {
            initialize: function () {
                this.root = PBSLM.Favorites;
                this.selectedFavoriteIds = this.root.utils
                    .extractData($('#favorites .selector:checked')
                        .parents('.favorite'), 'id');

                this.$el = $(this.root.Templates.modal({
                    modalBody: 'Once you delete the selected resource from ' +
                        'your favorites, you will not be able to undo this ' +
                        'action. Are you sure you would like to delete these ' +
                        'resources from your favorites?',
                    modalId: 'deleteModal',
                    modalTitle: 'Delete Selected Resources From Favorites?',
                    modalBtnPrimary: 'Yes, Delete',
                    modalBtnSecondary: 'No, Cancel'
                }));

                this.$el.modal();
                this.events();
            },
            events: function () {
                var self = this;

                // Please keep callback logic to bare minimum.
                this.$el
                    .on('click', '.btn-primary', function (event) {
                        event.preventDefault();
                        self.deleteFavorites();
                    })
                    .on('hide', function () {
                        // reset checkboxes
                        $(':checkbox').attr('checked', false);
                        self.root.MyFavesControls.confirmChecked();
                    });
            },
            deleteFavorites: function () {
                var data, i;
                data = {
                    // The API expects an array-looking string
                    fav_ids: '[' + this.selectedFavoriteIds.toString() + ']'
                };
                this.root.updateMyFaves(this.root.endpoints.deleteFavorites,
                    data);
                for (i = 0; i < this.selectedFavoriteIds.length; i += 1) {
                    $('#favorite-' + this.selectedFavoriteIds[i]).remove();
                }
                this.$el.modal('hide');
                this.root.refreshMyFaves();
                // disabled in refreshMyFaves, will need to sort out
                this.root.tallyFavorites();

            }
        },
        FavoriteRelationRemover: {
            // Refactor Note: This shares init steps with FavoriteDeleter and
            // methods with FavoritesFolderSet.
            initialize: function () {
                _.bindAll(this);
                this.root = PBSLM.Favorites;
                this.selectedFavoriteIds = this.root.utils
                    .extractData($('#favorites .selector:checked')
                        .parents('.favorite'), 'id');

                this.$el = $(this.root.Templates.modal({
                    modalBody: 'Once you the selected resources from this ' +
                        'folder, you will not be able to undo this action. ' +
                        'The selected resources will remain in your ' +
                        'favorites. Are you sure you would like to remove ' +
                        'these resources from this folder?',
                    modalId: 'deleteModal',
                    modalTitle: 'Remove Selected Resources From Folder?',
                    modalBtnPrimary: 'Yes, Delete',
                    modalBtnSecondary: 'No, Cancel'
                }));

                this.$el.modal();
                this.events();
            },
            events: function () {
                var self = this;

                // Please keep callback logic to bare minimum.
                this.$el
                    .on('click', '.btn-primary', function (event) {
                        event.preventDefault();
                        self.deleteFolderAssociation();
                    })
                    .on('hide', function () {
                        // reset checkboxes
                        $(':checkbox').attr('checked', false);
                        self.root.MyFavesControls.confirmChecked();
                    });
            },
            deleteFolderAssociation: function () {
                var data = {
                    // The API expects an array-looking string
                    fav_ids: '[' + this.selectedFavoriteIds.toString() + ']',
                    folder_pk: this.root.currentFolder.pk
                };
                this.root.updateMyFaves(this.root.endpoints.removeFromFolder,
                    data, this.handleDeleteFolderAssociation);
            },
            handleDeleteFolderAssociation: function (response) {
                // Loop thru the fav_ids in the API response and remove from
                // the DOM.
                var i;

                for (i = 0; i < response.fav_ids.length; i += 1) {
                    $('#favorite-' + response.fav_ids[i]).remove();
                }

                $('#folder-item-' + response.folder.pk).find('.count')
                    .text('(' + response.folder.favorites_count + ')');

                this.$el.modal('hide');
                this.root.refreshMyFaves();
            }
        },
        // End Modals --//
        SortableList: {
            initialize: function (el, endpoint) {
                var self, $el;

                self = this;
                $el = $(el);

                this.root = PBSLM.Favorites;
                this.endpoint = endpoint;

                $el.sortable({
                    //axis: 'y',  //locking to axis makes it hard to see
                    handle: $('.handle'),
                    update: function (event, ui) {
                        self.saveSort(event, ui);
                    }
                });
            },
            saveSort: function (event, ui) {
                // Using the DOM list items, make a hash of favorite id (stored
                // in) a data attribute and its current index in the list. Then
                // pass on to updateFavorite.

                var data = {};

                $('#favorites > .favorite').each(function () {
                    var $this = $(this);
                    data[$this.data('id')] = $this.index();
                });

                this.root.updateMyFaves(this.endpoint, data);
            }
        },
        FavoritesFolderSet: {
            initialize: function () {
                _.bindAll(this);
                this.root = PBSLM.Favorites;
                this.$el = $('#favorites > li').find('.folder-set');

                this.events();
            },
            events: function () {
                var self = this;

                this.$el.find('.delete')
                    .on('click', function (event) {
                        event.preventDefault();
                        self.deleteFolderAssociation(
                            $(this).data('favorite-id'),
                            $(this).data('folder-id')
                        );
                    });
            },
            deleteFolderAssociation: function (favoriteId, folderId) {
                var data = {
                    // The API expects an array-looking string
                    fav_ids: '[' + favoriteId + ']',
                    folder_pk: folderId
                };
                this.root.updateMyFaves(this.root.endpoints.removeFromFolder,
                    data, this.handleDeleteFolderAssociation);
            },
            handleDeleteFolderAssociation: function (response) {
                // The response data returns favorite ids in an array, but its
                // length should always be 1 in this case. To be safe, looping
                // thru that array to remove items from DOM instead of
                // referencing just subscript 0 (e.g. data.fav_ids[0])
                var i;

                for (i = 0; i < response.fav_ids.length; i += 1) {
                    $('#favorite-' + response.fav_ids[i] + '-folder-' +
                        response.folder.pk).remove();

                    // Be sure to remove the favorite item if your on that
                    // folder's favorites page.
                    //
                    // The div.main only has an id with the folder's pk if it's
                    // a folder page. Determined in the base_favorites.html
                    // template.
                    $('#folder-' + response.folder.pk)
                        .find('#favorite-' + response.fav_ids[i]).remove();
                }

                $('#folder-item-' + response.folder.pk).find('.count')
                    .text('(' + response.folder.favorites_count + ')');

                this.root.refreshMyFaves();

            }
        },
        Notes: {
            initialize: function () {
                _.bindAll(this);
                this.root = PBSLM.Favorites;
                this.$el = $('#favorites .notes');

                this.events();
            },
            events: function () {
                var self = this;

                this.$el.find('textarea')
                    .on('focus', function (event) {
                        event.preventDefault();

                        self.enableSave($(this).parent('.notes'));
                    })
                    .on('blur', function (event) {
                        event.preventDefault();

                        self.saveNote({
                            fav_id: $(this).parent('.notes').data('id'),
                            notes: this.value
                        });
                    });
            },
            saveNote: function (data) {
                var self = this;
                this.root.updateMyFaves(this.root.endpoints.editFavorite, data,
                    function (response) {
                        self.disableSave(response.favorite.pk);
                    });
            },
            enableSave: function ($target) {
                var self = this;

                $target.find('h2 > .ico-save')
                    .removeClass('saved')
                    .on('click', function (event) {
                        event.preventDefault();

                        self.saveNote({
                            fav_id: $target.data('id'),
                            notes: $target.find('textarea')[0].value
                        });
                    });
            },
            disableSave: function (favoriteId) {
                $('#favorite-' + favoriteId)
                    .find('.notes')
                    .find('.ico-save')
                    .addClass('saved')
                    .unbind('click');
            }
        },
        FolderManager: {
            initialize: function () {
                // This module replaces the favorites list in the main content
                // well with the folders list. The favorites list is cached
                // prior to its removal from the DOM so the two can be swapped
                // without another request to the server if we choose to do so.
                // The folders list is simply a clone of the one used in the
                // side controller, exposing extra data stored in its data
                // attributes when the page is first loaded.

                var $main, $smallFolderList;

                _.bindAll(this);
                this.root = PBSLM.Favorites;
                $smallFolderList = $('#folder-list');
                // Be sure to keep the id unique
                this.$el = $smallFolderList.clone().attr('id',
                    $smallFolderList.attr('id') + '-main-content');
                $main = $('#main-content');

                // Make a deep copy of main favorites list in case we need it
                // for later. Store at root level.
                this.root.$mainFavoritesList =
                    $main.clone('#favorites-container');

                $main.find('#favorites-container')
                    .replaceWith(this.$el);

                this.root.MyFavesControls.initialize('manageFolders');

                // Hide date sort options until we add created date to folders.
                // Note that every view that uses the favorites list does a
                // full page load so there is no need to show() the items.
                $('#favorites-sorter-head')
                    .find('input[value^="date"]')
                    .parents('li').hide();

                this.events();

                // Let the world know we're ready
                $(window).trigger('foldermanagerready');
            },
            events: function () {
                var self = this;
                this.$el.find('.edit')
                    .on('click', function (event) {
                        event.preventDefault();
                        self.root.EditFolder
                            .initialize($(event.target).data('id'));
                    });
                this.$el
                    .on('click', '.share', function (event) {
                        event.preventDefault();
                        self.root.CopyShareLink
                            .initialize($(this).data('url'));
                    });
            }
        },
        MyFavesControls: {
            initialize: function (context) {
                var config;
                this.root = PBSLM.Favorites;
                this.context = context;

                // Specifies which control config to use. Value must be the
                // config.contexts property name as a string (eg 'allFolders').
                //
                // Sleep-deprived solution for handling which control box to
                // use on page load.
                if (!this.context) {
                    if (this.root.currentFolder.name !== '') {
                        this.context = 'singleFolder';
                    } else {
                        this.context = 'allFolders';
                    }
                }

                this.$el = $('#list-header');

                config = {
                    contexts: {
                        allFolders: {
                            content: {
                                type: 'favorites',
                                pk: null,
                                heading: 'All Favorites',
                                description: null
                            },
                            controls: {
                                addToFolders: true,
                                deleteResource: true,
                                addALink: true
                            }
                        },
                        singleFolder: {
                            content: {
                                type: 'favorites',
                                pk: PBSLM.Favorites.currentFolder.pk,
                                heading: PBSLM.Favorites.currentFolder.name,
                                description: PBSLM.Favorites.currentFolder
                                    .description
                            },
                            controls: {
                                addToFolders: true,
                                removeResource: true,
                                addALink: true
                            }
                        },
                        manageFolders: {
                            content: {
                                type: 'folders',
                                pk: null,
                                heading: 'Manage Folders',
                                description: null
                            },
                            controls: {
                                deleteFolders: true
                            }
                        }
                    },
                    ddData: [
                        {
                            text: "Newest to Oldest",
                            value: 'date-created-desc',
                            selected: false
                        },
                        {
                            text: "Oldest to Newest",
                            value: 'date-created-asc',
                            selected: false
                        },
                        {
                            text: "Name A-Z",
                            value: 'name-asc',
                            selected: false
                        },
                        {
                            text: "Name Z-A",
                            value: 'name-desc',
                            selected: false
                        }
                    ]
                };

                // When calling the template, favoritesMgmtCtrls, you must
                // specify which buttons to render. The options can be found in
                // the station_site/favorites/js_templates.html template.
                this.$el
                    .empty()
                    .append(PBSLM.Favorites.Templates
                        .myFavesControlBox(config.contexts[this.context].content))
                    .find('#myfaves-controls')
                        .append(PBSLM.Favorites.Templates
                            .favoritesMgmtCtrls(config.contexts[this.context]
                                .controls));

                this.$el.find('.favorites-sorter').ddslick({
                    data: config.ddData,
                    background: '#fff',
                    selectText: 'Select one...',
                    width: 133,
                    onSelected: function (data) {
                        $('#favorites-sorter-head').trigger('change', data);
                    }
                });

                this.events();
                this.confirmChecked();

                // Refactor Note: Shouldn't have to call root.events()
                this.root.events();
            },
            events: function () {
                var root, self;
                root = PBSLM.Favorites;
                self = this;

                $('#favorites-sorter-head')
                    .on('change', function (event, param) {
                        var arr, key, order, $parent;

                        // The order is tagged onto the select box's value
                        // with a dash, e.g. 'date-created-asc' Pop that
                        // order flag off and rejoin the remaining array
                        // as the sort key.

                        arr = param.selectedData.value.split('-');
                        order = arr.pop();
                        key = arr.join('-');
                        $parent = $(this).parents('#myfaves-controls');

                        // switches the target li of the sort
                        if ($parent.attr('class').indexOf('folders') >= 0) {
                            root.sortFolders(key, order);
                        } else {
                            root.sortFavorites(key, order);
                        }

                    });
                this.$el.find('.controls.favorites #selectall')
                    .unbind('click')
                    .on('click', function () {
                        $('#favorites').find('.selector').attr('checked',
                            this.checked);
                    });
                this.$el.find('.controls.folders #selectall')
                    .unbind('click')
                    .on('click', function () {
                        $('#folder-list-main-content').find('.selector').attr('checked',
                            this.checked);
                    });
                $('#add-new-folder')
                    .unbind('click')
                    .on('click', function (event) {
                        event.preventDefault();
                        if (!$(this).hasClass('disabled')) {
                            root.NewFolder.initialize();
                        }
                    });
                $('#add-a-link')
                    .unbind('click')
                    .on('click', function (event) {
                        event.preventDefault();
                        if (!$(this).hasClass('disabled')) {
                            root.NewFavorite.initialize();
                        }
                    });
                $('#add-to-folders')
                    .unbind('click')
                    .on('click', function (event) {
                        event.preventDefault();
                        if (!$(this).hasClass('disabled')) {
                            root.FolderSelection.initialize();
                        }
                    });
                $('#delete-resource')
                    .unbind('click')
                    .on('click', function (event) {
                        event.preventDefault();
                        if (!$(this).hasClass('disabled')) {
                            root.FavoriteDeleter.initialize();
                        }
                    });
                $('#remove-resource')
                    .unbind('click')
                    .on('click', function (event) {
                        event.preventDefault();
                        if (!$(this).hasClass('disabled')) {
                            root.FavoriteRelationRemover.initialize();
                        }
                    });
                $('#delete-folders')
                    .unbind('click')
                    .on('click', function (event) {
                        event.preventDefault();
                        if (!$(this).hasClass('disabled')) {
                            root.FolderDeleter.initialize();
                        }
                    });
                $('#favorites .selector')
                    .unbind('click')
                    .on('click', function (event) {
                        $('#selectall').attr('checked',
                            !$('#favorites .selector')
                                .not(':checked').length);
                        self.confirmChecked();
                    });
                $('#folder-list-main-content .selector')
                    .unbind('click')
                    .on('click', function (event) {
                        $('#selectall').attr('checked',
                            !$('#folder-list-main-content .selector')
                                .not(':checked').length);
                    });
                $('.folders')
                    .on('click', '.selector', function () {
                        self.confirmChecked();
                    });
                $('#selectall')
                    .on('click', function () {
                        self.confirmChecked();
                    });
            },
            confirmChecked: function () {
                // Refactored the following code into a function so it
                // can be called more easily
                if ($('.selector').is(':checked')) {
                    $('#delete-resource, #remove-resource')
                        .removeClass('disabled');
                    var numberOfFolders = this.root.countFolders();
                    if (numberOfFolders>0) {
                        $('#add-to-folders, #delete-folders')
                            .removeClass('disabled');
                    } else {
                        $('#add-to-folders, #delete-folders')
                            .addClass('disabled');
                    }
                } else {
                    $('#add-to-folders, #delete-resource, ' +
                            '#remove-resource, #delete-folders')
                        .addClass('disabled');
                }
            }
        },
        Guide: {
            // Uses Bootstrap Tooltip JS.
            // This module was previousy using popovers rather than tooltips.
            // This module was added VERY last-minute. I'm sure there is plenty
            // of room for improvement.
            // Tooltips are defined as data-attributes in the HTML.
            // To create a new tooltip, dupe one of the run-once conditionals
            // in events below, then update the data-attributes on the selector.
            // Don't forget to do $(selector).tooltip(); on it also!
            initialize: function () {
                this.events();
            },
            events: function () {
                // Bind to initGuide so we don't have to deal with 'this'
                // contexts in the event handlers
                var initGuide, guidersRead;

                initGuide = _.bind(this.initGuide, this);
                guidersRead = [];

                // Check for existing read guiders in cookie
                if ($.cookie('pbslm.guiders_read') !== undefined) {
                    guidersRead = $.cookie('pbslm.guiders_read').split(',');
                }

                // Need to move logic from event handlers into reusable methods
                $(window)
                    .on('guiderclosed', function (event) {

                        // Make sure the current guider isn't already there.
                        if (!_.contains(guidersRead, event.guiderId)) {
                            guidersRead.push(event.guiderId.toString());
                        }

                        // no expiry date makes this a session cookie
                        $.cookie('pbslm.guiders_read', guidersRead);

                        if (event.guiderId.indexOf('a.edit.folder') >= 0) {
                            initGuide('#folder-list-main-content a.share:first');
                        }
                    })
                    // regardless of whether or not the GUIDE tooltips have
                    // displayed, activate the REGULAR tooltips.
                    .on('foldermanagerready', function (event) {
                        $('#folder-list-main-content a.edit.folder:first').tooltip();
                        $('#folder-list-main-content a.share:first').tooltip();
                    });
                $('#manage-folders-link').tooltip();
                // Run-once enforcement of tooltips using cookie.
                if (!_.contains(guidersRead, '#manage-folders-link')) {
                    $(document)
                        .on('ready', function () {
                            // A slight delay will help catch the user's eye and
                            // make sure all heights are properly calculated for
                            // the tooltip's position.
                            _.delay(initGuide, 400, '#manage-folders-link');
                        });
                }
                if (!_.contains(guidersRead,
                        '#folder-list-main-content a.edit.folder:first')) {
                    $(window)
                        .on('foldermanagerready', function () {
                            $('#manage-folders-link').tooltip('hide');
                            // A slight delay will help catch the user's eye and
                            // make sure all heights are properly calculated for
                            // the tooltip's position.
                            _.delay(initGuide, 400,
                                '#folder-list-main-content a.edit.folder:first');
                        });
                }
                if (!_.contains(guidersRead,
                        '#folder-list-main-content a.share:first')) {
                    $(window)
                        .on('editguiderclosed', function () {
                            // A slight delay will help catch the user's eye and
                            // make sure all heights are properly calculated for
                            // the tooltip's position.
                            _.delay(initGuide, 400,
                                '#folder-list-main-content a.share:first');
                        });
                }
            },
            initGuide: function (selector) {
                var $el = $(selector);

                $el.tooltip('show');

                // here's the delay
                setTimeout(function (){
                    var event;

                    $el.tooltip('hide');

                    // Bootstrap Popover doesn't dispatch any
                    // events of its own.
                    event = $.Event('guiderclosed');
                    // guiderId can be any selector that returns 1 item
                    event.guiderId = selector;
                    $(window).trigger(event);

                 }, 3000);
            }

        },
        Templates: {
            // moved to django template for precompiling where possible
        }
    };

}());
