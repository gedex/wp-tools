/**
 * External dependencies
 */
import fs from 'fs';
import { resolve, basename } from 'path';
import glob from 'glob-all';

/**
 * Internal dependencies
 */
import conf from '../utils/config';
import exec from '../utils/exec';
import fh from '../utils/file-header';
import log from '../utils/logger';

export default function( args, config ) {
	const files = config.files || {};
	const mainFile = args.file || files.main;
	const type = args.type || config.type || 'plugin';
	const src = files.src || conf.defaultSrc;

	const phpfiles = glob.sync( src ).filter( filepath => {
		return fs.statSync( filepath ).isFile() && filepath.endsWith( '.php' );
	} );

	// Make sure all files are syntatically correct before validating the gettext
	// func in files.
	phplint( ...phpfiles );

	const data = fh.getFileData( mainFile, type );
	const domain = data.TextDomain || basename( process.cwd() );

	try {
		runValidateI18N( domain, ...phpfiles );
	} catch ( e ) {
		log.info( e.message );
	}
}

function runValidateI18N( domain, ...files ) {
	const args = [
		resolve( __dirname, '../../bin/php/i18n/validate-i18n.php' ),
		domain,
		...files
	];

	exec.php( ...args );
}

function phplint( ...files ) {
	const args = [ '-d', 'display_errors=1', '-l', ...files ];
	exec.php( ...args );
}
