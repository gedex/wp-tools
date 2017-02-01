/**
 * External dependencies
 */
import { resolve } from 'path';

/**
 * Internal dependencies
 */
import exec from '../utils/exec';
import log from '../utils/logger';

export default () => {
	try {
		const out = exec.php( resolve( __dirname, '../../bin/php/readme/generate-readme-md.php' ) );
		log.success( out );
	} catch ( e ) {
		log.error( e.toString() );
	}
};
