function ucfirst( str ) {
	return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
}

// Based on https://www.npmjs.com/package/rtrim
function rtrim( str, chars ) {
	str = str.toString();
	if ( ! str ) {
		return '';
	}

	if ( ! chars ) {
		return str.replace( /\s+$/, '' );
	}

	chars = chars.toString();

	const letters = str.split( '' );
	for ( let i = letters.length - 1; i >= 0; i-- ) {
		if ( -1 === chars.indexOf( letters[ i ] ) ) {
			return str.substring( 0, i + 1 );
		}
	}

	return str;
}

function untrailingslashit( str ) {
	return rtrim( str, '/\\' );
}

function trailingslashit( str ) {
	return untrailingslashit( str ) + '/';
}

function matchAll( str, re ) {
	const matches = [];
	let match = null;
	while ( ( match = re.exec( str ) ) !== null ) {
		matches.push( [].concat( match ) );
	}
	return matches;
}

function notEmpty( str ) {
	str = str.toString();
	return str ? ( str.length > 0 ) : false;
}

export default {
	ucfirst,
	rtrim,
	untrailingslashit,
	trailingslashit,
	matchAll,
	notEmpty
};
