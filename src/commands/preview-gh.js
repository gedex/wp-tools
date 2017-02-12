/**
 * External dependencies
 */
import fs from 'fs-extra';
import open from 'open';
import { generate } from 'randomstring';
import { resolve } from 'path';
import request from 'request';
import tpl from 'string-template';

/**
 * Internal dependencies
 */
import log from '../utils/logger';
import readme from '../utils/readme';

export default () => {
	try {
		runPreview( readme.getContent( [ 'README.md', 'readme.md' ] ) );
	} catch ( e ) {
		log.error( e.toString() );
	}
};

function runPreview( readmeMd ) {
	const req = {
		method: 'POST',
		url: 'https://api.github.com/markdown/raw',
		headers: {
			'Content-Type': 'text/plain',
			'User-Agent': 'gedex/wpt'
		},
		body: readmeMd
	};
	request( req, preview );
}

function preview( err, resp, body ) {
	if ( err ) {
		return log.error( err.message );
	}

	if ( 200 !== resp.statusCode ) {
		return log.error( `Unexpected status code ${ resp.statusCode } from GitHub.` );
	}

	openBrowser( writeTempHtml( body.toString() ) );
}

function writeTempHtml( readmeMd ) {
	const tmpHtml = resolve( process.cwd(), generate() + '.index.html' );
	const tplDir = resolve( __dirname, '../../static/preview-gh' );
	const out = tpl( fs.readFileSync( resolve( tplDir, 'index.html' ), 'utf8' ), {
		css: fs.readFileSync( resolve( tplDir, 'style.css' ) ),
		readme: readmeMd
	} );
	fs.writeFileSync( tmpHtml, out, 'utf8' );
	return tmpHtml;
}

function openBrowser( tmpHtml ) {
	open( tmpHtml, ( err ) => {
		if ( ! err ) {
			setTimeout( () => {
				fs.removeSync( tmpHtml );
			}, 3000 );
		}
	} );
}
