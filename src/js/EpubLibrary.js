define([
'./ModuleConfig',
'jquery',
'bootstrap',
'bootstrapA11y',
'StorageManager',
'biblemesh_Settings',
'./EpubLibraryManager',
'i18nStrings',
'hgn!readium_js_viewer_html_templates/library-navbar.html',
'hgn!readium_js_viewer_html_templates/library-body.html',
'hgn!readium_js_viewer_html_templates/empty-library.html',
'hgn!readium_js_viewer_html_templates/library-item.html',
'hgn!readium_js_viewer_html_templates/details-dialog.html',
'hgn!readium_js_viewer_html_templates/about-dialog.html',
'hgn!readium_js_viewer_html_templates/details-body.html',
'hgn!readium_js_viewer_html_templates/add-epub-dialog.html',
'./ReaderSettingsDialog',
'./Dialogs',
'./workers/Messages',
'Analytics',
'./Keyboard',
'./versioning/ReadiumVersioning',
'readium_shared_js/helpers',
'readium_shared_js/biblemesh_helpers'],

function(
moduleConfig,
$,
bootstrap,
bootstrapA11y,
StorageManager,
Settings,
libraryManager,
Strings,
LibraryNavbar,
LibraryBody,
EmptyLibrary,
LibraryItem,
DetailsDialog,
AboutDialog,
DetailsBody,
AddEpubDialog,
SettingsDialog,
Dialogs,
Messages,
Analytics,
Keyboard,
Versioning,
Helpers,
biblemesh_Helpers){

    var detailsDialogStr = DetailsDialog({strings: Strings});

    var heightRule,
        noCoverRule;
        //maxHeightRule

    var findHeightRule = function(){

         var styleSheet=document.styleSheets[0];
         var ii=0;
         var cssRule;
        do {
            if (styleSheet.cssRules) {
                cssRule = styleSheet.cssRules[ii];
            } else {
                cssRule = styleSheet.rules[ii];
            }
            if (cssRule && cssRule.selectorText)  {
                if (cssRule.selectorText.toLowerCase()=='.library-item') {
                    heightRule = cssRule;
                }
                // else if (cssRule.selectorText.toLowerCase()=='.library-item img') {
                //     maxHeightRule = cssRule;
                // }
                else if (cssRule.selectorText.toLowerCase() == 'body:not(.list-view) .library-item .no-cover'){
                    noCoverRule = cssRule;
                }

            }
            ii++;
        } while (cssRule);
       }


    var setItemHeight = function(){
        if (!heightRule || !noCoverRule) return;

        var medWidth = 2,
            smWidth = 3,
            xsWidth = 4,
            rowHeight = 0,
            imgWidth = 0,
            scale = 1;

        var winWidth = window.innerWidth;

        if (winWidth >= 992){
            imgWidth = winWidth * (medWidth/12) - 30;
            rowHeight = 1.33 * imgWidth + 60;
        }
        else if (winWidth >= 768){
            imgWidth = winWidth * (smWidth/12) - 30;
            rowHeight = 1.33 * imgWidth + 60;
        }
        else{
            imgWidth = winWidth * (xsWidth/12) - 30;
            rowHeight = 1.33 * imgWidth + 20;
        }
        heightRule.style.height  = rowHeight + 'px';
        scale = imgWidth/300;

        noCoverRule.style.width = imgWidth + 'px';
        noCoverRule.style.height = 1.33 * imgWidth + 'px';
        noCoverRule.style.fontSize = 40 * scale + 'px';
        //maxHeightRule.style.height = 1.33 * imgWidth + 'px';
        //maxHeightRule.style.width = imgWidth + 'px';
    };

    var showDetailsDialog = function(details){
        var bodyStr = DetailsBody({
            data: details,
            strings: Strings,
            isadmin: Settings.getUserAttr('isAdmin') // biblemesh_
        });

        $('.details-dialog .modal-body').html(bodyStr);

        $('.details-dialog .delete').on('click', function(){
            biblemesh_confirmDelete(details);
        });
    }

    var biblemesh_confirmDelete = function(details) {
        $('.details-dialog').modal('hide');
        var success = function(){
            libraryManager.retrieveAvailableEpubs(loadLibraryItems);
            Dialogs.closeModal();
        }

        var promptMsg = Strings.i18n_are_you_sure + ' \'' + details.title + '\'';

        Dialogs.showModalPrompt(Strings.delete_dlg_title, promptMsg,
                                Strings.i18n_delete, Strings.i18n_cancel,
                                function(){
                                    Dialogs.showModalProgress(Strings.delete_progress_title, '');
                                    Dialogs.updateProgress(100, Messages.PROGRESS_DELETING, details.title, true);
                                    // libraryManager.deleteEpubWithId(details.rootDir, success, showError)   // biblemesh_
                                    biblemesh_deleteEpub(details, success, showError);
                                });
    }

    var showError = function(errorCode, data){
        Dialogs.showError(errorCode, data);
    }

    var loadDetails = function(e){
        var $this = $(this),
            url = $this.attr('data-package'),
            bookRoot = $this.attr('data-root'),
            rootDir = $this.attr('data-root-dir'),
            noCoverBg = $this.attr('data-no-cover');
            title = $this.closest('.title').attr('title');  // biblemesh_

        $('.details-dialog').remove();

        $('.details-dialog').off('hidden.bs.modal');
        $('.details-dialog').off('shown.bs.modal');

        $('#app-container').append(detailsDialogStr);
        
        $('#details-dialog').on('hidden.bs.modal', function () {
            Keyboard.scope('library');

            // setTimeout(function(){ $this.focus(); }, 50);  biblemesh_ commented
        });
        $('#details-dialog').on('shown.bs.modal', function(){
            Keyboard.scope('details');
            // setTimeout(function(){ $('#closeEpubDetailsCross')[0].focus(); }, 1000);  biblemesh_ commented
        });


        $('.details-dialog').modal();
        
        var retrieveDetails = function(packageUrl) {
            
            if (!packageUrl || packageUrl.indexOf(".opf") < 0) {
                console.warn("no package path (OPF within zipped EPUB archive?): " + packageUrl);
            }
            
            libraryManager.retrieveFullEpubDetails(packageUrl, bookRoot, rootDir, noCoverBg, showDetailsDialog, function(errorCode, data) {
                // biblemesh_
                $('#details-dialog').remove();
                $('.modal-backdrop').remove();
                Dialogs.showModalPrompt(
                    Strings.err_unknown,
                    Strings.biblemesh_corrupt_epub,
                    Strings.i18n_delete,
                    Strings.ok,
                    function() {
                        biblemesh_confirmDelete({
                            title: title,
                            rootUrl: bookRoot
                        });
                    }
                );
            });
        };
        
        console.log("OPF package URL: " + url);
        if (url && url.indexOf(".opf") < 0) {
            
            var urlContainerXml = url + "META-INF/container.xml"; 
            $.get(urlContainerXml, function(data){
    
                if(typeof(data) === "string" ) {
                    var parser = new window.DOMParser;
                    data = parser.parseFromString(data, 'text/xml');
                }
                var $rootfile = $('rootfile', data);
                var rootFilePath = $rootfile.attr('full-path');
                console.log("OPF package path (root-file from container.xml): " + rootFilePath);
                
                var packageUrl = url + (Helpers.EndsWith(url, "/") ? "" : "/") + rootFilePath;
            
                console.log("OPF package URL (from container.xml): " + packageUrl);
                retrieveDetails(packageUrl);
    
            }).fail(function() {
                //console.warn(arguments);
                console.error("FAILED OPF package URL (from container.xml): " + urlContainerXml);
                retrieveDetails(url);
            });
        }
        else {
            retrieveDetails(url);
        }
    }

    var loadLibraryItems = function(epubs){
        try { ga('send', 'pageview', window.location.pathname); } catch(e) {} // biblemesh_

        $('#app-container .library-items').remove();
        $('#app-container').append(LibraryBody({}));
        if (!epubs.length){
            $('#app-container .library-items').append(EmptyLibrary({imagePathPrefix: moduleConfig.imagePathPrefix, strings: Strings}));
            return;
        }
        
        var processEpub = function(epubs, count) {
            var epub = epubs[count];
            if (!epub) { // count >= epubs.length
                $('.details').on('click', loadDetails);
                return;
            }

            var noCoverBackground = moduleConfig.imagePathPrefix + 'images/covers/cover' + ((count % 8) + 1) + '.jpg';
            if (epub.isSubLibraryLink) {
                noCoverBackground = moduleConfig.imagePathPrefix + 'images/covers/cover2.jpg';
            }
            
            var createLibraryItem = function() {

                // See --COMMENT-- below!
                // if (!epub.isSubLibraryLink && !epub.packagePath) {
                //     console.warn("no epub.packagePath (OPF within zipped EPUB archive?): " + epub.rootUrl);
                //     //console.log(epub);
                // }
                
                $('.library-items').append(LibraryItem({count:{n: count+1, tabindex:count*2+99}, epub: epub, strings: Strings, noCoverBackground: noCoverBackground}));
                
                processEpub(epubs, ++count);
            };
            
            if (!epub.isSubLibraryLink && !epub.packagePath) {
                
                createLibraryItem();
                
                // --COMMENT--
                // Code below works, but just here to demonstrate how the package OPF path can be resolved whilst populating the library view. Because the HTTP requests for each ebook introduce huge lag, instead we resolve the OPF path on-demand, when user chooses to see the EPUB details / metadata dialog popup (see loadDetails() function above, which itself emits an HTTP request to get the actual OPF file XML payload, via LibraryManager.retrieveFullEpubDetails())
                // $.get(epub.rootUrl + "/META-INF/container.xml", function(data){
        
                //     if(typeof(data) === "string" ) {
                //         var parser = new window.DOMParser;
                //         data = parser.parseFromString(data, 'text/xml');
                //     }
                //     var $rootfile = $('rootfile', data);
                //     epub.packagePath = $rootfile.attr('full-path');
                
                //     createLibraryItem();
        
                // }).fail(function() {
                //     //console.warn(arguments);
                //     createLibraryItem();
                // });
            }
            else {
                createLibraryItem();
            }
        };
        processEpub(epubs, 0);
    }

    var readClick = function(e){
        var urlParams = biblemesh_Helpers.getURLQueryParams();
        //var ebookURL = urlParams['epub'];
        var libraryURL = urlParams['epubs'];
        var embedded = urlParams['embedded'];
            
        var ebookURL = $(this).attr('data-book');
        if (ebookURL) {
            var eventPayload = {embedded: embedded, epub: ebookURL, epubs: libraryURL};
            $(window).triggerHandler('readepub', eventPayload);
        }
        else {
            var libURL = $(this).attr('data-library');
            if (libURL) {
                
                // TODO: this doesn't work, so we refresh the whole page, bypassing pushState (replaceState is used instead after reload)
                // libraryManager.resetLibraryData();
                // var eventPayload = libURL;
                // $(window).triggerHandler('loadlibrary', eventPayload);
                            
                var URLPATH =
                window.location ? (
                    window.location.protocol
                    + "//"
                    + window.location.hostname
                    + (window.location.port ? (':' + window.location.port) : '')
                    // + window.location.pathname  biblemesh_
                    + '/'
                ) : 'index.html'
                ;
                
                var url = URLPATH + '?epubs=' + encodeURIComponent(libURL);
                
                window.location = url;
            } else {
                var linkURL = $(this).attr('data-link');
                if (linkURL) {
                    window.open(linkURL, '_blank');
                }
            }
        }
        return false;
    }

    var unloadLibraryUI = function(){

        // needed only if access keys can potentially be used to open a book while a dialog is opened, because keyboard.scope() is not accounted for with HTML access keys :(
        Dialogs.closeModal();
        Dialogs.reset();
        $('.modal-backdrop').remove();

        Keyboard.off('library');
        Keyboard.off('settings');

        $('#settings-dialog').off('hidden.bs.modal');
        $('#settings-dialog').off('shown.bs.modal');

        $('#about-dialog').off('hidden.bs.modal');
        $('#about-dialog').off('shown.bs.modal');

        $('#add-epub-dialog').off('hidden.bs.modal');
        $('#add-epub-dialog').off('shown.bs.modal');

        $('.details-dialog').off('hidden.bs.modal');
        $('.details-dialog').off('shown.bs.modal');

        $(window).off('resize');
        $(document.body).off('click');
        $(window).off('storageReady');
        $('#app-container').attr('style', '');
    }

    var promptForReplace = function(originalData, replaceCallback, keepBothCallback){
        Settings.get('replaceByDefault', function(val){
            if (val === 'true'){
                replaceCallback()
            }
            else{
                keepBothCallback();
            }
        })
    }

    var handleLibraryChange = function(){
        Dialogs.closeModal();
        libraryManager.retrieveAvailableEpubs(loadLibraryItems);
    }

    var importZippedEpub = function(file) {
        
        if (!window.Blob || !window.File) return;
        
        if (!(file instanceof Blob) || !(file instanceof File)) return;
        
        
        var title = Strings.import_dlg_title + " [ " + file.name + " ]";
        Dialogs.showModalProgress(title, Strings.import_dlg_message);

        libraryManager.handleZippedEpub({
            file: file,
            overwrite: promptForReplace,
            success: handleLibraryChange,
            progress: Dialogs.updateProgress,
            error: showError
        });
    };

    var importZippedEpubs_CANCELLED = false;
    var importZippedEpubs = function(files, i) {
    
        if (!window.Blob || !window.File) return;

         if (i == 0) { // first call
            importZippedEpubs_CANCELLED = false;
        } else {
            if (importZippedEpubs_CANCELLED) {
                
                handleLibraryChange();

                setTimeout(function(){
                    Dialogs.showModalMessage(Strings.i18n_add_book, Strings.i18n_cancel + " - " + Strings.import_dlg_title);
                }, 800);
                
                return; // break the iteration
            }
        }
        
        if (i >= files.length) { // last call
            handleLibraryChange();
            return;
        }

        var nextImportEPUB = function() {
            setTimeout(function(){
                //Dialogs.closeModal();
                //Dialogs.reset(); // ? (costly DOM mutations)
                importZippedEpubs(files, ++i); // next
            }, 100); // time for the Web Worker to die (background unzipping)
        };

        var file = files[i];

        if (!(file instanceof Blob) || !(file instanceof File)) {

            nextImportEPUB();

            return;
        }

        var fileInfo = " [ " + file.name + " ] "+(i+1)+"/"+(files.length)+"";
        var title = Strings.import_dlg_title + fileInfo;
        if (i == 0) { // first call
            Dialogs.showModalProgress(title, Strings.import_dlg_message, function() {
                importZippedEpubs_CANCELLED = true;
                Dialogs.updateModalProgressTitle("(" + Strings.i18n_cancel + ") " + title);
            });
        } else {
            Dialogs.updateModalProgressTitle(title);
        }

        Dialogs.updateProgress(0, Messages.PROGRESS_EXTRACTING, file.name);

        libraryManager.handleZippedEpub({
            file: file,
            overwrite: promptForReplace,
            success: function() {

                nextImportEPUB();
            },
            progress: Dialogs.updateProgress,
            error: function(errorCode, data) {
                
                // TODO: collapse multiple errors into a single user prompt 
                //showError(errorCode, data);

                var msg = Strings.err_unknown;
                switch(errorCode){
                    case Messages.ERROR_PACKAGE_PARSE:
                        Dialogs.updateModalProgressTitle(Strings.err_epub_corrupt + fileInfo);
                        //Dialogs.showErrorWithDetails(Strings.err_epub_corrupt, data);
                        return;
                    case Messages.ERROR_STORAGE:
                        msg = Strings.err_storage;
                        break;
                    case Messages.ERROR_EPUB:
                        msg = Strings.err_epub_corrupt;
                        break;
                    case Messages.ERROR_AJAX:
                        msg = Strings.err_ajax;
                        break;
                    default:
                        msg = Strings.err_unknown;
                        console.trace();
                        break;
                }
                Dialogs.updateModalProgressTitle(Strings.err_dlg_title + " (" + msg + ")" + fileInfo);
                //Dialogs.showModalMessage(Strings.err_dlg_title, msg);
                
                setTimeout(function(){
                    nextImportEPUB();
                }, 500); // short error report, then let's move to the next item.
            }
        });
    };

    var biblemesh_deleteEpub = function(details, success){
        var bookId = parseInt(details.rootUrl.replace(/^.*book_([0-9]+)$/, '$1'));
        
        $.ajax({
            url: location.origin + '/book/' + bookId,
            method: 'DELETE',
            success: function() {
                console.log("Delete successful.");
                libraryManager.libraryData.some(function(book, idx) {
                    if(book.id == bookId) {
                        libraryManager.libraryData.splice(idx, 1);
                        return true;
                    }
                });
                if(success) success();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                var response = jqXHR.responseJSON;
                var errorMsg = Strings[response.errorType] || response.error || response.errorType || Strings.err_ajax;
                Dialogs.showModalMessageEx(Strings.err_dlg_title, errorMsg);
            }
        });

    }

    var biblemesh_handleFileSelect = function(evt){

        var files = evt.target.files;
        var fileArray = [];
        var resultArray = [];

        $.each(files, function(key, value) {
            fileArray.push([key, value]);
        });

        $('#closeAddEpubCross').trigger('click');
        Dialogs.showModalProgress(Strings.biblemesh_import_books, Strings.biblemesh_uploading);

        var doImport = function() {

            var file = fileArray.shift();

            if(file) {

                var result = {
                    filename: file[1].name,
                }
                var data = new FormData();
                data.append(file[0], file[1]);

                Dialogs.updateProgress(0, Messages.BIBLEMESH_UPLOAD, file[1].name);

                $.ajax({
                    url: location.origin + '/importbook.json',
                    type: 'POST',
                    data: data,
                    cache: false,
                    dataType: 'json',
                    processData: false, // Don't process the files
                    contentType: false, // Set content type to false as jQuery will tell the server its a query string request
                    xhr: function() {  // Custom XMLHttpRequest
                        var myXhr = $.ajaxSettings.xhr();
                        if(myXhr.upload){ // Check if upload property exists
                            myXhr.upload.addEventListener('progress',function(e) {
                                console.log(e);
                                var uploadPercent = (e.loaded / e.total) * 100;
                                Dialogs.updateProgress(
                                    uploadPercent,
                                    uploadPercent >= 100 ? Messages.BIBLEMESH_PROCESSING : Messages.BIBLEMESH_UPLOAD,
                                    file[1].name
                                );
                            }, false); // For handling the progress of the upload
                        }
                        return myXhr;
                    },
                    success: function(response) {
                        if(typeof response.bookId !== 'undefined') {
                            result.bookId = response.bookId;
                        }
                        resultArray.push(result);
                        doImport();
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        var response = jqXHR.responseJSON;
                        result.error = Strings[response.errorType] || response.error || response.errorType || Strings.err_ajax;
                        resultArray.push(result);
                        doImport();
                    }
                });

            } else {

                //give the report
                Dialogs.showModalMessageEx(Strings.biblemesh_import_done, resultArray.map(function(result) {
                    if(typeof result.error !== 'undefined') {
                        return result.filename + " — ERROR: " + result.error;
                    } else {
                        return result.filename + " " + Strings.biblemesh_successful.replace('BOOK_ID', result.bookId);
                    }
                }).join("<br>"));
                
                delete libraryManager.libraryData;
                libraryManager.retrieveAvailableEpubs(loadLibraryItems);

            }

        }

        doImport();

    }

    var handleFileSelect = function(evt){
        $('#add-epub-dialog').modal('hide');
                
        if (evt.target.files.length > 1) {
            importZippedEpubs(evt.target.files, 0);
            return;
        }

        var file = evt.target.files[0];
        importZippedEpub(file);
    }

    var handleDirSelect = function(evt){
        var files = evt.target.files;
        $('#add-epub-dialog').modal('hide');
        Dialogs.showModalProgress(Strings.import_dlg_title, Strings.import_dlg_message);
        libraryManager.handleDirectoryImport({
            files: files,
            overwrite: promptForReplace,
            success: handleLibraryChange,
            progress: Dialogs.updateProgress,
            error: showError
        });
    }
    
    var handleUrlSelect = function(){
        var url = $('#url-upload').val();
        $('#add-epub-dialog').modal('hide');
        Dialogs.showModalProgress(Strings.import_dlg_title, Strings.import_dlg_message);
        libraryManager.handleUrlImport({
            url: url,
            overwrite: promptForReplace,
            success: handleLibraryChange,
            progress: Dialogs.updateProgress,
            error: showError
        });
    }

    var importEpub = function(ebook) {
        // TODO: also allow import of URL and directory select
        // See libraryManager.canHandleUrl() + handleUrlSelect()
        // See libraryManager.canHandleDirectory() + handleDirSelect()
        
        if (Array.isArray(ebook)) {
            importZippedEpubs(ebook, 0);
            return;
        }

        importZippedEpub(ebook);
    };

    var doMigration = function(){
        Dialogs.showModalProgress(Strings.migrate_dlg_title, Strings.migrate_dlg_message);
        libraryManager.handleMigration({
            success: function(){
                
                // Note: automatically JSON.stringify's the passed value!
                Settings.put('needsMigration', false, $.noop);

                handleLibraryChange();
            },
            progress: Dialogs.updateProgress,
            error: showError
        });
    }

    var loadLibraryUI = function(){

        Dialogs.reset();

        Keyboard.scope('library');

        Analytics.trackView('/library');
        var $appContainer = $('#app-container');
        $appContainer.empty();
        SettingsDialog.initDialog();
        
        $appContainer.append(AddEpubDialog({
            canHandleUrl : libraryManager.canHandleUrl(),
            canHandleDirectory : libraryManager.canHandleDirectory(),
            strings: Strings
        }));
        
        Versioning.getVersioningInfo(function(version){
            $appContainer.append(AboutDialog({imagePathPrefix: moduleConfig.imagePathPrefix, strings: Strings, dateTimeString: version.dateTimeString, viewerJs: version.readiumJsViewer, readiumJs: version.readiumJs, sharedJs: version.readiumSharedJs, cfiJs: version.readiumCfiJs}));
        });


        $('#about-dialog').on('hidden.bs.modal', function () {
            Keyboard.scope('library');

            // setTimeout(function(){ $("#aboutButt1").focus(); }, 50);  biblemesh_ commented
        });
        $('#about-dialog').on('shown.bs.modal', function(){
            Keyboard.scope('about');
        });

        $('#add-epub-dialog').on('hidden.bs.modal', function () {
            Keyboard.scope('library');

            // setTimeout(function(){ $("#addbutt").focus(); }, 50);  biblemesh_ commented
        });
        $('#add-epub-dialog').on('shown.bs.modal', function(){
            Keyboard.scope('add');

            $('#add-epub-dialog input').val('');

            // setTimeout(function(){ $('#closeAddEpubCross')[0].focus(); }, 1000);  biblemesh_ commented
        });
        $('#url-upload').on('keyup', function(){
            var val = $(this).val();
            if (val && val.length){
                $('#add-epub-dialog .add-book').prop('disabled', false);
            }
            else{
                $('#add-epub-dialog .add-book').prop('disabled', true);
            }
        });
        $('.add-book').on('click', handleUrlSelect);
        $('nav').empty();
        $('nav').attr("aria-label", Strings.i18n_toolbar);
        var idpId = Settings.getUserAttr('idpId');  // biblemesh_
        var idpName = Settings.getUserAttr('idpName');  // biblemesh_
        var idpAssetsBaseUrl = Settings.getUserAttr('idpAssetsBaseUrl');  // biblemesh_
        $('nav').append(LibraryNavbar({
            strings: Strings,
            dialogs: Dialogs,
            keyboard: Keyboard,
            idp_logo_src: idpAssetsBaseUrl + 'logo-' + idpId + '.png',  // biblemesh_
            reader_txt: Settings.getUserAttr('idpUseReaderTxt') ? Strings.biblemesh_reader : "",  // biblemesh_
            idp_name: idpName,  // biblemesh_
            idp_first_letter_of_name: idpName.substr(0,1),  // biblemesh_
            idp_small_logo_src: idpAssetsBaseUrl + 'small-logo-' + idpId + '.png',  // biblemesh_
            logout_of_idp: Settings.getUserAttr('idpNoAuth') ? Strings.biblemesh_refresh : (Strings.biblemesh_logout_of + idpName),  // biblemesh_
            view_usage: Strings.biblemesh_usage_costs,  // biblemesh_
            firstname: Settings.getUserAttr('firstname')  // biblemesh_
        }));
        if(!Settings.getUserAttr('isAdmin')) {  // biblemesh_
            $('#navusagecosts').remove();
            $('#addbutt').remove();
        }
        var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if(iOS) {
            $('.icon-list-view, #addbutt').remove();
        }
        $('.icon-list-view').on('click', function(){
            $(document.body).addClass('list-view');
            // setTimeout(function(){ $('.icon-thumbnails')[0].focus(); }, 50);  biblemesh_ commented
        });
        $('.icon-thumbnails').on('click', function(){
            $(document.body).removeClass('list-view');
            // setTimeout(function(){ $('.icon-list-view')[0].focus(); }, 50);  biblemesh_ commented
        });
        findHeightRule();
        setItemHeight();
        StorageManager.initStorage(function(){
            libraryManager.retrieveAvailableEpubs(loadLibraryItems);
        }, showError);

        // biblemesh_ : following event
        $('#navusersettings').on('click', function(){
            $('#settings-dialog').modal("show");
        });

        // biblemesh_ : following event commented out
        // Keyboard.on(Keyboard.ShowSettingsModal, 'library', function(){$('#settings-dialog').modal("show");});

        $(window).trigger('libraryUIReady');
        $(window).on('resize', setItemHeight);

        var setAppSize = function(){
            var appHeight = $(document.body).height() - $('#app-container')[0].offsetTop;
            $('#app-container').height(appHeight);
        }
        $(window).on('resize', setAppSize);
        $('#app-container').css('overflowY', 'auto');

        setAppSize();
        $(document.body).on('click', '.read', readClick);
        $('#epub-upload').on('change', biblemesh_handleFileSelect);
        $('#dir-upload').on('change', handleDirSelect);

        document.title = Strings.i18n_readium_library;

        $('#settings-dialog').on('hidden.bs.modal', function () {

            Keyboard.scope('library');

            // setTimeout(function(){ $("#settbutt1").focus(); }, 50);  biblemesh_ commented

            $("#buttSave").removeAttr("accesskey");
            $("#buttClose").removeAttr("accesskey");
        });
        $('#settings-dialog').on('shown.bs.modal', function () {

            Keyboard.scope('settings');

            $("#buttSave").attr("accesskey", Keyboard.accesskeys.SettingsModalSave);
            $("#buttClose").attr("accesskey", Keyboard.accesskeys.SettingsModalClose);
        });

        var isChromeExtensionPackagedApp_ButNotChromeOS = (typeof chrome !== "undefined") && chrome.app
            && chrome.app.window && chrome.app.window.current // a bit redundant?
            && !/\bCrOS\b/.test(navigator.userAgent);

        // test whether we are in the Chrome app.  If so, put up the dialog and whine at the users...
        if (isChromeExtensionPackagedApp_ButNotChromeOS) {
            setTimeout(function() {
                Dialogs.showModalHTML(Strings.i18n_ChromeApp_deprecated_dialog_title, Strings.i18n_ChromeApp_deprecated_dialog_HTML);
            }, 800);
        }

        //async in Chrome
        Settings.get("needsMigration", function(needsMigration){
            if (needsMigration){
                doMigration();
            }
        });
    }

    var applyKeyboardSettingsAndLoadUi = function(data)
    {
        if (data && data.epubs && (typeof data.epubs == "string")) {
            
            // this is normally init'ed at page launch using the "epubs" URL GET query parameter,
            // but needs manually setting when using pushState() to refresh the page contents with a different library source 
            moduleConfig.epubLibraryPath = data.epubs;
        }
        
        // override current scheme with user options
        Settings.get('reader', function(json)
        {
           Keyboard.applySettings(json);

           loadLibraryUI();
           
           if (data && data.importEPUB) { // File/Blob, possibly Array
               importEpub(data.importEPUB);
           }
        });
    };
    window.setReplaceByDefault = function(replace){
        // Note: automatically JSON.stringify's the passed value!
        Settings.put('replaceByDefault', String(replace));
    }
    return {
        loadUI : applyKeyboardSettingsAndLoadUi,
        unloadUI : unloadLibraryUI,
        importEpub : importEpub 
    };
});
