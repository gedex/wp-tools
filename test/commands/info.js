/**
 * External dependencies
 */
import { expect } from 'chai';
import { resolve } from 'path';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import info from '../../lib/commands/info';
import logger from '../../lib/utils/logger';

describe( 'command: wpt info', () => {
	let sandbox, args, config;

	beforeEach( () => {
		args = config = {};
		sandbox = sinon.sandbox.create();
		sandbox.stub( logger, 'info' );
		sandbox.stub( logger, 'error' );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'should report an error if plugin main file is not specified in args or config', () => {
		info( args, config );

		expect(
			logger.error.calledWithMatch( 'Error: Missing plugin main file' )
		).to.be.true;
	} );

	it( 'should report an error if specified plugin main file does not exist', () => {
		args.file = 'file-does-not-exist';
		info( args, config );

		expect(
			logger.error.calledWithMatch( 'Error: File ./file-does-not-exist does not exist.' )
		).to.be.true;
	} );

	it( 'should print info of the plugin based on plugin header data', () => {
		args.file = resolve( __dirname, '../fixtures/plugin.php' );
		args.type = 'plugin';
		info( args, config );

		expect( logger.info.calledWith( 'Project Type:', 'Plugin' ) ).to.be.true;
		expect( logger.info.calledWith( 'Plugin Name:', 'ExamplePlugin' ) ).to.be.true;
		expect( logger.info.calledWith( 'Plugin URI:', 'https://example.com' ) ).to.be.true;
		expect( logger.info.calledWith( 'Version:', '0.1.0' ) ).to.be.true;
		expect( logger.info.calledWith( 'Description:', 'Example plugin for wpt tests.' ) ).to.be.true;
		expect( logger.info.calledWith( 'Author:', 'WPT' ) ).to.be.true;
		expect( logger.info.calledWith( 'Author URI:', 'https://example.com' ) ).to.be.true;
		expect( logger.info.calledWith( 'Text Domain:', 'example' ) ).to.be.true;
		expect( logger.info.calledWith( 'Domain Path:', '/languages/' ) ).to.be.true;
		expect( logger.info.calledWith( 'Network:', '' ) ).to.be.true;
		expect( logger.info.calledWith( 'License:', 'GPL v2 or later' ) ).to.be.true;
		expect( logger.info.calledWith( 'License URI:', 'https://www.gnu.org/licenses/gpl-2.0.html' ) ).to.be.true;
	} );

	it( 'should print info of the theme based on theme header data', () => {
		args.file = resolve( __dirname, '../fixtures/style.css' );
		args.type = 'theme';
		info( args, config );

		expect( logger.info.calledWith( 'Project Type:', 'Theme' ) ).to.be.true;
		expect( logger.info.calledWith( 'Theme Name:', 'Twenty Sixteen' ) ).to.be.true;
		expect( logger.info.calledWith( 'Theme URI:', 'https://wordpress.org/themes/twentysixteen/' ) ).to.be.true;
		expect( logger.info.calledWith( 'Description:', 'Twenty Sixteen is ' +
			'a modernized take on an ever-popular WordPress layout — the ' +
			'horizontal masthead with an optional right sidebar that works ' +
			'perfectly for blogs and websites. It has custom color options ' +
			'with beautiful default color schemes, a harmonious fluid grid ' +
			'using a mobile-first approach, and impeccable polish in every ' +
			'detail. Twenty Sixteen will make your WordPress look beautiful ' +
			'everywhere.'
		) ).to.be.true;
		expect( logger.info.calledWith( 'Version:', '1.3' ) ).to.be.true;
		expect( logger.info.calledWith( 'Author:', 'the WordPress team' ) ).to.be.true;
		expect( logger.info.calledWith( 'Author URI:', 'https://wordpress.org/' ) ).to.be.true;
		expect( logger.info.calledWith( 'Template:', '' ) ).to.be.true;
		expect( logger.info.calledWith( 'Status:', '' ) ).to.be.true;
		expect( logger.info.calledWith( 'Tags:', 'one-column, two-columns, ' +
			'right-sidebar, accessibility-ready, custom-background, custom-colors, ' +
			'custom-header, custom-menu, editor-style, featured-images, flexible-header, ' +
			'microformats, post-formats, rtl-language-support, sticky-post, ' +
			'threaded-comments, translation-ready, blog'
		) );
		expect( logger.info.calledWith( 'Text Domain:', 'twentysixteen' ) ).to.be.true;
		expect( logger.info.calledWith( 'Domain Path:', '' ) ).to.be.true;
		expect( logger.info.calledWith( 'License:', 'GNU General Public License v2 or later' ) ).to.be.true;
		expect( logger.info.calledWith( 'License URI:', 'http://www.gnu.org/licenses/gpl-2.0.html' ) ).to.be.true;
	} );
} );
