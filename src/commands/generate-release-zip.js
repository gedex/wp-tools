/**
 * External dependencies
 */
import archiver from 'archiver';
import { basename, dirname, join, resolve } from 'path';
import fs from 'fs-extra';
import glob from 'glob-all';
import os from 'os';
import read from 'read';
import temp from 'temp';

/**
 * Internal dependencies
 */
import log from '../utils/logger';

export default( args, config ) => {
	try {
		const params = getParams( args, config );

		prepareSource( params );
		generate( params );
	} catch ( e ) {
		log.error( e.toString() );
	}
};

function getParams( args, config ) {
	const cwd = process.cwd();
	const wporg = config.wporg || {};
	const slug = wporg.slug || basename( cwd );
	const src = temp.mkdirSync( slug );
	const dst = getDestination( args, config );
	const sourceFiles = getSourceFiles( config );

	return {
		src,
		dst,
		sourceFiles,
		slug
	};
}

function getDestination( args, config ) {
	const cwd = process.cwd();
	const wporg = config.wporg || {};
	const slug = wporg.slug || basename( cwd );
	const _dst = args.output || resolve( cwd, slug + '.zip' );

	let dst = '~' === _dst.charAt( 0 )
		? join( os.homedir(), _dst.substr( 1 ) )
		: _dst;

	// In case dst does not exist, make sure basedir exists, otherwise throws
	// error.
	if ( ! fs.existsSync( dirname( dst ) ) ) {
		throw new Error( `${ dirname( dst ) } does not exist.` );
	}

	// Make sure dst is not a directory that exists already.
	try {
		const st = fs.lstatSync( dst );

		if ( st.isDirectory() ) {
			dst = resolve( dst, slug + '.zip' );
		}
	} catch ( e ) {}

	return dst;
}

function getSourceFiles( config ) {
	const files = config.files || {};
	const src = files.src;
	const assets = glob.sync( files.assets || [] );

	if ( ! src ) {
		throw new Error( 'Missing files to build. Specify it via `files.src` in .wpt.yml.' );
	}

	if ( ! assets ) {
		throw new Error( 'Missing assets for wp.org. Specify it via `files.assets` in .wpt.yml.' );
	}

	return glob.sync( src ).filter( filterNotAssets( assets ) );
}

function prepareSource( params ) {
	const copyToSrc = copyFileCallback( params.src );
	params.sourceFiles.forEach( copyToSrc );
}

function copyFileCallback( dst ) {
	return ( filepath ) => {
		const stat = fs.statSync( filepath );
		if ( stat.isDirectory() ) {
			fs.ensureDir( resolve( dst, filepath ) );
		} else if ( stat.isFile() ) {
			fs.copySync( filepath, resolve( dst, filepath ) );
		}
	};
}

function filterNotAssets( assets ) {
	return ( filepath ) => {
		let isAsset = false;
		for ( let i = 0; i < assets.length; i++ ) {
			isAsset = ( fs.statSync( filepath ).isFile() && assets[ i ] === filepath );
			if ( isAsset ) {
				break;
			}
		}

		return ! isAsset;
	};
}

function generate( params ) {
	if ( fs.existsSync( params.dst ) ) {
		read( { prompt: `Overwrite ${ params.dst }?`, 'default': 'yes' }, overwriteCallback( params ) );
	} else {
		write( params );
	}
}

function overwriteCallback( params ) {
	return ( err, ok ) => {
		if ( err ) {
			return log.error( err.message );
		}
		const cancel = ! ok || 'y' !== ok.toLowerCase().charAt( 0 );

		return cancel ? log.warning( 'Aborted.' ) : write( params );
	};
}

function write( params ) {
	const out = fs.createWriteStream( params.dst );
	const zip = archiver( 'zip' );

	out.on( 'close', () => {
		log.success( `Written to ${ params.dst }.` );
		fs.removeSync( params.src );
	} );

	zip.on( 'error', err => {
		log.error( err );
		fs.removeSync( params.src );
	} );

	zip.directory( params.src, params.slug );
	zip.pipe( out );
	zip.finalize();
}
