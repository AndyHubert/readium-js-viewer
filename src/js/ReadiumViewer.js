define(['jquery', './EpubLibrary', './EpubReader', 'readium_shared_js/helpers', 'readium_shared_js/biblemesh_helpers', 'URIjs', 'biblemesh_Settings', 'i18nStrings', './Dialogs'], function ($, EpubLibrary, EpubReader, Helpers, biblemesh_Helpers, URI, Settings, Strings, Dialogs) {

    var _initialLoad = true; // replaces pushState() with replaceState() at first load 
    var initialLoad = function () {

        if (typeof Raven != 'undefined') Raven.config('https://0569beced42c4b068367c8d47cfddf36@sentry.io/144504').install()

        Settings.initialize(function () {  // biblemesh_ : this wrapper is new

            Settings.patchFromLocalStorage(function () {  // biblemesh_ : this wrapper is new

                var urlParams = biblemesh_Helpers.getURLQueryParams();

                var ebookURL = urlParams['epub'];
                var libraryURL = urlParams['epubs'];
                var embedded = urlParams['embedded'];
                var biblemesh_widget = !!urlParams['widget'];

                // we use triggerHandler() so that the pushState logic is invoked from the first-time open 

                if (biblemesh_widget) {
                    $(document.body).addClass("widget");
                }

                if (ebookURL) {
                    //EpubReader.loadUI(urlParams);
                    var eventPayload = { embedded: embedded, epub: ebookURL, epubs: libraryURL, widget: biblemesh_widget ? '1' : '' };
                    $(window).triggerHandler('readepub', eventPayload);
                }
                else {
                    //EpubLibrary.loadUI({epubs: libraryURL});
                    var eventPayload = libraryURL;
                    $(window).triggerHandler('loadlibrary', eventPayload);
                }

                $(document.body).on('click', function () {
                    $(document.body).removeClass("keyboard");
                });

                $(document).on('keyup', function (e) {
                    $(document.body).addClass("keyboard");
                });

                $(document).on('keydown', function (e) {
                    if (e.keyCode === 9 || e.which === 9) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (document.activeElement) {
                            document.activeElement.blur();
                        }
                        return;
                    }
                });

                // biblemesh_ : The following block has been added
                var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
                var idpExpire = Settings.getUserAttr('idpExpire');
                if (idpExpire) {
                    var hours_until_expire = parseInt((idpExpire - new Date().getTime()) / (1000 * 60 * 60));
                    var time_until_expire;
                    if (hours_until_expire < 1) {
                        time_until_expire = Strings.biblemesh_less_than_an_hour;
                    } else if (hours_until_expire < 48) {
                        time_until_expire = Strings.biblemesh_num_hours
                            .replace('NUMBER', hours_until_expire);
                    } else {
                        time_until_expire = Strings.biblemesh_num_days
                            .replace('NUMBER', parseInt(hours_until_expire / 24));
                    }
                    var demo_reader2_text = Strings.biblemesh_demo_reader2
                        .replace('TIME_UNTIL_EXPIRE', time_until_expire);
                    Dialogs.showModalMessageEx(
                        Strings.biblemesh_demo_reader,
                        '<p>' + Strings.biblemesh_demo_reader1b + '</p>' +
                        '<p>' + '<span class="emphasize">' + demo_reader2_text + '</span> ' + Strings.biblemesh_demo_reader3 + '</p>' +
                        '' // '<p>' + Strings.biblemesh_demo_reader4 + '</p>'
                    );
                } else if (isAndroid) {
                    Settings.get('alertedToAndroidApp', function (val) {
                        if (!val) {
                            Dialogs.showModalPrompt(
                                Strings.biblemesh_android_app,
                                Strings.biblemesh_about_the_app,
                                Strings.biblemesh_get_the_app,
                                Strings.biblemesh_no_thanks,
                                function () {
                                    window.open('https://play.google.com/store/apps/details?id=com.biblemesh.ereader&hl=en');
                                }
                            );

                            //set localstorage variable so they are only alerted once.
                            Settings.put('alertedToAndroidApp', true);
                        }
                    })
                }
            });

        }, function () {
            Dialogs.showErrorWithDetails(Strings.err_dlg_title, Strings.biblemesh_no_user_setup);
        });

    };

    var pushState = $.noop;
    var replaceState = $.noop;

    var isChromeExtensionPackagedApp = (typeof chrome !== "undefined") && chrome.app
        && chrome.app.window && chrome.app.window.current; // a bit redundant?

    if (!isChromeExtensionPackagedApp // "history.pushState is not available in packaged apps"
        && window.history && window.history.pushState) {

        $(window).on('popstate', function () {

            var state = history.state;

            console.debug("BROWSER HISTORY POP STATE:");
            console.log(state);

            if (state && state.epub) {
                $('html').attr('data-theme', '');
                readerView(state);
            }
            else if (state && state.epubs) {
                $('html').attr('data-theme', 'library');
                libraryView(state.epubs);
            }
            else {
                $('html').attr('data-theme', 'library');
                libraryView();
            }
        });

        pushState = function (data, title, url) {
            console.debug("BROWSER HISTORY PUSH STATE:");
            //console.log(title);
            console.log(url);
            console.log(data);
            history.pushState(data, title, url);
        };

        replaceState = function (data, title, url) {
            console.debug("BROWSER HISTORY REPLACE STATE:");
            //console.log(title);
            console.log(url);
            console.log(data);
            history.replaceState(data, title, url);
        };
    }

    var libraryView = function (libraryURL, importEPUB) {
        $(EpubReader.tooltipSelector()).tooltip('destroy');

        EpubReader.unloadUI();
        EpubLibrary.unloadUI();

        if (libraryURL) {
            EpubLibrary.loadUI({ epubs: libraryURL });
        } else {

            EpubLibrary.loadUI({ epubs: undefined, importEPUB: importEPUB });
        }
    };

    var readerView = function (data) {
        $(EpubReader.tooltipSelector()).tooltip('destroy');

        EpubLibrary.unloadUI();
        EpubReader.unloadUI();

        EpubReader.loadUI(data);
    };

    $(window).on('readepub', function (e, eventPayload) {

        if (!eventPayload || !eventPayload.epub) return;

        var ebookURL_filepath = Helpers.getEbookUrlFilePath(eventPayload.epub);

        var epub = eventPayload.epub;
        if (epub && (typeof epub !== "string")) {
            epub = ebookURL_filepath;
        }

        ebookURL_filepath = EpubReader.ensureUrlIsRelativeToApp(ebookURL_filepath);

        var epubs = eventPayload.epubs;
        epubs = EpubReader.ensureUrlIsRelativeToApp(epubs);

        var urlState = biblemesh_Helpers.buildUrlQueryParameters(undefined, {
            epub: ebookURL_filepath,
            epubs: (epubs ? epubs : undefined),
            embedded: (eventPayload.embedded ? eventPayload.embedded : undefined),
            widget: eventPayload.widget  // biblemesh_
        });

        var func = _initialLoad ? replaceState : pushState;
        func(
            { epub: epub, epubs: epubs },
            "Reader",  // biblemesh_
            urlState
        );

        _initialLoad = false;

        readerView(eventPayload);
    });

    $(window).on('loadlibrary', function (e, eventPayload) {
        var libraryURL = undefined;
        var importEPUB = undefined;
        if (typeof eventPayload === "string") {
            libraryURL = eventPayload;
        } else { //File/Blob
            importEPUB = eventPayload;
        }

        libraryURL = EpubReader.ensureUrlIsRelativeToApp(libraryURL);

        var urlState = biblemesh_Helpers.buildUrlQueryParameters(undefined, {
            epubs: (libraryURL ? libraryURL : undefined),
            epub: " ",
            goto: " "
        });

        var func = _initialLoad ? replaceState : pushState;
        func(
            { epubs: libraryURL },
            Settings.getUserAttr('idpName') + ' ' + Strings.view_library,  // biblemesh_
            urlState
        );

        _initialLoad = false;

        libraryView(libraryURL, importEPUB);
    });

    var biblemesh_showtooltips = true;

    $(document.body).tooltip({
        selector: EpubReader.tooltipSelector(),
        placement: function (tip, element) {
            var placeValue = 'auto';
            if (element.id == 'left-page-btn') {
                placeValue = 'right';
            } else if (element.id == 'right-page-btn') {
                placeValue = 'left'
            }
            return placeValue;
        },
        container: 'body' // do this to prevent weird navbar re-sizing issue when the tooltip is inserted
    }).on('show.bs.tooltip', function (e) {
        if (!biblemesh_showtooltips) return false;

        $(EpubReader.tooltipSelector()).not(e.target).tooltip('destroy');
        var target = e.target;
        setTimeout(function () {
            $(target).tooltip('destroy');
        }, 8000);
    });

    $(document.body).on('touchstart', function () {
        biblemesh_showtooltips = false;
    });

    $(document.body).on('mouseenter', function () {
        biblemesh_showtooltips = true;
    });


    if (window.File
        //&& window.FileReader
    ) {
        var fileDragNDropHTMLArea = $(document.body);
        fileDragNDropHTMLArea.on("dragover", function (ev) {
            ev.stopPropagation();
            ev.preventDefault();

            //$(ev.target)
            fileDragNDropHTMLArea.addClass("fileDragHover");
        });
        fileDragNDropHTMLArea.on("dragleave", function (ev) {
            ev.stopPropagation();
            ev.preventDefault();

            //$(ev.target)
            fileDragNDropHTMLArea.removeClass("fileDragHover");
        });
        fileDragNDropHTMLArea.on("drop", function (ev) {
            ev.stopPropagation();
            ev.preventDefault();

            //$(ev.target)
            fileDragNDropHTMLArea.removeClass("fileDragHover");

            var files = ev.target.files || ev.originalEvent.dataTransfer.files;

            if (files.length) {

                if (isChromeExtensionPackagedApp) {

                    var filesArray = []; // files is a FileList, we prefer a more "primitive" array type
                    for (var i = 0; i < files.length; i++) {
                        filesArray.push(files[i]); // files.item(i) 
                    }
                    var arr = [];
                    arr.push(filesArray); // because jQuery triggerHandler() optionally takes a parameter Array!
                    $(window).triggerHandler('loadlibrary', arr);
                } else {

                    var file = files[0];
                    console.log("File drag-n-drop:");
                    console.log(file.name);
                    console.log(file.type);
                    console.log(file.size);

                    // if (file.type == "application/epub+zip" || (/\.epub[3?]$/.test(file.name))) {
                    if (file.type == "application/epub+zip" || (/\.epub$/.test(file.name))) {

                        var urlParams = biblemesh_Helpers.getURLQueryParams();
                        //var ebookURL = urlParams['epub'];
                        var libraryURL = urlParams['epubs'];
                        var embedded = urlParams['embedded'];

                        var eventPayload = { embedded: embedded, epub: file, epubs: libraryURL };
                        $(window).triggerHandler('readepub', eventPayload);
                    }
                }

                // var reader = new FileReader();
                // reader.onload = function(e) {

                //     console.log(e.target.result);

                //     var ebookURL = e.target.result;
                //     $(window).triggerHandler('readepub', ...);
                // }
                // reader.readAsDataURL(file);

            }
        });
    }

    $(initialLoad);
});
