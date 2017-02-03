/**
 * External dependencies
 */
import { assert, expect } from 'chai';
import fs from 'fs-extra';
import { resolve } from 'path';
import rimraf from 'rimraf';
import shell from 'shelljs';
import sinon from 'sinon';
import spawn from 'cross-spawn';
import temp from 'temp';

/**
 * Internal dependencies
 */
import exec from '../../src/utils/exec';
import git from '../../src/utils/git';
import logger from '../../src/utils/logger';

describe( 'utils: git', () => {
	const pluginDir = resolve( __dirname, '../fixtures/plugin' );
	const cwd = process.cwd();
	const returnNull = () => {
		return null;
	};
	const returnChildError = () => {
		return {
			stderr: 'something went wrong',
			status: 1,
		};
	};
	const createTestTag = () => {
		git.tag( 'test' );
	};
	const createTestBranch = () => {
		exec.git( 'checkout', '-b', 'test' );
	};
	const checkoutTo = branch => {
		return () => {
			git.checkout( branch );
		};
	};
	const push = branch => {
		return () => {
			git.push( branch );
		};
	};

	let tmp, sandbox;

	const createTestRemote = () => {
		const remote = resolve( tmp, 'wpt-test-utils-git-remote' );
		fs.mkdirSync( remote );
		exec.git( 'clone', tmp, remote );
		exec.git( 'remote', 'add', 'origin', remote );
	};

	beforeEach( () => {
		tmp = temp.mkdirSync( 'wpt-test-utils-git' );
		fs.copySync( pluginDir, tmp );
		process.chdir( tmp );

		exec.git( 'init', '.' );
		exec.git( 'add', '.' );
		exec.git( 'commit', '-m', '"init"' );

		sandbox = sinon.sandbox.create();
		sandbox.stub( logger, 'warning' );
	} );

	afterEach( done => {
		sandbox.restore();
		process.chdir( cwd );
		rimraf( tmp, done );
	} );

	describe( 'tagExists', () => {
		it( 'should return false if git does not exist', () => {
			sandbox.stub( shell, 'which', returnNull );
			assert.isFalse( git.tagExists( 'test' ) );
		} );

		it( 'should return false if tag does not exist', () => {
			assert.isFalse( git.tagExists( 'test' ) );
		} );

		it( 'should return true if tag exists', () => {
			createTestTag();
			assert.isTrue( git.tagExists( 'test' ) );
		} );
	} );

	describe( 'tag', () => {
		it( 'should complain if git does not exist', () => {
			sandbox.stub( shell, 'which', returnNull );
			assert.throws( createTestTag, Error, 'git is not available' );
		} );

		it( 'should complain if git tag exited with non-zero code', () => {
			sandbox.stub( spawn, 'sync', returnChildError );
			assert.throws( createTestTag, Error, 'something went wrong' );
		} );

		it( 'should create tag if tag does not exist', () => {
			createTestTag();
			assert.isTrue( git.tagExists( 'test' ) );
		} );

		it( 'should warn if tag already exists', () => {
			createTestTag();
			createTestTag();
			expect( logger.warning.calledOnce ).to.be.true;
			expect( logger.warning.calledWith( 'tag test already exists.' ) ).to.be.true;
		} );
	} );

	describe( 'getCurrentBranch', () => {
		it( 'should complain if git does not exist', () => {
			sandbox.stub( shell, 'which', returnNull );
			assert.throws( git.getCurrentBranch, Error, 'Not on any branch. Maybe in "detached HEAD" state.' );
		} );

		it( 'should complain if git symbolif-ref exited with non-zero code', () => {
			sandbox.stub( spawn, 'sync', returnChildError );
			assert.throws( git.getCurrentBranch, Error, 'Not on any branch. Maybe in "detached HEAD" state.' );
		} );

		it( 'should complain if current branch in "detached HEAD" state', () => {
			createTestTag();
			git.checkout( 'test' );
			assert.throws( git.getCurrentBranch, Error, 'Not on any branch. Maybe in "detached HEAD" state.' );
		} );

		it( 'should return current branch name if everything is okay', () => {
			assert.equal( git.getCurrentBranch(), 'master' );
		} );
	} );

	describe( 'checkout', () => {
		it( 'should complain if git does not exists', () => {
			sandbox.stub( shell, 'which', returnNull );
			assert.throws( git.checkout, Error, 'git is not available' );
		} );

		it( 'should complain if git checkout exited with non-zero code', () => {
			sandbox.stub( spawn, 'sync', returnChildError );
			assert.throws( git.checkout, Error, 'something went wrong' );
		} );

		it( 'should complain if the branch to checkout does not exist', () => {
			assert.throws( checkoutTo( 'test' ), Error, "error: pathspec 'test' did not match any file(s) known to git.\n" );
		} );

		it( 'should switch to the specified branch', () => {
			createTestBranch();
			git.checkout( 'test' );
			assert.equal( git.getCurrentBranch(), 'test' );
			assert.doesNotThrow( checkoutTo( 'test' ), Error );
		} );
	} );

	describe( 'checkUncommittedChanges', () => {
		it( 'should complain if there are uncommitted changes', () => {
			fs.removeSync( resolve( tmp, 'example.php' ) );
			assert.throws( git.checkUncommittedChanges, Error, 'There are uncommited changes.' );
		} );

		it( 'should not complain if there is no uncommitted change', () => {
			assert.doesNotThrow( git.checkUncommittedChanges, Error );
		} );
	} );

	describe( 'push', () => {
		it( 'should complain if git does not exists', () => {
			sandbox.stub( shell, 'which', returnNull );
			assert.throws( push( 'master' ), Error, 'git is not available' );
		} );

		it( 'should complain if git push exited with non-zero code', () => {
			sandbox.stub( spawn, 'sync', returnChildError );
			assert.throws( push( 'master' ), Error, 'something went wrong' );
		} );

		it( 'should complain if the branch to push does not exist', () => {
			const err = 'error: src refspec test does not match any.\nerror: ' +
				'failed to push some refs';

			createTestRemote();
			assert.throws( push( 'test' ), Error, new RegExp( err ) );
		} );

		it( 'should complain if the remote origin does not exist', () => {
			const err = "fatal: 'origin' does not appear to be a git " +
				'repository\nfatal: Could not read from remote repository.\n\n' +
				'Please make sure you have the correct access rights\nand the ' +
				'repository exists.\n';

			assert.throws( push( 'master' ), Error, err );
		} );

		it( 'should not complain if the remote origin exist', () => {
			createTestRemote();
			assert.doesNotThrow( push( 'master' ), Error );
		} );
	} );
} );
