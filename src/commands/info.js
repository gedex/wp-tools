/**
 * Internal dependencies
 */
import fh from '../utils/file-header';
import log from '../utils/logger';
import { ucfirst } from '../utils/string';

export default function( args, config ) {
	const pluginFiles = config.files || {};
	const file = args.file || pluginFiles.main;
	const type = args.type || config.type || 'plugin';

	try {
		const data = fh.getFileData( file, type );
		outputData( data, type );
	} catch ( e ) {
		log.error( e.toString() );
	}
}

function outputData( data, type ) {
	const headers = fh.headers[ type ];

	log.info( 'Project Type:', ucfirst( type ) );
	for ( const k in headers ) {
		log.info( headers[ k ] + ':', data[ k ] );
	}
}
