/*globals PBSLM, alert*/
(function (document) {
    'use strict';

    /**
     * Initialize Browse by Standards functionality
     *
     * @return {null}
     */
    function init () {
        var SITE_URL = PBSLM.BBStandards.SITE_URL,
            $ = PBSLM.DOMUtils.query,
            typeStandards = $('#type_standards'),
            authoritiesSection = $('#authorities_section'),
            authorities = $('#authorities'),
            documents = $('#documents'),
            error = $('#error'),
            browse = $('#browse'),
            keyword = $('#keyword'),
            loadingImage = $('#LoadingImage'),
            standards = $('#standards'),
            genericErrorMessage = 'Sorry but there was an error processing your request!',
            sS = sessionStorage;

        /**
         * Auto select the proper option for Type of Standards
         */
        typeStandards.selectedIndex = PBSLM.BBStandards.stype;

        if (String(typeStandards.value) === String(PBSLM.BBStandards.st_type)) {
            authoritiesSection.style.display = '';
        } else {
            authoritiesSection.style.display = 'none';
        }

        /**
         * Add new options to select elements
         *
         * @param {object} select
         * @param {object} options JSON object from XHR
         * @param {string} type    Default text for the 1st option
         */
        function addOptionsToSelect (select, options, type) {
            var html = '<option value="0">-- Select ' + type + ' --</option>',
                l = options.length,
                i = 0;

            for (; i < l; i++) {
                if (type === 'Authority' && options[i].guid === PBSLM.BBStandards.VIRGINIA_GUID) {
                    html += '<option value="' + options[i].id + '">US Virgin Islands</option>';
                } else {
                    html += '<option value="' + options[i].id + '">' + options[i].title + '</option>';
                }
            }

            select.innerHTML = html;
        }

        /**
         * Get all checked checkboxes with a given name
         *
         * @param  {string} name
         * @return {array}
         */
        function getCheckedBoxes (name) {
            var checkboxes = document.getElementsByName(name),
                checked = [],
                i = 0,
                l = checkboxes.length;

            for (; i< l; i++) {
                if (checkboxes[i].checked) {
                    checked.push(checkboxes[i].value);
                }
            }

            return checked;
        }

        /**
         * Handle change event for Type of Standards select
         *
         * @return {null}
         */
        typeStandards.onchange = function typeStandardsChange () {
            var stype = this.value,
                atype = authorities.value,
                url = SITE_URL + 'change_standard_type/' + stype + '/' + atype + '/',
                json;

            if (history.pushState) {
                history.pushState('', document.title, '/standards/' + stype);
            }

            sS.setItem('stype', typeStandards.selectedIndex);

            PBSLM.DOMUtils.get(
                url,
                function success (response) {
                    json = JSON.parse(response);

                    addOptionsToSelect(documents, json.documents, 'Document');
                    addOptionsToSelect(authorities, json.authorities, 'Authority');
                    if (String(typeStandards.value) === String(PBSLM.BBStandards.st_type)) {
                        authoritiesSection.style.display = '';
                    } else {
                        authoritiesSection.style.display = 'none';
                    }
                    error.innerText = '';
                },
                function fail () {
                    error.innerText = genericErrorMessage;
                }
            );
        };

        PBSLM.DOMUtils.trigger(typeStandards, 'change');

        /**
         * Handle change event for Authorities select
         *
         * @return {null}
         */
        authorities.onchange = function authoritiesChange () {
            var stype = typeStandards.value,
                atype = this.value,
                url = SITE_URL + 'change_standard_type/' + stype + '/' + atype + '/',
                json;

            sS.setItem('atype', authorities.selectedIndex);

            PBSLM.DOMUtils.get(
                url,
                function success (response) {
                    json = JSON.parse(response);

                    addOptionsToSelect(documents, json.documents, 'Document');

                    error.innerText = '';
                },
                function fail () {
                    error.innerText = genericErrorMessage;
                }
            );
        };

        PBSLM.DOMUtils.trigger(authorities, 'change');

        /**
         * Handle change event for Documents select
         *
         * @return {null}
         */
        documents.onchange = function documentsChange () {
            sS.setItem('dtype', documents.selectedIndex);
        };

        /**
         * Handle click event on Browse button
         *
         * @return {null}
         */
        browse.onclick = function browseClick () {
            var stype = typeStandards.value,
                atype = authorities.value,
                dtype = documents.value,
                key = keyword.value,
                grades = '',
                url;

            if (stype === PBSLM.BBStandards.st_type && atype === '0') {
                alert('Please select an authority!');
            }

            if (dtype === '0'){
                alert('Please select a document!');
            } else {
                loadingImage.style.display = '';

                grades = getCheckedBoxes('selected_facets').join('_') || '_';

                url = SITE_URL + 'browse/' + stype + '/' + dtype + '/' + grades + '/';

                if (key) {
                    url += '?keyword=' + encodeURIComponent(key);
                }
                updateStandards(url);
            }
        };

        /**
         * Update Standards div
         *
         * @param  {string} url
         * @return {null}
         */
        function updateStandards (url) {
            PBSLM.DOMUtils.get(
                url,
                function success (response) {
                    error.innerText = '';

                    standards.innerHTML = response;

                    PBSLM.DOMUtils.onClickForEach('paginator', paginatorClick);
                    PBSLM.DOMUtils.onClickForEach('chevron-icon ', chevronClick);
                },
                function fail () {
                    error.innerText = genericErrorMessage;
                },
                function always () {
                    loadingImage.style.display = 'none';
                }
            );
        }

        /**
         * Handle Paginator link click
         *
         * @return {null}
         */
        function paginatorClick (e) {
            e.preventDefault();

            loadingImage.style.display = '';
            standards.innerHTML = '';

            updateStandards(this.href);
        }

        /**
         * Handle Chevron icon click
         *
         * @return {null}
         */
        function chevronClick () {
            var parent = PBSLM.DOMUtils.closestByClass(this, 'border-top'),
                children = parent.getElementsByClassName('children')[0];

            if (children.innerHTML === '') {
                PBSLM.DOMUtils.get(
                    parent.getAttribute('data-url'),
                    function success (response) {
                        children.innerHTML = response;
                    },
                    function fail () {
                        children.innerHTML = '<div class="pbscustom browse-by-standards-selection-title">Error loading nodes.</div>';
                    }
                );
            }

            PBSLM.DOMUtils.slideToggle(children);

            this.classList.toggle('icon-chevron-down');
            this.classList.toggle('icon-chevron-right');
        }

        /**
         * Repopulate select inputs when coming back to the page
         *
         * @return {null}
         */
        (function setup () {
            var stype = sS.getItem('stype'),
                atype = sS.getItem('atype'),
                dtype = sS.getItem('dtype');

            if (stype === '0') {
                return;
            }

            if (atype && atype !== '0') {
                setTimeout(function () {
                    authorities.selectedIndex = atype;
                }, 100);
            }

            if (dtype && dtype !== '0') {
                setTimeout(function () {
                    documents.selectedIndex = dtype;
                }, 200);
            }
        }());
    } // init

    PBSLM.DOMUtils.ready(init);

}(document));
