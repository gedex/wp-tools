/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import readChunk from 'read-chunk';

const pluginHeaders = {
	Name: 'Plugin Name',
	PluginURI: 'Plugin URI',
	Version: 'Version',
	Description: 'Description',
	Author: 'Author',
	AuthorURI: 'Author URI',
	TextDomain: 'Text Domain',
	DomainPath: 'Domain Path',
	Network: 'Network',
	License: 'License',
	LicenseURI: 'License URI'
};

const themeHeaders = {
	Name: 'Theme Name',
	ThemeURI: 'Theme URI',
	Version: 'Version',
	Description: 'Description',
	Author: 'Author',
	AuthorURI: 'Author URI',
	Template: 'Template',
	Status: 'Status',
	Tags: 'Tags',
	TextDomain: 'Text Domain',
	DomainPath: 'Domain Path',
	License: 'License',
	LicenseURI: 'License URI'
};

const headers = {
	plugin: pluginHeaders,
	theme: themeHeaders
};

function getFileData( filepath, context = 'plugin', extraHeaders ) {
	if ( ! filepath ) {
		throw new Error( 'Missing plugin main file. Specify it via --file or define `files.main` in .wpt.yml.' );
	}

	const pathParsed = path.parse( filepath );
	if ( '' === pathParsed.dir ) {
		pathParsed.dir = '.';
		filepath = path.format( pathParsed );
	}

	if ( ! fs.existsSync( filepath ) ) {
		throw new Error( `File ${ filepath } does not exist.` );
	}

	const buf = readChunk.sync( filepath, 0, 8192 );
	return headerData( buf, context, extraHeaders );
}

function headerData( buf, context, extraHeaders ) {
	const str = buf.toString( 'utf8' ).replace( /\r/, '\n' );
	const header = headers[ context ]
		? Object.assign( {}, headers[ context ], extraHeaders || {} )
		: Object.assign( {}, pluginHeaders, extraHeaders || {} );

	for ( const k in header ) {
		const matches = str.match( new RegExp( `^[ \t/*#@]*${ header[ k ] }:(.*)$`, 'mi' ) ) || [];

		header[ k ] = matches[ 1 ] ? clean( matches[ 1 ] ) : '';
	}

	return header;
}

function clean( str ) {
	return str.replace( /\s*(?:\*\/|\?>).*/, '' ).trim();
}

export default {
	headers,
	getFileData
};
