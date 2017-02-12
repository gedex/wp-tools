/**
 * External dependencies
 */
import fs from 'fs-extra';

/**
 * Internal dependencies
 */
import log from './logger';
import str from './string';

function parse( input ) {
	const [ , title, _meta, desc, rest ] = parseBlock( input );
	const meta = parseMetaBlock( _meta );
	const sections = parseSections( rest );

	return {
		title,
		desc,
		meta,
		sections
	};
}

function getPath( candidates ) {
	candidates = candidates || [
		'readme.txt',
		'README.txt'
	];

	let readmeFile;
	candidates.forEach( r => {
		if ( ! readmeFile && fs.existsSync( r ) ) {
			readmeFile = r;
		}
	} );

	if ( ! readmeFile ) {
		throw new Error( `Missing file ${ candidates[ 0 ] }.` );
	}

	return readmeFile;
}

function getContent( candidates ) {
	const readmeFile = getPath( candidates );
	const content = fs.readFileSync( readmeFile, 'utf8' );
	if ( ! content ) {
		throw new Error( `Empty content on ${ readmeFile }` );
	}

	return content;
}

function updateContent( content, candidates ) {
	const readmeFile = getPath( candidates );
	fs.outputFileSync( readmeFile, content, 'utf8' );
}

function getChangelog( version ) {
	const content = getContent();
	const parsed = parse( content );

	let changelog = '';
	for ( let i = 0; i < parsed.sections.length; i++ ) {
		if ( 'Changelog' === parsed.sections[ i ].heading ) {
			const sub = parsed.sections[ i ].subsections || [];
			if ( sub[ 0 ] && version === sub[ 0 ].heading ) {
				changelog = sub[ 0 ].body;
			}
			break;
		}
	}

	if ( ! changelog ) {
		throw new Error(
			`Missing changelog for ${ version } in readme.txt. Or ` +
			`latest changelog in readme.txt is not ${ version }.`
		);
	}

	return changelog;
}

function checkVersion( versionInMainFile ) {
	const content = getContent();
	const parsed = parse( content );

	if ( 'trunk' === parsed.meta[ 'Stable tag' ].trim().toLowerCase() ) {
		log.warning( `Stabe tag in readme.txt is "trunk" instead of ${ versionInMainFile }.` );
	} else if ( parsed.meta[ 'Stable tag' ] !== versionInMainFile ) {
		throw new Error(
			`Version in main file (${ versionInMainFile }) does not match with stable tag in readme.txt (${ parsed.meta[ 'Stable tag' ] }).`
		);
	}
}

function parseBlock( input ) {
	const re = /^=== (.+?) ===\n([\s\S]+?)\n\n([\s\S]+?)\n([\s\S]+)/;
	const matches = input.match( re );

	if ( arrlen( matches ) < 5 ) {
		throw new Error( 'Malformed metadata block' );
	}

	return matches;
}

function parseSections( input ) {
	const re = /(?:^|\n)== ([\s\S]+?) ==\n([\s\S]+?)(?=\n== |$)/g;
	const sections = str.matchAll( input, re );
	const results = [];

	if ( ! arrlen( sections ) ) {
		throw new Error( 'Failed to parse sections' );
	}

	sections.forEach( section => {
		if ( ! arrlen( section ) ) {
			throw new Error( 'Failed to parse a single section' );
		}

		const [ , heading, content, ] = section;
		let body = content.trim();
		let substr = body;

		const matches = body.match( /^(\s*[^=][\s\S]+?)(?=\n=|$)([\s\S]*$)/ );
		if ( arrlen( matches ) >= 3 ) {
			[ , body, substr, ] = matches;
		} else {
			body = null;
		}

		const subsections = parseSubSections( substr );

		results.push( {
			heading,
			body,
			subsections
		} );
	} );

	return results;
}

function parseSubSections( substr ) {
	const results = [];
	const re = /(?:^|\n)= ([\s\S]+?) =\n([\s\S]+?)(?=\n= |$)/g;
	const matches = str.matchAll( substr, re );

	if ( ! arrlen( matches ) ) {
		return results;
	}

	matches.forEach( subsection => {
		const [ , h, b, ] = subsection;
		const [ heading, body ] = [ h.trim(), b.trim() ];

		results.push( { heading, body } );
	} );

	return results;
}

function parseMetaBlock( input ) {
	const meta = {
		Contributors: null,
		Tags: null,
		'Requires at least': null,
		'Tested up to': null,
		'Stable tag': null,
		License: null,
		'License URI': null
	};
	input.split( '\n' ).forEach( line => {
		const metaMatches = line.match( /^(.+?):\s+(.+)$/ );
		if ( arrlen( metaMatches ) < 3 ) {
			throw new Error( 'Parse error meta block' );
		}
		const [ , k, v ] = metaMatches;
		meta[ k ] = v;
	} );
	meta.Contributors = metaWithList( meta.Contributors );
	meta.Tags = metaWithList( meta.Tags );

	return meta;
}

function metaWithList( data ) {
	return ( !! data )
		? data.split( /\s*,\s*/ ).filter( notEmpty )
		: [];
}

function notEmpty( s ) {
	return !! s;
}

function arrlen( arr ) {
	return Array.isArray( arr ) ? arr.length : 0;
}

export default {
	parse,
	getContent,
	updateContent,
	getChangelog,
	checkVersion
};
