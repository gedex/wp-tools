/**
 * External dependencies
 */
import { assert } from 'chai';

/**
 * Internal dependencies
 */
import str from '../../src/utils/string';

describe( 'utils: string', () => {
	describe( 'ucfirst', () => {
		it( 'should capitalize the first char of a string', () => {
			assert.equal( str.ucfirst( 'foo' ), 'Foo' );
			assert.equal( str.ucfirst( 'foo bar' ), 'Foo bar' );
		} );
	} );

	describe( 'rtrim', () => {
		// Copied from https://github.com/sergejmueller/rtrim/blob/master/test/test.js
		it( 'should strip trailing slash if "/" is passed as chars arg', () => {
			assert.equal( str.rtrim( 'https://goo.gl/', '/' ), 'https://goo.gl' );
		} );

		it( 'should strip whitespace if no chars arg being passed', () => {
			assert.equal( str.rtrim( '    Hello World    ' ), '    Hello World' );
		} );
	} );

	describe( 'untrailingslashit', () => {
		// Copied from https://core.trac.wordpress.org/browser/tags/4.7/tests/phpunit/tests/formatting/Slashit.php?order=name
		it( 'should remove trailing slashes', () => {
			assert.equal( str.untrailingslashit( 'a/' ), 'a' );
			assert.equal( str.untrailingslashit( 'a////' ), 'a' );
		} );

		it( 'should remove trailing backslashes', () => {
			assert.equal( str.untrailingslashit( 'a\\' ), 'a' );
			assert.equal( str.untrailingslashit( 'a\\\\\\\\' ), 'a' );
		} );

		it( 'should remove trailing mixed slashes', () => {
			assert.equal( str.untrailingslashit( 'a/\\' ), 'a' );
			assert.equal( str.untrailingslashit( 'a\\/\\///\\\\//' ), 'a' );
		} );
	} );

	describe( 'trailingslashit', () => {
		// Copied from https://core.trac.wordpress.org/browser/tags/4.7/tests/phpunit/tests/formatting/Slashit.php?order=name
		it( 'should add trailing slash', () => {
			assert.equal( str.trailingslashit( 'a' ), 'a/' );
		} );

		it( 'should not add trailing slash if one exists', () => {
			assert.equal( str.trailingslashit( 'a/' ), 'a/' );
		} );

		it( 'should converts trailing backslash to slash if one exists', () => {
			assert.equal( str.trailingslashit( 'a\\' ), 'a/' );
		} );
	} );

	describe( 'matchAll', () => {
		it( 'should match all sections with their content in readme.txt', () => {
			const input = '== a section ==\n\nfoo\n\n== another section ==\n\nbar.\n';
			const re = /(?:^|\n)== ([\s\S]+?) ==\n([\s\S]+?)(?=\n== |$)/g;
			const expected = [
				[ '== a section ==\n\nfoo\n', 'a section', '\nfoo\n' ],
				[ '\n== another section ==\n\nbar.\n', 'another section', '\nbar.\n' ]
			];

			assert.deepEqual( str.matchAll( input, re ), expected );
		} );

		it( 'should match all missing items in svn status', () => {
			const input = '!   path/to/file\n?  path/to-another-file\n!   path/to/missing-file\n';
			const re = /(?:^|[\n\r]+)!\s+([^\n\r]+?)(?=[\n\r]+|$)/g;
			const expected = [
				[ '!   path/to/file', 'path/to/file' ],
				[ '\n!   path/to/missing-file', 'path/to/missing-file' ]
			];

			assert.deepEqual( str.matchAll( input, re ), expected );
		} );
	} );

	describe( 'notEmpty', () => {
		it( 'should return true if string is not empty', () => {
			assert.isTrue( str.notEmpty( 'foo' ) );
			assert.isTrue( str.notEmpty( ' foo' ) );
			assert.isTrue( str.notEmpty( '0' ) );
			assert.isTrue( str.notEmpty( ' ' ) );
		} );

		it( 'should return false if string or array is empty', () => {
			assert.isFalse( str.notEmpty( '' ) );
			assert.isFalse( str.notEmpty( [] ) );
		} );
	} );
} );
