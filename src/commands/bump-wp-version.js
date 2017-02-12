/**
 * External dependencies
 */
import escape from 'escape-string-regexp';
import fs from 'fs-extra';
import { resolve } from 'path';
import semver from 'semver';

/**
 * Internal dependencies
 */
import fh from '../utils/file-header';
import git from '../utils/git';
import log from '../utils/logger';
import readme from '../utils/readme';
import svn from '../utils/svn';

export default function( from, to, args, config ) {
	let params;
	try {
		params = getParams( from, to, args, config );

		getBumpActions().forEach( action => {
			action( params );
		} );
	} catch ( e ) {
		log.error( e.toString() );
	}

	afterBump( params );
}

function getParams( from, to, args, config ) {
	const release = args.release;
	const type = args.type || config.type || 'plugin';
	const files = config.files || {};
	const main = args.file || files.main;
	const gh = config.gh || {};
	const branch = args.branch || gh.branch || 'master';
	const originalBranch = git.getCurrentBranch();
	const wporg = config.wporg || {};
	const slug = wporg.slug;
	const username = wporg.username;
	const buildPath = wporg.buildPath;

	return {
		type,
		main,
		from,
		to,
		release,
		branch,
		originalBranch,
		slug,
		username,
		buildPath
	};
}

function getBumpActions() {
	return [
		gitStash,
		switchGitBranch,
		validateParams,
		updateReadme,
		updateMainFile,
		gitCommit,
		gitPush,
		wporgDeploy
	];
}

function gitStash() {
	log.info( 'Save current changes.' );
	git.stash();
}

function switchGitBranch( params ) {
	log.info( `Switch to branch ${ params.branch }.` );
	git.checkout( params.branch );
}

function validateParams( params ) {
	const { from: from, to: to } = params;

	if ( ! semver.valid( semverit( from ) ) ) {
		throw new Error( `Value <from>, ${ from }, is not a valid version.` );
	}

	if ( ! semver.valid( semverit( to ) ) ) {
		throw new Error( `Value <to>, ${ to }, is not a valid version.` );
	}

	if ( ! semver.gte( semverit( to ), semverit( from ) ) ) {
		throw new Error( `Version of <to>, ${ to }, must be greater than or equal to <from>, ${ from }.` );
	}
}

function updateMinVersion( content, oldVersion, newVersion ) {
	return content.replace(
		new RegExp( '(Requires at least\\s*:\\s*)' + escape( oldVersion ) ),
		versionReplacer( newVersion )
	);
}

function updateMaxVersion( content, oldVersion, newVersion ) {
	return content.replace(
		new RegExp( '(Tested up to\\s*:\\s*)' + escape( oldVersion ) ),
		versionReplacer( newVersion )
	);
}

function versionReplacer( newVersion ) {
	return ( match, prefix ) => {
		return prefix + newVersion;
	};
}

function updateReadme( params ) {
	let content = readme.getContent();
	const { from: from, to: to } = params;
	const { meta: meta } = readme.parse( content );
	const cFrom = meta[ 'Requires at least' ];
	const cTo = meta[ 'Tested up to' ];
	const updateFrom = cFrom && semver.neq( semverit( cFrom ), semverit( from ) );
	const updateTo = cTo && semver.neq( semverit( cTo ), semverit( to ) );

	if ( updateFrom ) {
		content = updateMinVersion( content, cFrom, from );
	}
	if ( updateTo ) {
		content = updateMaxVersion( content, cTo, to );
	}

	if ( ! updateFrom && ! updateTo ) {
		log.warning( 'Nothing updated in readme.txt.' );
	} else {
		readme.updateContent( content );
		log.success( 'Updated readme.txt.' );
	}
}

function semverit( v ) {
	v = v.toString();

	const arr = v.split( '.' );
	switch ( arr.length ) {
		case 1:
			return arr[ 0 ] + '.0.0';
		case 2:
			return arr[ 0 ] + '.' + arr[ 1 ] + '.0';
		case 3:
			return v;
		default:
			return '';
	}
}

function updateMainFile( params ) {
	const { type, main, from, to } = params;
	const data = fh.getFileData( main, type, {
		'Requires at least': 'Requires at least',
		'Tested up to': 'Tested up to'
	} );
	const cFrom = data[ 'Requires at least' ];
	const cTo = data[ 'Tested up to' ];
	const updateFrom = cFrom && semver.neq( semverit( cFrom ), semverit( from ) );
	const updateTo = cTo && semver.neq( semverit( cTo ), semverit( to ) );

	let content = fs.readFileSync( main, 'utf8' );

	if ( updateFrom ) {
		content = updateMinVersion( content, cFrom, from );
	}
	if ( updateTo ) {
		content = updateMaxVersion( content, cTo, to );
	}

	if ( ! updateFrom && ! updateTo ) {
		log.warning( `Nothing updated in ${ main }.` );
	} else {
		fs.outputFileSync( main, content, 'utf8' );
		log.success( `Updated ${ main }.` );
	}
}

function getBumpMessage( from, to ) {
	return `Bump "Requires at least" to ${ from } and "Tested up to" to ${ to }.`;
}

function gitCommit( params ) {
	const { release, from, to } = params;

	if ( ! release ) {
		return log.warning( 'Skip commit.' );
	}

	try {
		git.add();
		git.commit( getBumpMessage( from, to ) );
		log.success( 'Changes committed.' );
	} catch ( e ) {}
}

function gitPush( params ) {
	const { release, branch } = params;

	if ( ! release ) {
		return log.warning( 'Skip push.' );
	}

	log.info( 'Push changes to remote origin.' );
	git.push( branch );
}

function wporgDeploy( params ) {
	const { from, to, release, slug, username, buildPath } = params;
	if ( ! release ) {
		return log.warning( 'Skip release.' );
	}

	fs.removeSync( buildPath );

	const root = resolve( buildPath );
	const trunk = resolve( buildPath, 'trunk' );

	svn.checkout( svn.getWpOrgSvn( slug ), root );
	svn.update( trunk, '--set-depth', 'infinity' );

	// Only copy readme.txt to bump the change on wporg page.
	[ 'readme.txt', 'README.txt' ].forEach( r => {
		if ( fs.existsSync( r ) ) {
			fs.copySync( r, resolve( trunk, r ) );
		}
	} );

	// The readme.txt is assumed to be tracked by svn already, so it's matter
	// of commit to trunk.
	svn.commit( trunk, username, getBumpMessage( from, to ) );
	log.success( 'Committed to wp.org.' );
}

function afterBump( params ) {
	try {
		log.info( `Switch back to ${ params.originalBranch }.` );
		git.checkout( params.originalBranch );
		log.info( 'Pop saved changes.' );
		git.unstash();
		fs.removeSync( resolve( process.cwd(), params.buildPath ) );
	} catch ( e ) {}
}
