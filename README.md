# Forked from readium-js-viewer for BibleMesh implementation

**EPUB reader written in HTML, CSS and Javascript.**

See the following submodule repositories:
* ( https://github.com/educational-resources-and-services/readium-js )
* ( https://github.com/educational-resources-and-services/readium-shared-js )
* ( https://github.com/educational-resources-and-services/readium-cfi-js )


## Changes to original Readium project
* An express server has been developed for facilitating a server-based library
* Works with a MySQL database
* Setup for authentication using Shibboleth
* Annotations have been changed and expanded for adding notes, copying, sharing, etc
* User data (current location + annotations) are patched to the server instead of simply being saved in localstorage
* UI and other minor changes

Note: Readium's cloud reader has been the sole focus of this project. (I.e. The chrome app and cloud reader lite have not been maintained or tested.)

See ( https://github.com/readium/readium-js ) for more extensive information relating to the original project.


## Prerequisites

<<<<<<< HEAD
* A decent terminal. On Windows, GitShell works great ( http://git-scm.com ), GitBash works too ( https://msysgit.github.io ), and Cygwin adds useful commands ( https://www.cygwin.com ).
* NodeJS ( https://nodejs.org ) **v4** (but not v5, because the installer ships with NPM v3 which seems to [have bugs](https://github.com/readium/readium-js-viewer/issues/453) related to the new flat module dependencies)
* A MySQL database with [this structure](https://github.com/educational-resources-and-services/readium-js-viewer/blob/master/ReadiumData.sql).
=======
* A decent terminal. On Windows, GitBash works great ( https://msysgit.github.io or https://git-for-windows.github.io or https://git-scm.com/download/win ), and optionally Cygwin adds useful commands ( https://www.cygwin.com ).
* NodeJS ( https://nodejs.org ) **v4+** (Note that NodeJS v6+ and NPM v3+ are now supported, including NodeJS v7+ and NPM v4+)
 * Optionally: Yarn ( https://yarnpkg.com ) **v0.23+**
>>>>>>> 4ab8dab28e7ae0a74f2b1716ea09d90f7cf399a4


## Development

### Git initialisation

* `git clone --recursive -b BRANCH_NAME https://github.com/educational-resources-and-services/readium-js-viewer.git readium-js-viewer` (replace "BRANCH_NAME" with e.g. "develop")
* `cd readium-js-viewer`
* `git submodule update --init --recursive` to ensure that the readium-js-viewer chain of dependencies is initialised (readium-js, readium-shared-js)
* `git checkout BRANCH_NAME && git submodule foreach --recursive "git checkout BRANCH_NAME"` (or simply `cd` inside each repository / submodule, and manually enter the desired branch name: `git checkout BRANCH_NAME`) Git should automatically track the corresponding branch in the 'origin' remote.


### Source tree preparation

* `npm run prepare:all` (to perform required preliminary tasks, like patching code before building)
 * OR: `yarn run prepare:yarn:all` (to use Yarn instead of NPM for node_module management)

Note that in some cases, administrator rights may be needed in order to install dependencies, because of NPM-related file access permissions (the console log would clearly show the error). Should this be the case, running `sudo npm run prepare:all` usually solves this.

Note that the above command executes the following:

* `npm install` (to download dependencies defined in `package.json` ... note that the `--production` option can be used to avoid downloading development dependencies, for example when testing only the pre-built `build-output` folder contents)
* `npm update` (to make sure that the dependency tree is up to date)
* + some additional HTTP requests to the GitHub API in order to check for upstream library updates (wherever Readium uses a forked codebase)


### ENV variables

The following ENV variables are available for configurating the app. Note that you can set ENV variables locally via the [.env file](https://github.com/educational-resources-and-services/readium-js-viewer/blob/master/.env).

Required:
* APP_URL
* RDS_HOSTNAME
* RDS_PORT
* RDS_USERNAME
* RDS_PASSWORD
* RDS_DB_NAME

Optional:
* PORT
* LOGLEVEL
* REDIS_HOSTNAME
* REDIS_PORT
* ADMIN_EMAILS
* SKIP_AUTH
* SESSION_MAXAGE
* APP_SESSION_MAXAGE
* SESSION_SECRET
* REQUIRE_HTTPS
* S3_BUCKET
* IS_DEV
* GOOGLE_ANALYTICS_CODE
* APP_PATH


### Running locally

* `npm start`


### Forking

<<<<<<< HEAD
Assuming a fork of `https://github.com/educational-resources-and-services/readium-js-viewer` is made under `USER` at `https://github.com/USER/readium-js-viewer`, the `.gitmodules` file ( https://github.com/educational-resources-and-services/readium-js-viewer/blob/develop/.gitmodules ) will still point to the original submodule URL (at `readium`, instead of `USER`). Thankfully, one can simply modify the `.gitmodules` file by replacing `https://github.com/educational-resources-and-services/` with `https://github.com/USER/`, and do this for every submodule (`readium-js-viewer` > `readium-js` > `readium-shared-js` > `readium-cfi-js`). Then the Git command `git submodule sync` can be invoked, for each submodule.
=======
Assuming a fork of `https://github.com/readium/readium-js-viewer` is made under `USER` at `https://github.com/USER/readium-js-viewer`, the `.gitmodules` file ( https://github.com/readium/readium-js-viewer/blob/develop/.gitmodules ) will still point to the original submodule URL (at `readium`, instead of `USER`). Thankfully, one can simply modify the `.gitmodules` file by replacing `https://github.com/readium/` with `https://github.com/USER/`, and do this for every submodule (`readium-js-viewer` > `readium-js` > `readium-shared-js`). Then the Git command `git submodule sync` can be invoked, for each submodule.


### Plugins integration

When invoking the `npm run build` command, the generated `build-output` folder contains RequireJS module bundles that include the default plugins specified in `readium-js/readium-js-shared/plugins/plugins.cson` (see the plugins documentation https://github.com/readium/readium-shared-js/blob/develop/PLUGINS.md ). Developers can override the default plugins configuration by using an additional file called `plugins-override.cson`. This file is git-ignored (not persistent in the Git repository), which means that Readium's default plugins configuration is never at risk of being mistakenly overridden by developers, whilst giving developers the possibility of creating custom builds on their local machines.

For example, the `annotations` plugin can be activated by adding it to the `include` section in `readium-js/readium-js-shared/plugins/plugins-override.cson`.
Then, in order to create / remove highlighted selections, simply comment `display:none` for `.icon-annotations` in the `src/css/viewer.css` file (this will enable an additional toolbar button).


## RequireJS bundle optimisation

Note that by default, compiled RequireJS bundles are minified / mangled / uglify-ed. You can force the build process to generate non-compressed Javascript bundles by setting the `RJS_UGLY` environment variable to "no" or "false" (any other value means "yes" / "true").

This may come-in handy when testing / debugging the Chrome Extension (Packaged App) in "developer mode" directly from the `dist` folder (i.e. without the sourcemaps manually copied into the script folder).
>>>>>>> 4ab8dab28e7ae0a74f2b1716ea09d90f7cf399a4


## Distribution

<<<<<<< HEAD
* `npm run dist`
  * Creates dist/cloud-reader for testing locally. In that directory, run `node app.js`.
  * Creates cloud-reader-app.zip for deploying to AWS or the like.
=======
See the `dist` folder contents (generated by `npm run dist`):

* `cloud-reader`
* `cloud-reader-lite` (same as above, without the ebook library feature)
* `chrome-app` (Google Chrome Extension / Packaged App)

The source maps are generated separately, so they are effectively an opt-in feature (simply copy/paste them next to their original Javascript file counterparts, e.g. in the `scripts` folder). The command `npm run dist+sourcemap` can be used to ensure that sourcemap files are copied across into their respective dist folders (note that this command invokes `npm run dist`).

Note that `npm run http` + `dev` folder is not the only way to test Readium "locally". The distributable / packaged Readium app in the `dist` folder can also execute in any arbitrary local HTTP server, such as the built-in NodeJS option `node node_modules/http-server/bin/http-server -a 127.0.0.1 -p 8080 -c-1 ..` (assuming the current command line folder is `readium-js-viewer`). Then, simply open the URL `http://127.0.0.1:8080/readium-js-viewer/dist/cloud-reader/index.html?epubs=http://127.0.0.1:8080/readium-js-viewer/epub_content/epub_library.opds` (or the legacy `epub_library.json` file format), which explicitely specifies the location of the ebook library (alternatively, you may copy/paste the `epub_content` folder manually under `dist/cloud-reader`, and open `http://127.0.0.1:8080/readium-js-viewer/dist/cloud-reader/index.html` without parameters). 

## Cloud reader deployment

The contents of the `cloud-reader` distribution folder (see section above) can be uploaded to an HTTP server as-is (either in the http://domain.com/ root, or any subfolder path http://domain.com/reader/),
and a child (of the parent cloud-reader folder) `epub_content/` folder is expected to contain exploded or zipped EPUBs (e.g. http://domain.com/reader/epub_content/ebook.epub or http://domain.com/epub_content/ebook/ for extracted files),
and the `epub_content/epub_library.opds` file is expected to describe the available ebooks in the online library
(see the existing examples in `readium-js-viewer` repository). Note that `epub_library.json` is the legacy format, now superseded by OPDS XML (a specialized Atom feed format). Readium supports both formats, but OPDS is recommended. The `epubs` URL query parameter can be used to specify a different location for the OPDS/JSON file that describes the ebook library contents, for example:
`http://domain.com/index.html?epubs=http://otherdomain.com/ebooks.opds` (assuming both HTTP servers are suitably configured with CORS),
or for example `http://domain.com/index.html?epubs=EPUBs/ebooks.opds` (assuming a folder named `EPUBs/` exists as a sibling of `index.html`,
and this folder contains the `ebooks.opds` file). Finally, the ebook library can be permanently set to a specific location,
by editing `cloud-reader/index.html` and by replacing the value of `epubLibraryPath`:
```javascript
require.config({
config : {
        'readium_js_viewer/ModuleConfig' : {
            'epubLibraryPath': VALUE
        }
});
```

:point_right: **Note**: It is **STRONGLY RECOMMENDED** that when deploying the CloudReader that you do not try to load packed (i.e. still zipped) EPUBs.  This is because there are (so far) insurmountable reasons why the loading of large resources (e.g. videos, etc.) will be so slow as to be unacceptable or even time out.  Instead, deployers should:

- Unpack / unzip EPUBs in remote storage, instead of serving the actual EPUB files, which will allow the assets to be streamed in the normal fashion
- De-obfuscate fonts on the server

For more info, see the document [here](https://docs.google.com/document/d/1bwv89vSmLbUs4tHOwiqyeV546k5CG3RCJ1S6_-4wvvc/edit#)

The issues associated with transmitting unencrypted fonts can be mitigated using HTTPS, HTTP_REFERER, and other web techniques designed to protect content ( e.g. http://blog.typekit.com/2009/07/21/serving-and-protecting-fonts-on-the-web )


The `cloud-reader-lite` distribution does not feature an ebook library, so EPUBs must be specified via the URL parameter (HTTP GET), for example:
`http://domain.com/index.html?epub=http://otherdomain.com/ebook.epub` (assuming both HTTP servers are suitably configured with CORS),
or for example `http://domain.com/index.html?epub=EPUBs/ebook.epub` (assuming a folder named `EPUBs/` exists as a sibling of `index.html`,
and this folder contains the `ebook.epub` file
(note that the folder name is arbitrary, and it may in fact follow the default naming convention: `epub_content/`)).

Example of Readium app hosted at *Surge*, and EPUBs hosted at *Firebase*: http://readium.surge.sh/?epubs=http://readium.firebaseapp.com/epub_content/epub_library.opds  (note that only the firebaseapp.com host specifies HTTP CORS headers, the Surge.sh server does not configure anything special to achieve this unilateral cross-origin resource sharing)

For more information about HTTP CORS, see https://docs.google.com/document/d/1RK_59-75OSE0PA6wexD9rYHQLnNYfoKIpsnH3SmDpUc


## NPM (Node Package Manager)

NOTE THAT THIS FEATURE IS NOT FULLY IMPLEMENTED YET (PLEASE REFERENCE THE GITHUB REPOSITORIES INSTEAD FROM YOUR PACKAGE.JSON)

All packages "owned" and maintained by the Readium Foundation are listed here: https://www.npmjs.com/~readium

Note that although Node and NPM natively use the CommonJS format, Readium modules are currently only defined as AMD (RequireJS).
This explains why Browserify ( http://browserify.org ) is not used by this Readium project.
More information at http://requirejs.org/docs/commonjs.html and http://requirejs.org/docs/node.html
>>>>>>> 4ab8dab28e7ae0a74f2b1716ea09d90f7cf399a4


<<<<<<< HEAD
## License
=======
Note: the `--dev` option after `npm install readium-js-viewer` can be used to force the download of development dependencies,
but this is kind of pointless as the code source and RequireJS build configuration files are missing.
See below if you need to hack the code.


## How to use (RequireJS bundles / AMD modules)

The `build-output` directory contains two distinct folders:

### Single bundle

The `_single-bundle` folder contains `readium-js-viewer_all.js` (and its associated source-map file, as well as a RequireJS bundle index file (which isn't actually needed at runtime, so here just as a reference)),
which aggregates all the required code (external library dependencies included, such as Underscore, jQuery, etc.),
as well as the "Almond" lightweight AMD loader ( https://github.com/jrburke/almond ).

This means that the full RequireJS library ( http://requirejs.org ) is not actually needed to bootstrap the AMD modules at runtime,
as demonstrated by the HTML file in the `dev` folder (trimmed for brevity):

```html
<html>
<head>

<!-- main code bundle, which includes its own Almond AMD loader (no need for the full RequireJS library) -->
<script type="text/javascript" src="../build-output/_single-bundle/readium-js-viewer_all.js"> </script>

<!-- index.js calls into the above library -->
<script type="text/javascript" src="./index.js"> </script>

</head>
<body>
<div id="viewport"> </div>
</body>
</html>
```

### Multiple bundles


The `_multiple-bundles` folder contains several Javascript bundles (and their respective source-map files, as well as RequireJS bundle index files):


* `readium-external-libs.js`: aggregated library dependencies (e.g. Underscore, jQuery, etc.)
* `readium-shared-js.js`: shared Readium code (basically, equivalent to the `js` folder of the "readium-shared-js" submodule)
* `readium-js.js`: the core Readium code (basically, equivalent to the `js` folder of the "readium-js" submodule)
* `readium-js-viewer.js`: this Readium code (mainly, the contents of the `js` folder)
* `readium-plugin-example.js`: simple plugin demo
* `readium-plugin-annotations.js`: the annotation plugin (DOM selection + highlight), which bundle actually contains the "Backbone" library, as this dependency is not already included in the "external libs" bundle.
)

In addition, the folder contains the full `RequireJS.js` library ( http://requirejs.org ), as the above bundles do no include the lightweight "Almond" AMD loader ( https://github.com/jrburke/almond ).

Usage is demonstrated by the HTML file in the `dev` folder (trimmed for brevity):

```html
<html>
<head>

<!-- full RequireJS library -->
<script type="text/javascript" src="../build-output/_multiple-bundles/RequireJS.js"> </script>


<!-- external libraries -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js"> </script>

<!-- readium itself -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-shared-js.js"> </script>

<!-- simple example plugin -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-example.js"> </script>

<!-- annotations plugin -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-annotations.js"> </script>

<!-- readium js -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-js.js"> </script>

<!-- readium js viewer -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-js-viewer.js"> </script>


<!-- index.js calls into the above libraries -->
<script type="text/javascript" src="./index.js"> </script>

</head>
<body>
<div id="viewport"> </div>
</body>
</html>
```


Note how the "external libs" set of AMD modules can be explicitly described using the `bundles` RequireJS configuration directive
(this eliminates the apparent opacity of such as large container of library dependencies):


```html

<script type="text/javascript">
requirejs.config({
    baseUrl: '../build-output/_multiple-bundles'
});
</script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-cfi-js.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-shared-js.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-example.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-annotations.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-js.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-js-viewer.js.bundles.js"> </script>

```


## CSON vs. JSON (package.json)

CSON = CoffeeScript-Object-Notation ( https://github.com/bevry/cson )

Running the command `npm run cson2json` will re-generate the `package.json` JSON file.
For more information, see comments in the master `./package/package_base.cson` CSON file.

Why CSON? Because it is a lot more readable than JSON, and therefore easier to maintain.
The syntax is not only less verbose (separators, etc.), more importantly it allows *comments* and *line breaking*!
>>>>>>> 4ab8dab28e7ae0a74f2b1716ea09d90f7cf399a4

**BSD-3-Clause** ( http://opensource.org/licenses/BSD-3-Clause )

See [license.txt](./license.txt).
