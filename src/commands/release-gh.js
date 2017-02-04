/**
 * External dependencies
 */
import ghParse from 'parse-github-repo-url';
import request from 'request';

/**
 * Internal dependencies
 */
import fh from '../utils/file-header';
import git from '../utils/git';
import log from '../utils/logger';
import readme from '../utils/readme';

export default ( args, config ) => {
	let params;
	try {
		params = getParams( args, config );

		getReleaseActions().forEach( action => {
			action( params );
		} );
	} catch ( e ) {
		log.error( e.toString() );
	}

	afterRelease( params );
};

function getParams( args, config ) {
	const files = config.files || {};
	const mainFile = args.file || files.main;
	const type = args.type || config.type || 'plugin';
	const gh = config.gh || {};
	const repo = args.repo || gh.repo;
	if ( ! repo ) {
		throw new Error( 'Missing GitHub repo. Specify it via --repo or define `gh.repo` in .wpt.yml.' );
	}

	const repoParsed = ghParse( repo );
	if ( ! Array.isArray( repoParsed ) ) {
		throw new Error( 'Invalid gh.repo value, the format is "owner/repo"' );
	}

	const [ repoOwner, repoName, ] = repoParsed;
	const originalBranch = git.getCurrentBranch();
	const branch = args.branch || gh.branch || 'master';
	const token = args.token || process.env.WPT_GITHUB_TOKEN;

	const data = fh.getFileData( mainFile, type );
	const version = data.Version;
	const changelog = readme.getChangelog( version );

	const draft = !! args.draft;
	const preRelease = !! args.preRelease;

	return {
		repoOwner,
		repoName,
		token,
		version,
		originalBranch,
		branch,
		changelog,
		draft,
		preRelease
	};
}

function getReleaseActions() {
	return [
		switchGitBranch,
		checkBeforePush,
		gitPush,
		ghRelease
	];
}

function switchGitBranch( params ) {
	log.info( `switch to branch ${ params.branch }` );
	git.checkout( params.branch );
}

function checkBeforePush( params ) {
	log.info( 'check uncommitted changes' );
	git.checkUncommittedChanges();

	log.info( 'check version in readme.txt' );
	readme.checkVersion( params.version );
}

function gitPush( params ) {
	log.info( 'push changes to remote origin' );
	git.push( params.branch );

	log.info( `create tag ${ params.version }` );
	git.tag( params.version );

	log.info( 'push tag to remote origin' );
	git.push( params.version );
}

function afterRelease( params ) {
	try {
		log.info( `switch back to ${ params.originalBranch }` );
		git.checkout( params.originalBranch );
	} catch ( e ) {}
}

function ghRelease( params ) {
	const req = {
		method: 'POST',
		url: getReleaseUrl( params ),
		headers: {
			'Authorization': 'token ' + params.token, // eslint-disable-line quote-props
			'User-Agent': 'gedex/wpt'
		},
		body: getReleaseBody( params ),
		json: true
	};
	const cb = ( err, resp, body ) => {
		const args = [
			err,
			resp,
			body,
			req
		];
		checkResult( ...args );
	};

	log.info( `create GitHub release ${ params.version }` );
	request( req, cb );
}

function getReleaseUrl( params ) {
	if ( ! params.repoOwner || ! params.repoName ) {
		throw new Error( 'Missing GitHub repo. Please specify it via --repo or define gh.repo with format "owner/repo" in .wpt.yml' );
	}

	return `https://api.github.com/repos/${ params.repoOwner }/${ params.repoName }/releases`;
}

function getReleaseBody( params ) {
	return {
		tag_name: params.version, // eslint-disable-line camelcase
		name: params.version,
		body: params.changelog,
		draft: params.draft,
		prerelease: params.preRelease
	};
}

function checkResult( ...args ) {
	try {
		checkError( ...args );

		const [ , , body, ] = args;
		log.success( `GitHub release is created: ${ body.html_url }` );
	} catch ( e ) {
		log.error( e.toString() );
	}
}

function checkError( ...args ) {
	const [ err, resp, body, req ] = args;
	if ( err ) {
		throw new Error( err.message );
	}

	const errInfo = [
		'Request options:', JSON.stringify( req, null, 2 ) + '\n',
		'Response:', JSON.stringify( resp, null, 2 ) + '\n',
		'If this seems like a bug, please report new issue at:',
		'https://github.com/gedex/wp-tools/issues',
	].join( '\n' );

	switch ( resp.statusCode ) {
		case 400:
			throw new Error( 'Bad request.\n\n' + errInfo );
		case 401:
			throw new Error( 'Invalid token.\n\n' + errInfo );
		case 422:
			const errors = body.errors || [];
			errors.forEach( error => {
				if ( 'already_exists' === error.code ) {
					throw new Error( `Release ${ req.body.tag_name } already exists.` );
				}
			} );
		default:
			if ( 201 === resp.statusCode ) {
				break;
			}
			throw new Error( `Unexpected status code ${ resp.statusCode }.\n\n` + errInfo );
	}
}
