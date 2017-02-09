/* global defaults, useDefaults, prompt */

/**
 * External dependencies
 */
import ghParse from 'parse-github-repo-url';

export default {
	type: useDefaults
		? toType( defaults.type )
		: prompt( 'Project type', defaults.type, toType ),

	src: useDefaults
		? toArray( defaults.files.src )
		: prompt( 'Plugin files', toStr( defaults.files.src ), toArray ),

	main: useDefaults
		? toStr( defaults.files.main )
		: prompt( 'Plugin main file', toStr( defaults.files.main ), toStr ),

	assets: useDefaults
		? toArray( defaults.files.assets )
		: prompt( 'Plugin wp.org assets', toStr( defaults.files.assets ), toArray ),

	ghRepo: useDefaults
		? toStr( defaults.gh.repo )
		: prompt( 'GitHub repo', toStr( defaults.gh.repo ), toStr ),

	ghUser: function( cb ) {
		const gh = ghParse( this.exports.default.ghRepo || '' );
		const d = this.defaults.gh.username || Array.isArray( gh ) ? gh[ 0 ] : undefined;
		const r = this.exports.useDefaults
			? toStr( d )
			: prompt( 'GitHub username', toStr( d ), toStr );

		return cb( null, r );
	},

	wporgSlug: useDefaults
		? toStr( defaults.wporg.slug )
		: prompt( 'WP.org slug', toStr( defaults.wporg.slug ), toStr ),

	wporgUser: useDefaults
		? toStr( defaults.wporg.username )
		: prompt( 'WP.org username', toStr( defaults.wporg.username ), toStr ),

	wporgBuildPath: useDefaults
		? toStr( defaults.wporg.buildPath )
		: prompt( 'Build path for deploying to WP.org', toStr( defaults.wporg.buildPath ), toStr )
};

function toType( t ) {
	if ( 'plugin' !== t && 'theme' !== t ) {
		t = 'plugin';
	}
	return t;
}

function toStr( s ) {
	if ( ! s ) {
		return undefined;
	}

	if ( 'string' === typeof s ) {
		return s;
	}

	if ( Array.isArray( s ) ) {
		return s.join( ', ' );
	}

	return undefined;
}

function toArray( s ) {
	if ( ! s ) {
		return undefined;
	}

	if ( Array.isArray( s ) ) {
		s = s.join( ' ' );
	}

	if ( 'string' !== typeof s ) {
		return s;
	}

	return s.split( /[\s,]+/ );
}
