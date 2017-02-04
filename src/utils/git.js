/**
 * Internal dependencies
 */
import exec from './exec';
import log from './logger';

function tagExists( tagName ) {
	const args = [ 'rev-parse', tagName ];

	let exists = false;
	try {
		exec.git( ...args );
		exists = true;
	} catch ( e ) {
	}

	return exists;
}

function tag( tagName ) {
	const args = [ 'tag', tagName ];

	if ( tagExists( tagName ) ) {
		log.warning( `tag ${ tagName } already exists.` );
	} else {
		exec.git( ...args );
	}
}

function getCurrentBranch() {
	const args = [ 'symbolic-ref', '--short', '-q', 'HEAD' ];

	let branch;
	try {
		branch = exec.git( ...args );
		branch = branch.trim();
	} catch ( e ) {
		throw new Error( 'Not on any branch. Maybe in "detached HEAD" state.' );
	}

	return branch;
}

function checkout( branch ) {
	const args = [ 'checkout', branch ];
	exec.git( ...args );
}

function checkUncommittedChanges() {
	const args = [ 'diff-index', '--quiet', 'HEAD', '--' ];

	try {
		exec.git( ...args );
	} catch ( e ) {
		throw new Error( 'There are uncommited changes.' );
	}
}

function push( ref ) {
	const args = [ 'push', 'origin', ref ];
	exec.git( ...args );
}

export default {
	tagExists,
	tag,
	getCurrentBranch,
	checkout,
	checkUncommittedChanges,
	push
};
