/**
 * Internal dependencies
 */
import exec from './exec';
import str from './string';

function checkout( src, dst ) {
	const args = [ 'checkout', src, dst, '--depth', 'immediates' ];
	exec.svn( ...args );
}

function update( path, ...updateArgs ) {
	const args = [ 'update', '--quiet', path, ...updateArgs ];
	exec.svn( ...args );
}

function add( path ) {
	const args = [ 'add', '--force', path ];
	exec.svn( ...args );
}

function del( path ) {
	const args = [ 'delete', '--force', '--quiet', path ];
	exec.svn( ...args );
}

function copy( from, to ) {
	const args = [ 'copy', '--quiet', str.trailingslashit( from ), str.trailingslashit( to ) ];
	exec.svn( ...args );
}

function status( path ) {
	const args = [ 'status', path ];
	return exec.svn( ...args );
}

function commit( path, username, message ) {
	const args = [ 'commit', path, '--force-interactive', '--username', username, '-m', message ];
	exec.svn( ...args );
}

function missingItems( path ) {
	const re = /(?:^|[\n\r]+)!\s+([^\n\r]+?)(?=[\n\r]+|$)/g;
	return statusLinesMatch( path, re );
}

function untrackedItems( path ) {
	const re = /(?:^|[\n\r]+)\?\s+([^\n\r]+?)(?=[\n\r]+|$)/g;
	return statusLinesMatch( path, re );
}

function statusLinesMatch( path, re ) {
	const input = status( path );
	const matches = str.matchAll( input, re ) || [];
	const items = [];

	matches.forEach( m => {
		const [ , item ] = m;
		items.push( item );
	} );

	return items;
}

function getWpOrgSvn( slug, tag ) {
	const url = `https://plugins.svn.wordpress.org/${ slug }`;
	return tag ? url + '/' + tag : url;
}

export default {
	checkout,
	update,
	add,
	del,
	copy,
	status,
	commit,
	missingItems,
	untrackedItems,
	getWpOrgSvn
};
