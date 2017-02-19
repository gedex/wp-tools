/**
 * Internal dependencies
 */
import bumpWpVersion from './commands/bump-wp-version';
import generatePot from './commands/generate-pot';
import generateReadmeMd from './commands/generate-readme-md';
import generateReleaseZip from './commands/generate-release-zip';
import info from './commands/info';
import init from './commands/init';
import releaseGh from './commands/release-gh';
import releaseWpOrg from './commands/release-wporg';
import previewGh from './commands/preview-gh';
import validatei18n from './commands/validate-i18n';
import validateReadmeTxt from './commands/validate-readme-txt';

const branchOption = [ '-b, --branch <branch>', 'Git release branch. Default to master.' ];
const mainFileOption = [ '-f, --file <file>', 'Plugin main file.' ];
const projectTypeOption = [ '-t, --type <type>', 'Project type (plugin or theme).' ];
const quietOption = [ '-q, --quiet', 'Disable all output.' ];

export default {
	'bump:wp-version': {
		description: 'Bump WP version in readme.txt',
		longDescription: [
			'This command will do the following actions:',
			'',
			'  1) Save current changes in current branch.',
			'  2) Checkout to the branch specified either in `gh.branch` of',
			'     .wpt.yml, `-b` or `--branch` arg, or `master` if the previous',
			'     two are not set.',
			'  3) Updates `Requires at least` with <from> and `Tested up to`',
			'     with <to> in readme.txt and plugin / theme main file.',
			'  4) If `-R` or `--no-release` is specified stop. Leave changes',
			'     unstaged, switch to original branch, and pop saved changes.',
			'     Otherwise proceed following actions.',
			'  5) Commit the changes.',
			'  6) Push to remote origin',
			'  7) Release the change to wp.org trunk. No tagging.',
			'  8) Switch to original branch and pop saved changes.'
		].join( '\n' ),
		options: [
			branchOption,
			[ '-R, --no-release', 'No release. Changes are not staged.' ]
		],
		arguments: '<from> <to>',
		action: ( from, to, args, config ) => {
			bumpWpVersion( from, to, args, config );
		}
	},
	'generate:pot': {
		description: 'Generate POT.',
		options: [
			mainFileOption,
			projectTypeOption,
			quietOption
		],
		action: ( args, config ) => {
			generatePot( args, config );
		}
	},
	'generate:readme-md': {
		description: 'Generate README.md from readme.txt.',
		options: [
			quietOption
		],
		action: ( args ) => {
			generateReadmeMd( args );
		}
	},
	'generate:release-zip': {
		description: 'Generates project zip like in wp.org without releasing.',
		options: [
			[ '-o, --output <output>', 'Filepath output.' ]
		],
		action: ( args, config ) => {
			generateReleaseZip( args, config );
		}
	},
	info: {
		description: 'View plugin/theme project info.',
		options: [
			mainFileOption,
			projectTypeOption
		],
		action: ( args, config ) => {
			info( args, config );
		}
	},
	init: {
		description: 'Initialize .wpt.yaml.',
		longDescription: 'If .wpt.yml exists in current directory, it will read ' +
			'that first, and default to the options there.',
		options: [
			[ '-d, --use-defaults', 'Use only defaults and not prompt you for any options.' ]
		],
		action: ( args, config ) => {
			init( args, config );
		}
	},
	'release:gh': {
		description: 'Release the project to GitHub.',
		longDescription: [
			'This command will do the following actions:',
			'',
			'  1) Checkout to the branch `--branch` if specified or `gh.branch`',
			'     in .wpt.yml. Otherwise checkout to the `master` branch.',
			'  2) Check if there are uncommitted changes. If yes stop.',
			'  3) Push the changes to the remote origin.',
			'  4) Create the tag from version number found in plugin/theme main',
			'     file as defined in `files.main` of .wpt.yml.',
			'  5) Push the tag.',
			'  6) Create the release based on created tag. By default the release',
			'     is published one unless `--draft` and/or `--pre-release` is',
			'     specified. GitHub token needs to be specified either via `--token`',
			'     or `WPT_GITHUB_TOKEN` environment variable.'
		].join( '\n' ),
		options: [
			branchOption,
			[ '-d, --draft', 'Create a draft.' ],
			mainFileOption,
			[ '-p, --pre-release', 'Release as a prerelease.' ],
			quietOption,
			[ '-r, --repo <repo>', 'GitHub repo with format "owner/repo".' ],
			[ '-t, --token <token>', 'GitHub token.' ]
		],
		action: ( args, config ) => {
			releaseGh( args, config );
		}
	},
	'release:wporg': {
		description: 'Release the project to WP.org.',
		options: [
			branchOption,
			[ '-s, --slug <slug>', 'WP.org slug. Default to value in .wpt.yml.' ],
			[ '-u, --username', 'WP.org username. Default to value in .wpt.yml.' ],
			[ '-b, --build-path <path>', 'Path to build directory.' ],
			[ '-i, --ignore <files>', 'Ignored files.' ]
		],
		action: ( args, config ) => {
			releaseWpOrg( args, config );
		}
	},
	'preview:gh': {
		description: 'Preview GitHub README.md.',
		longDescription: [
			'This will creates temporary HTML file in currenct directory and',
			'  open it on browser. The HTML file will be removed after the preview.'
		].join( '\n' ),
		action: ( args, config ) => {
			previewGh( args, config );
		}
	},
	'validate:i18n': {
		description: 'Check your code for incorrect text-domain.',
		requireConfigFile: true,
		options: [
			mainFileOption
		],
		action: ( args, config ) => {
			validatei18n( args, config );
		}
	},
	'validate:readme-txt': {
		description: 'Check your readme.txt.',
		action: ( args, config ) => {
			validateReadmeTxt( args, config );
		}
	}
};
