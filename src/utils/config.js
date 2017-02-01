/**
 * External dependencies
 */
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import prompt from 'promzard';
import readl from 'read';

/**
 * Internal dependencies
 */
import log from '../utils/logger';

const defaultSrc = [
	'**',
	'!node_modules/**',
	'!vendor/**',
	'!tests/**',
	'!test/**',
	'!build/**',
	'!tmp/**',
	'!README.md',
];

const defaultAssets = [
	'assets/*.png',
	'assets/*.svg'
];

function read( configPath ) {
	const configFile = configPath || path.join( process.cwd(), '.wpt.yml' );
	const configExists = fs.existsSync( configFile );
	let config = {};

	try {
		if ( configExists ) {
			config = yaml.safeLoad( fs.readFileSync( configFile, 'utf8' ) ) || {};
		}
	} catch ( e ) {
		throw new Error( 'Something wrong when reading ' + configFile + '.\n' + e.toString() );
	}

	return config;
}

function generate( defaults, useDefaults ) {
	const input = path.resolve( __dirname, '../init-input.js' );
	const ctx = {
		defaults,
		useDefaults
	};

	prompt( input, ctx, generateCb );
}

function generateCb( err, data ) {
	if ( err ) {
		return log.warning( err.message );
	}

	try {
		const dst = path.resolve( process.cwd(), '.wpt.yml' );
		const yml = prepareYaml( data );

		promptWrite( dst, yml );
	} catch ( e ) {
		log.error( e.message );
	}
}

function prepareYaml( data ) {
	const yml = {
		type: data.type
	};

	const hasValue = ( v ) => {
		return undefined !== v && null !== v;
	};
	const isEmpty = ( o ) => {
		return JSON.stringify( o ) === JSON.stringify( {} );
	};

	const files = {};
	if ( hasValue( data.src ) ) {
		files.src = data.src;
	}
	if ( hasValue( data.main ) ) {
		files.main = data.main;
	}
	if ( hasValue( data.assets ) ) {
		files.assets = data.assets;
	}
	if ( ! isEmpty( files ) ) {
		yml.files = files;
	}

	const gh = {};
	if ( hasValue( data.ghRepo ) ) {
		gh.repo = data.ghRepo;
	}
	if ( hasValue( data.ghUser ) ) {
		gh.username = data.ghUser;
	}
	if ( ! isEmpty( gh ) ) {
		yml.gh = gh;
	}

	const wporg = {};
	if ( hasValue( data.wporgSlug ) ) {
		wporg.slug = data.wporgSlug;
	}
	if ( hasValue( data.wporgUser ) ) {
		wporg.username = data.wporgUser;
	}
	if ( hasValue( data.wporgBuildPath ) ) {
		wporg.buildPath = data.wporgBuildPath;
	}
	if ( ! isEmpty( wporg ) ) {
		yml.wporg = wporg;
	}

	return yaml.safeDump( yml, { indent: 4 } );
}

function promptWrite( dst, yml ) {
	log.info( 'About to write %s: \n\n%s\n', dst, yml );
	readl( { prompt: 'Is this ok?', 'default': 'yes' }, ( err, ok ) => {
		if ( err ) {
			return log.error( err.message );
		}
		const cancel = ! ok || 'y' !== ok.toLowerCase().charAt( 0 );

		return cancel ? log.warning( 'Aborted.' ) : write( dst, yml );
	} );
}

function write( configPath, yml ) {
	fs.writeFile( configPath, yml, 'utf8', err => {
		if ( err ) {
			log.error( err.message );
		}
	} );
}

export default {
	read,
	generate,
	defaultSrc,
	defaultAssets
};
