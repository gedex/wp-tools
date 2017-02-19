wp-tools (wpt)
==============

[![npm version](https://img.shields.io/npm/v/wp-tools.svg?style=flat)](https://www.npmjs.com/package/wp-tools)
[![build status](https://api.travis-ci.org/gedex/wp-tools.svg)](http://travis-ci.org/gedex/wp-tools)
[![dependency status](https://david-dm.org/gedex/wp-tools.svg)](https://david-dm.org/gedex/wp-tools)

wp-tools (wpt) is a command line interface to reduce boring tasks when
working on WordPress plugin / theme project that will be published to wp.org.
Most commands in wpt are shamelessly borrowed from existing task runner plugin
(see credits) so that you can run it without task runner and embed it easily in
`npm scripts` (which is the main goal of wpt).

## Install

```
$ npm install -g wp-tools
```

## Usage

Once installed globally, `wpt` should be available from shell.

```
$ wpt

  Usage:  [options] [command]


  Commands:

    bump:wp-version [options] <from> <to>  Bump WP version in readme.txt
    generate:pot [options]                 Generate POT.
    generate:readme-md [options]           Generate README.md from readme.txt.
    generate:release-zip [options]         Generates project zip like in wp.org without releasing.
    info [options]                         View plugin/theme project info.
    init [options]                         Initialize .wpt.yaml.
    release:gh [options]                   Release the project to GitHub.
    release:wporg [options]                Release the project to WP.org.
    preview:gh                             Preview GitHub README.md.
    validate:i18n [options]                Check your code for incorrect text-domain.
    validate:readme-txt                    Check your readme.txt.

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

For more help on specific command, supply `-h` or `--help`, for example:

```
$ wpt init -h

  Usage: init [options]

  Initialize .wpt.yaml in current directory.

  If .wpt.yml exists in current directory, it will read that first, and default to the options there.

  Options:

    -h, --help          output usage information
    -d, --use-defaults  Use only defaults and not prompt you for any options.
```

## Project Config (`.wpt.yml`)

Some commands in wpt expect config file to be present in your project directory.
To add / modify config file in a project:

```
$ wpt init
```

Just like `npm init` this will create `.wpt.yml` file. Following is an example
of `.wpt.yml` content:

~~~yaml
type: plugin
files:
    src:
        - '**'
        - '!node_modules/**'
        - '!vendor/**'
        - '!tests/**'
        - '!test/**'
        - '!build/**'
        - '!tmp/**'
        - '!README.md'
    main: slack.php
    assets:
        - assets/*.png
gh:
    username: gedex
    repo: gedex/wp-slack
    branch: master
wporg:
    slug: slack
    username: akeda
    buildPath: build
~~~

* `type` is project type (plugin or theme).
* `files.src` is list of files / patterns that are part of the plugin or theme.
   All files that match with the pattern will be pushed to wp.org when using
   command `release:wporg`. Command `wpt generate:pot` also uses matched files
   to scan gettext functions.
* `files.main` is main file of the plugin or theme. For theme it should be
  `style.css`.
* `files.assets` is list of files / patterns that are assets in wp.org. See
   [here](https://developer.wordpress.org/plugins/wordpress-org/plugin-assets/).
* `gh.username` is your GitHub username, if the project is hosted on GitHub.
* `gh.repo` is GitHub repository with following format:

   ```
   owner/repo
   ```
   For example https://github.com/Automattic/jetpack would be `Automattic/jetpack`.

* `gh.branch` is git branch for stable release. If not specified it defaults to
  `master`. This branch is checkout'ed when releasing to GitHub and wp.org.
* `wporg.slug` is the plugin slug in wp.org directory.
* `wporg.username` is your wp.org username that has commit access to the plugin
  svn. Required by command `wpt release:wporg`.
* `wporg.buildPath` is the directory containing all files to be pushed to wp.org.
  By default it's under `build` of current directory. The directory must be
  gitignore'ed. The checkout, diff, and commit are performed against this
  directory.

## Credits

* [generate-markdown-readme](https://github.com/xwp/wp-dev-lib/blob/master/generate-markdown-readme)
  from [xwp/wp-deb-lib](https://github.com/xwp/wp-dev-lib).
* [wpi18n](https://github.com/cedaro/node-wp-i18n)
* [grunt-checktextdomain](https://github.com/stephenharris/grunt-checktextdomain)

## License

MIT
