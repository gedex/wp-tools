/**
 * External dependencies
 */
import path from 'path';

/**
 * Internal dependencies
 */
import dir from '../utils/dir';
import conf from '../utils/config';

export default function( args, config ) {
	const defaults = {};
	const basedir = path.basename( process.cwd() );

	defaults.type = config.type || dir.guessProjectType();
	defaults.files = config.files || {};
	defaults.files.src = defaults.files.src || conf.defaultSrc;
	defaults.files.main = defaults.files.main || dir.guessMainFile();
	defaults.files.assets = defaults.files.assets || conf.defaultAssets;

	defaults.gh = config.gh || {};

	defaults.wporg = config.wporg || {};
	defaults.wporg.slug = defaults.wporg.slug || basedir;
	defaults.wporg.buildPath = defaults.wporg.buildPath || 'build';

	conf.generate( defaults, args.useDefaults );
}
