/**
 * External dependencies
 */
import { expect } from 'chai';
import fs from 'fs-extra';
import { resolve } from 'path';
import rimraf from 'rimraf';
import sinon from 'sinon';
import temp from 'temp';

/**
 * Internal dependencies
 */
import generatePot from '../../lib/commands/generate-pot.js';
import logger from '../../lib/utils/logger';

describe( 'command: wpt generate:pot', () => {
	const fixtureDir = resolve( __dirname, '../fixtures' );

	let cwd, tmp;
	let pluginDir, themeDir;
	let sandbox, args, config;

	beforeEach( () => {
		cwd = process.cwd();
		tmp = temp.mkdirSync( 'wpt-test-generate-pot' );

		pluginDir = resolve( tmp, 'plugin' );
		fs.mkdirSync( pluginDir );
		fs.copySync( resolve( fixtureDir, 'plugin' ), pluginDir );

		themeDir = resolve( tmp, 'theme' );
		fs.mkdirSync( themeDir );
		fs.copySync( resolve( fixtureDir, 'theme' ), themeDir );

		process.chdir( tmp );

		args = config = {};
		sandbox = sinon.sandbox.create();
		sandbox.stub( logger, 'info' );
		sandbox.stub( logger, 'error' );
	} );

	afterEach( done => {
		sandbox.restore();
		process.chdir( cwd );
		rimraf( tmp, done );
	} );

	it( 'should complain when plugin main file is missing', () => {
		generatePot( args, config );

		expect(
			logger.error.calledWith( 'Error: Missing plugin main file. Specify it via --file or define `files.main` in .wpt.yml.' )
		).to.be.true;
	} );

	it( 'should report an error if specified plugin main file does not exist', () => {
		args.file = 'file-does-not-exist';
		generatePot( args, config );

		expect(
			logger.error.calledWithMatch( 'Error: File ./file-does-not-exist does not exist.' )
		).to.be.true;
	} );

	it( 'should generate pot file for the plugin', () => {
		config.file = resolve( pluginDir, 'example.php' );
		process.chdir( pluginDir );

		generatePot( args, config );

		const potFile = resolve( pluginDir, 'languages/example.pot' );
		expect( fs.existsSync( potFile ) ).to.be.true;

		const pot = fs.readFileSync( potFile, 'utf-8' );
		expect( pot ).to.have.string( 'msgid "Howdy!"' );
		expect( pot ).to.have.string( 'msgid "Your Ad here"' );
		expect( pot ).to.have.string( 'msgid "Blog Options"' );
		expect( pot ).to.have.string( 'msgid "Using this option you will make a fortune!"' );
		expect( pot ).to.have.string( 'msgid "We deleted %d spam message."' );
		expect( pot ).to.have.string( 'msgid_plural "We deleted %d spam messages."' );
		expect( pot ).to.have.string( 'msgctxt "column name"' );
	} );

	it( 'should generate pot file for the theme', () => {
	} );
} );
