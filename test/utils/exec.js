/**
 * External dependencies
 */
import { assert, expect } from 'chai';
import shell from 'shelljs';
import sinon from 'sinon';
import { spawn } from 'cross-spawn';

/**
 * Internal dependencies
 */
import exec from '../../src/utils/exec';

describe( 'utils: exec', () => {
	let sandbox;

	const returnTrue = () => {
		return true;
	};

	const returnNull = () => {
		return null;
	};

	const returnChildError = () => {
		return {
			stderr: '',
			status: 1,
		};
	};

	const returnChildSuccess = () => {
		return {
			stderr: '',
			status: 0,
			stdout: 'Success'
		};
	};

	const commandNotAvailableCase = ( cmd ) => {
		return () => {
			sandbox.stub( shell, 'which', returnNull );
			assert.throws( exec[ cmd ], Error, `${ cmd } is not available` );
		};
	};

	const commandExitedWithNonZeroCase = ( cmd ) => {
		return () => {
			sandbox.stub( shell, 'which', returnTrue );
			sandbox.stub( spawn, 'sync', returnChildError );
			assert.throws( exec[ cmd ], Error, `${ cmd } exited with exit code 1` );
		};
	};

	const commandReturnsStdoutCase = ( cmd ) => {
		return () => {
			sandbox.stub( shell, 'which', returnTrue );
			sandbox.stub( spawn, 'sync', returnChildSuccess );
			assert.equal( exec[ cmd ](), 'Success' );
		};
	};

	const spawnSyncExpectedArgsCase = ( cmd ) => {
		return () => {
			sandbox.stub( shell, 'which', returnTrue );
			sandbox.stub( spawn, 'sync', returnChildSuccess );
			exec[ cmd ]();
			expect( spawn.sync.calledWith( cmd ) ).to.be.true;
			exec[ cmd ]( '-h', '--other-flag', 'foo', 'bar' );
			expect( spawn.sync.calledWith( cmd, [ '-h', '--other-flag', 'foo', 'bar' ] ) );
		};
	};

	const describeFor = ( cmd ) => {
		describe( cmd, () => {
			it( `should complain if ${ cmd } is not available`, commandNotAvailableCase( cmd ) );
			it( `should complain if ${ cmd } exited with non-zero code`, commandExitedWithNonZeroCase( cmd ) );
			it( `should return stdout from ${ cmd }`, commandReturnsStdoutCase( cmd ) );
			it( `should pass "${ cmd }" as command name and the rest of args to spawn.sync`, spawnSyncExpectedArgsCase( cmd ) );
		} );
	};

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describeFor( 'php' );
	describeFor( 'git' );
	describeFor( 'svn' );
} );
