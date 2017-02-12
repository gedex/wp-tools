/**
 * External dependencies
 */
import { assert } from 'chai';
import fs from 'fs-extra';
import { resolve } from 'path';
import sinon from 'sinon';
import temp from 'temp';

/**
 * Internal dependencies
 */
import logger from '../../src/utils/logger';
import readme from '../../src/utils/readme';

describe( 'utils: readme', () => {
	const fixtureDir = resolve( __dirname, '../fixtures' );
	const getReadme = filename => {
		return fs.readFileSync( resolve( fixtureDir, filename ), 'utf8' );
	};

	const validReadme = getReadme( 'readme-valid.txt' );
	const missingPluginName = getReadme( 'readme-missing-plugin-name.txt' );
	const missingMeta = getReadme( 'readme-missing-meta.txt' );
	const missingSection = getReadme( 'readme-missing-section.txt' );

	let tmp, cwd, sandbox;

	beforeEach( () => {
		cwd = process.cwd();
		tmp = temp.mkdirSync( 'wpt-test-util-readme' );
		fs.copySync( resolve( fixtureDir, 'plugin' ), tmp );

		process.chdir( tmp );

		sandbox = sinon.sandbox.create();
		sandbox.stub( logger, 'warning' );
	} );

	afterEach( () => {
		sandbox.restore();
		process.chdir( cwd );
		fs.removeSync( tmp );
	} );

	describe( 'parse', () => {
		it( 'returns title on valid readme.txt', () => {
			const out = readme.parse( validReadme );
			assert.equal( out.title, 'Plugin Name' );
		} );

		it( 'returns short description of valid readme.txt', () => {
			const out = readme.parse( validReadme );
			assert.equal(
				out.desc,
				'Here is a short description of the plugin.  ' +
				'This should be no more than 150 characters.  No markup here.'
			);
		} );

		it( 'returns meta data of valid readme.txt', () => {
			const out = readme.parse( validReadme );

			/* eslint-disable quote-props */
			const meta = {
				'Contributors': [ 'akeda', 'automattic' ],
				'Donate link': 'http://example.com/',
				'Tags': [ 'comments', 'spam' ],
				'Requires at least': '4.6',
				'Tested up to': '4.7',
				'Stable tag': '4.3',
				'License': 'GPLv2 or later',
				'License URI': 'https://www.gnu.org/licenses/gpl-2.0.html'
			};
			/* eslint-enable quote-props */

			assert.deepEqual( out.meta, meta );
		} );

		it( 'returns array of sections of valid readme.txt', () => {
			const out = readme.parse( validReadme );
			assert.isArray( out.sections );
			assert.equal( 8, out.sections.length );
		} );

		it( 'returns Description section in out.sections[ 0 ] of valid readme.txt', () => {
			const out = readme.parse( validReadme );
			const sec = out.sections[ 0 ];

			assert.equal( sec.heading, 'Description' );
			assert.match( sec.body, /^This is the long description\.  No limit, and/ );
			assert.match( sec.body, /stable version, in order to eliminate any doubt\.$/ );
			assert.sameMembers( sec.subsections, [] );
		} );

		it( 'returns Installation section in out.sections[ 1 ] of valid readme.txt', () => {
			const out = readme.parse( validReadme );
			const sec = out.sections[ 1 ];

			assert.equal( sec.heading, 'Installation' );
			assert.match(
				sec.body,
				/^This section describes how to install the plugin and get it working\./
			);
			assert.match(
				sec.body,
				/Include any steps that might be needed for explanatory purposes\)$/
			);
			assert.sameMembers( sec.subsections, [] );
		} );

		it( 'returns FAQ section in out.sections[ 2 ] of valid readme.txt', () => {
			const out = readme.parse( validReadme );
			const sec = out.sections[ 2 ];

			assert.equal( sec.heading, 'Frequently Asked Questions' );
			assert.equal( sec.body, null );

			const subsections = [
				{
					heading: 'A question that someone might have',
					body: 'An answer to that question.'
				},
				{
					heading: 'What about foo bar?',
					body: 'Answer to foo bar dilemma.'
				}
			];
			assert.deepEqual( sec.subsections, subsections );
		} );

		it( 'returns Screenshots section of valid readme.txt', () => {
			const out = readme.parse( validReadme );
			const sec = out.sections[ 3 ];
			assert.equal( sec.heading, 'Screenshots' );
			assert.match( sec.body, /^1\. This screen shot description corresponds/ );
			assert.match( sec.body, /2\. This is the second screen shot$/ );
			assert.sameMembers( sec.subsections, [] );
		} );

		it( 'returns Changelog section of valid readme.txt', () => {
			const out = readme.parse( validReadme );
			const sec = out.sections[ 4 ];
			assert.equal( sec.heading, 'Changelog' );
			assert.equal( sec.body, null );

			const a = sec.subsections[ 0 ];
			assert.equal( a.heading, '1.0' );
			assert.match( a.body, /^\* A change since the previous version\./ );
			assert.match( a.body, /\* Another change\.$/ );

			const b = sec.subsections[ 1 ];
			assert.equal( b.heading, '0.5' );
			assert.equal( b.body, '* List versions from most recent at top to oldest at bottom.' );
		} );

		it( 'returns Upgrade Notice section of valid readme.txt', () => {
			const out = readme.parse( validReadme );
			const sec = out.sections[ 5 ];
			assert.equal( sec.heading, 'Upgrade Notice' );
			assert.equal( sec.body, null );

			const a = sec.subsections[ 0 ];
			assert.equal( a.heading, '1.0' );
			const ab = 'Upgrade notices describe the reason a user should upgrade.  ' +
				'No more than 300 characters.';
			assert.equal( a.body, ab );

			const b = sec.subsections[ 1 ];
			assert.equal( b.heading, '0.5' );
			const bb = 'This version fixes a security related bug.  Upgrade immediately.';
			assert.equal( b.body, bb );
		} );

		it( 'returns Arbitrary section of valid readme.txt', () => {
			const out = readme.parse( validReadme );
			const sec = out.sections[ 6 ];

			assert.equal( sec.heading, 'Arbitrary section' );
			assert.match( sec.body, /^You may provide arbitrary sections/ );
			assert.match( sec.body, /the built-in sections outlined above\.$/ );
			assert.sameMembers( sec.subsections, [] );
		} );

		it( 'throws error when plugin name header is missing', () => {
			const fn = () => {
				readme.parse( missingPluginName );
			};
			assert.throws( fn, Error, 'Malformed metadata block' );
		} );

		it( 'throws error when meta block is missing', () => {
			const fn = () => {
				readme.parse( missingMeta );
			};
			assert.throws( fn, Error, 'Parse error meta block' );
		} );

		it( 'throws error when no section after short description', () => {
			const fn = () => {
				readme.parse( missingSection );
			};
			assert.throws( fn, Error, 'Failed to parse sections' );
		} );
	} );

	describe( 'getContent', () => {
		it( 'should returns content of readme.txt', () => {
			const src = resolve( fixtureDir, 'readme-valid.txt' );
			const dst = resolve( tmp, 'readme.txt' );
			fs.copySync( src, dst );

			assert.equal( readme.getContent(), validReadme );
		} );

		it( 'should returns content of README.txt', () => {
			const src = resolve( fixtureDir, 'readme-valid.txt' );
			const dst = resolve( tmp, 'README.txt' );
			fs.copySync( src, dst );

			assert.equal( readme.getContent(), validReadme );
		} );

		it( 'should throws error if no readme.txt or README.txt file', () => {
			assert.throws( readme.getContent, Error, 'Missing file readme.txt.' );
		} );
	} );

	describe( 'updateContent', () => {
		it( 'should update content of readme.txt', () => {
			const src = resolve( fixtureDir, 'readme-valid.txt' );
			const dst = resolve( tmp, 'readme.txt' );
			fs.copySync( src, dst );

			readme.updateContent( missingMeta );
			assert.equal( getReadme( dst ), missingMeta );
		} );

		it( 'should update content of README.txt', () => {
			const src = resolve( fixtureDir, 'readme-valid.txt' );
			const dst = resolve( tmp, 'README.txt' );
			fs.copySync( src, dst );

			readme.updateContent( missingMeta );
			assert.equal( getReadme( dst ), missingMeta );
		} );
	} );

	describe( 'getChangelog', () => {
		it( 'should return latest changelog in readme.txt by specifying latest version number', () => {
			const src = resolve( fixtureDir, 'readme-valid.txt' );
			const dst = resolve( tmp, 'readme.txt' );
			fs.copySync( src, dst );

			const expected = [
				'* A change since the previous version.',
				'* Another change.',
			].join( '\n' );
			assert.equal( readme.getChangelog( '1.0' ), expected );
		} );

		it( 'should throw error if specified version is not the latest version', () => {
			const src = resolve( fixtureDir, 'readme-valid.txt' );
			const dst = resolve( tmp, 'readme.txt' );
			fs.copySync( src, dst );

			const fn = () => {
				readme.getChangelog( '0.5' );
			};
			assert.throws( fn, Error, /latest changelog in readme\.txt is not 0\.5\./ );
		} );
	} );

	describe( 'checkVersion', () => {
		it( 'should not throw error if stable tag in readme.txt matches with version in main file header', () => {
			const file = resolve( tmp, 'readme.txt' );
			const content = [
				'=== Plugin Name ===',
				'Stable tag: 0.1.0',
				'',
				'Here is a short description of the plugin.',
				'',
				'== Description ==',
				'',
				'This is the long description.',
			].join( '\n' );
			const fn = () => {
				readme.checkVersion( '0.1.0' );
			};

			fs.outputFileSync( file, content, 'utf8' );

			assert.doesNotThrow( fn, Error );
		} );

		it( 'should log a warning if stable tag is trunk', () => {
			const file = resolve( tmp, 'readme.txt' );
			const content = [
				'=== Plugin Name ===',
				'Stable tag: trunk',
				'',
				'Here is a short description of the plugin.',
				'',
				'== Description ==',
				'',
				'This is the long description.',
			].join( '\n' );
			const fn = () => {
				readme.checkVersion( '0.1.0' );
			};

			fs.outputFileSync( file, content, 'utf8' );

			assert.doesNotThrow( fn, Error );

			assert.isTrue(
				logger.warning.calledWith(
					'Stabe tag in readme.txt is "trunk" instead of 0.1.0.'
				)
			);
		} );

		it( 'should throw error if version in main file does not match with stable tag in readme.txt', () => {
			assert.ok( true );
		} );
	} );
} );
