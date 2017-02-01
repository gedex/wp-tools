/**
 * External dependencies
 */
import cheerio from 'cheerio';
import fs from 'fs';
import request from 'request';

/**
 * Internal dependencies
 */
import dir from '../utils/dir';
import log from '../utils/logger';

export default () => {
	try {
		const readme = fs.readFileSync( dir.getReadmeTxtPath(), 'utf8' );
		validate( readme, checkResult );
	} catch ( err ) {
		log.error( err.toString() );
	}
};

function validate( readme, cb ) {
	const options = {
		url: 'https://wordpress.org/plugins/about/validator/',
		form: {
			readme_contents: readme, // eslint-disable-line camelcase
			text: '1',
			submit: 'Validate!'
		}
	};

	request.post( options, cb );
}

function checkResult( err, resp, body ) {
	if ( err ) {
		return log.error( err.message );
	}

	if ( 200 !== resp.statusCode ) {
		return log.error( `Validator responded with code ${ resp.statusCode }` );
	}

	const $ = cheerio.load( body );
	const collect = selector => {
		const notes = [];
		if ( $( selector ).length ) {
			$( selector ).each( ( k, li ) => {
				notes.push( $( li ).text() );
			} );
		}
		return notes;
	};
	const errors = collect( 'ul.fatal.error li' );
	const warnings = collect( 'ul.warning.error li, ul.note.error li' );

	if ( errors.length ) {
		return log.error( errors.join( '\n' ) );
	}

	if ( warnings.length ) {
		log.warning(
			[
				`Found ${ warnings.length } warning${ warnings.length > 1 ? 's' : '' }:`,
				''
			]
			.concat( warnings )
			.concat( [
				'',
				'Warning is not a blocker and can be pushed to wp.org without error'
			] )
			.join( '\n' )
		);
	} else {
		log.success( 'Your readme.txt looks good.' );
	}
}
