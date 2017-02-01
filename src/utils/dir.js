/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

function hasThemeCss() {
	const themeCss = path.resolve( process.cwd(), 'style.css' );
	return fs.existsSync( themeCss );
}

function hasPluginMainFile() {
	const mainFile = path.resolve( process.cwd(), guessMainFile( 'plugin' ) );
	return fs.existsSync( mainFile );
}

function guessMainFile( type ) {
	if ( 'theme' === type || hasThemeCss() ) {
		return 'style.css';
	}

	const cwd = process.cwd();
	const basedir = path.basename( cwd );

	return basedir + '.php';
}

function guessProjectType() {
	return ( hasThemeCss() ) ? 'theme' : 'plugin';
}

function getReadmeTxtPath() {
	return path.resolve( process.cwd(), 'readme.txt' );
}

export default {
	hasThemeCss,
	hasPluginMainFile,
	guessMainFile,
	guessProjectType,
	getReadmeTxtPath
};
