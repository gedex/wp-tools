/**
 * External dependencies
 */
import { dirname, resolve, basename } from 'path';
import mkdirp from 'mkdirp';

/**
 * Internal dependencies
 */
import exec from '../utils/exec';
import fh from '../utils/file-header';
import log from '../utils/logger';

export default function( args, config ) {
	const pluginFiles = config.files || {};
	const mainFile = args.file || pluginFiles.main;
	const type = args.type || config.type || 'plugin';

	try {
		const data = fh.getFileData( mainFile, type );
		const makePotArgs = buildMakePortArgs( type, data );

		exec.php( ...makePotArgs );
	} catch ( e ) {
		log.error( e.toString() );
	}
}

function buildMakePortArgs( type, headerData ) {
	const makepot = resolve( __dirname, '../../bin/php/i18n/makepot.php' );
	const cwd = process.cwd();
	const slug = headerData.TextDomain || basename( cwd );
	const domainPath = headerData.DomainPath.startsWith( '/' ) ? '.' + headerData.DomainPath : headerData.DomainPath;
	const out = resolve( cwd, domainPath, slug + '.pot' );

	// Ensure out dir is created.
	mkdirp.sync( dirname( out ) );

	return [ makepot, 'wp_' + type, cwd, out, slug ];
}
