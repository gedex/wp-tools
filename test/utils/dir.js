/**
 * External dependencies
 */
import { assert } from 'chai';
import fs from 'fs';
import { resolve, basename } from 'path';
import rimraf from 'rimraf';
import temp from 'temp';

/**
 * Internal dependencies
 */
import dir from '../../src/utils/dir';

describe( 'utils: dir', () => {
	const pluginDir = resolve( __dirname, '../fixtures/plugin' );
	const themeDir = resolve( __dirname, '../fixtures/theme' );
	const cwd = process.cwd();
	const returnsToCwd = () => {
		process.chdir( cwd );
	};

	afterEach( returnsToCwd );

	describe( 'hasThemeCss', () => {
		it( 'should return true if current directory has file style.css', () => {
			process.chdir( themeDir );
			assert.isTrue( dir.hasThemeCss() );
		} );

		it( 'should return false if current directory does not have file style.css', () => {
			process.chdir( pluginDir );
			assert.isFalse( dir.hasThemeCss() );
		} );
	} );

	describe( 'hasPluginMainFile', () => {
		let tmp;

		beforeEach( () => {
			tmp = temp.mkdirSync( 'wpt-test-utils-hasPluginMainFile' );
			fs.writeFileSync( resolve( tmp, basename( tmp ) + '.php' ) );
		} );

		it( 'should return true if current directory has file {path-basename}.php', () => {
			process.chdir( tmp );
			assert.isTrue( dir.hasPluginMainFile() );
		} );

		afterEach( done => {
			rimraf( tmp, done );
		} );
	} );

	describe( 'guessMainFile', () => {
		it( 'should return "style.css" if current directory has file style.css', () => {
			process.chdir( themeDir );
			assert.equal( dir.guessMainFile(), 'style.css' );
		} );

		it( 'should return {path-basename}.php (even if the file does not exist) if current directory does not have style.css', () => {
			process.chdir( pluginDir );
			assert.equal( dir.guessMainFile(), 'plugin.php' );
		} );
	} );

	describe( 'guessProjectType', () => {
		it( 'should return "theme" if current directory has file style.css', () => {
			process.chdir( themeDir );
			assert.equal( dir.guessProjectType(), 'theme' );
		} );

		it( 'returns "plugin" if current directory does not have file style.css', () => {
			process.chdir( pluginDir );
			assert.equal( dir.guessProjectType(), 'plugin' );
		} );
	} );

	describe( 'getReadmeTxtPath', () => {
		it( 'should returns readme.txt (even if the file does not exist) path in current directory', () => {
			assert.equal( dir.getReadmeTxtPath(), resolve( process.cwd(), 'readme.txt' ) );
		} );
	} );
} );
