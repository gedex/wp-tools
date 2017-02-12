/**
 * External dependencies
 */
import { assert } from 'chai';
import { resolve } from 'path';

/**
 * Internal depedencies
 */
import fh from '../../lib/utils/file-header';

describe( 'utils: fileHeader', function() {
	const pluginFile = resolve( __dirname, '../fixtures/plugin.php' );
	const pluginFileNoHeader = resolve( __dirname, '../fixtures/plugin-no-header.php' );
	const themeCss = resolve( __dirname, '../fixtures/style.css' );
	const themeCssNoHeader = resolve( __dirname, '../fixtures/style-no-header.css' );

	describe( 'headers', () => {
		it( 'should return expected plugin and theme headers', () => {
			const plugin = {
				Name: 'Plugin Name',
				PluginURI: 'Plugin URI',
				Version: 'Version',
				Description: 'Description',
				Author: 'Author',
				AuthorURI: 'Author URI',
				TextDomain: 'Text Domain',
				DomainPath: 'Domain Path',
				Network: 'Network',
				License: 'License',
				LicenseURI: 'License URI'
			};
			const theme = {
				Name: 'Theme Name',
				ThemeURI: 'Theme URI',
				Version: 'Version',
				Description: 'Description',
				Author: 'Author',
				AuthorURI: 'Author URI',
				Template: 'Template',
				Status: 'Status',
				Tags: 'Tags',
				TextDomain: 'Text Domain',
				DomainPath: 'Domain Path',
				License: 'License',
				LicenseURI: 'License URI'
			};
			const expected = {
				plugin,
				theme
			};
			assert.deepEqual( fh.headers, expected );
		} );
	} );

	describe( 'getFileData', () => {
		it( 'should return plugin header data from main plugin file', () => {
			const actual = fh.getFileData( pluginFile, 'plugin' );
			const expected = {
				Name: 'ExamplePlugin',
				PluginURI: 'https://example.com',
				Version: '0.1.0',
				Description: 'Example plugin for wpt tests.',
				Author: 'WPT',
				AuthorURI: 'https://example.com',
				TextDomain: 'example',
				DomainPath: '/languages/',
				Network: '',
				License: 'GPL v2 or later',
				LicenseURI: 'https://www.gnu.org/licenses/gpl-2.0.html'
			};
			assert.deepEqual( actual, expected );
		} );

		it( 'should return empty string on each header key if no matching information found in main plugin file', () => {
			const actual = fh.getFileData( pluginFileNoHeader, 'plugin' );
			const expected = {
				Name: '',
				PluginURI: '',
				Version: '',
				Description: '',
				Author: '',
				AuthorURI: '',
				TextDomain: '',
				DomainPath: '',
				Network: '',
				License: '',
				LicenseURI: ''
			};

			assert.deepEqual( actual, expected );
		} );

		it( 'should return theme header data from main theme\'s style.css', () => {
			const actual = fh.getFileData( themeCss, 'theme' );
			const expected = {
				Name: 'Twenty Sixteen',
				ThemeURI: 'https://wordpress.org/themes/twentysixteen/',
				Version: '1.3',
				Description: 'Twenty Sixteen is a modernized take on an ever-popular ' +
					'WordPress layout — the horizontal masthead with an optional right ' +
					'sidebar that works perfectly for blogs and websites. ' +
					'It has custom color options with beautiful default color schemes, ' +
					'a harmonious fluid grid using a mobile-first approach, and impeccable ' +
					'polish in every detail. Twenty Sixteen will make your WordPress look ' +
					'beautiful everywhere.',
				Author: 'the WordPress team',
				AuthorURI: 'https://wordpress.org/',
				Template: '',
				Status: '',
				Tags: 'one-column, two-columns, right-sidebar, accessibility-ready, ' +
					'custom-background, custom-colors, custom-header, custom-menu, ' +
					'editor-style, featured-images, flexible-header, microformats, ' +
					'post-formats, rtl-language-support, sticky-post, threaded-comments, ' +
					'translation-ready, blog',
				TextDomain: 'twentysixteen',
				DomainPath: '',
				License: 'GNU General Public License v2 or later',
				LicenseURI: 'http://www.gnu.org/licenses/gpl-2.0.html'
			};

			assert.deepEqual( actual, expected );
		} );

		it( 'should return empty string on each header key if no matching information found in theme\'s style.css', () => {
			const actual = fh.getFileData( themeCssNoHeader, 'theme' );
			const expected = {
				Name: '',
				ThemeURI: '',
				Version: '',
				Description: '',
				Author: '',
				AuthorURI: '',
				Template: '',
				Status: '',
				Tags: '',
				TextDomain: '',
				DomainPath: '',
				License: '',
				LicenseURI: ''
			};

			assert.deepEqual( actual, expected );
		} );

		it( 'should throw error if filepath is empty', () => {
			const emptyFilePathCall = () => {
				fh.getFileData( '' );
			};

			assert.throws(
				emptyFilePathCall,
				Error,
				'Missing plugin main file. Specify it via --file or define `files.main` in .wpt.yml.',
			);
		} );

		it( 'should throw error if filepath does not exist', () => {
			const filePathDoesNotExistCall = () => {
				fh.getFileData( 'this-file-does-not-exists' );
			};

			assert.throws(
				filePathDoesNotExistCall,
				Error,
				/File \.\/this-file-does-not-exists does not exist/,
			);
		} );

		it( 'should default the context to "plugin" if not specified even if the filepath refers to theme\'s style.css', () => {
			const actual = fh.getFileData( themeCss );
			const expected = {
				Name: '',
				PluginURI: '',
				Version: '1.3',
				Description: 'Twenty Sixteen is a modernized take on an ever-popular ' +
					'WordPress layout — the horizontal masthead with an optional right ' +
					'sidebar that works perfectly for blogs and websites. ' +
					'It has custom color options with beautiful default color schemes, ' +
					'a harmonious fluid grid using a mobile-first approach, and impeccable ' +
					'polish in every detail. Twenty Sixteen will make your WordPress look ' +
					'beautiful everywhere.',
				Author: 'the WordPress team',
				AuthorURI: 'https://wordpress.org/',
				TextDomain: 'twentysixteen',
				DomainPath: '',
				Network: '',
				License: 'GNU General Public License v2 or later',
				LicenseURI: 'http://www.gnu.org/licenses/gpl-2.0.html'
			};
			assert.deepEqual( actual, expected );
		} );

		it( 'should return extra headers if passed and found in the main file', () => {
			const extraHeaders = {
				'Requires at least': 'Requires at least',
				'Tested up to': 'Tested up to'
			};
			const actual = fh.getFileData( pluginFile, 'plugin', extraHeaders );
			const expected = {
				Name: 'ExamplePlugin',
				PluginURI: 'https://example.com',
				Version: '0.1.0',
				Description: 'Example plugin for wpt tests.',
				Author: 'WPT',
				AuthorURI: 'https://example.com',
				'Requires at least': '4.4',
				'Tested up to': '4.7',
				TextDomain: 'example',
				DomainPath: '/languages/',
				Network: '',
				License: 'GPL v2 or later',
				LicenseURI: 'https://www.gnu.org/licenses/gpl-2.0.html'
			};
			assert.deepEqual( actual, expected );
		} );
	} );
} );
