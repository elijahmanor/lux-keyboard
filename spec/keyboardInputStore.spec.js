const { Store, dispatch } = lux;

describe( "keyboardInputStore", () => {
	let store;

	beforeEach( () => {
		store = proxyquire( "../src/keyboardInputStore", {
			"lux.js": { Store } // was getting multiple lux.js instances on first run
		} );
	} );

	afterEach( () => {
		store.dispose();
	} );

	it( "should have initial state", () => {
		store.getState().should.eql( {
			enabled: true,
			scopeStack: [],
			keyMaps: {
				global: {}
			}
		} );
	} );

	describe( "handlers", () => {
		describe( "disableKeyboardShortcuts", () => {
			it( "should set the enabled state to false", () => {
				dispatch( "disableKeyboardShortcuts" );

				store.getState().enabled.should.be.false();
			} );
		} );

		describe( "enableKeyboardShortcuts", () => {
			it( "should set the enabled state to false", () => {
				dispatch( "enableKeyboardShortcuts" );

				store.getState().enabled.should.be.true();
			} );
		} );

		describe( "receiveKeyMaps", () => {
			it( "should merge new keymaps with existing", () => {
				dispatch( "receiveKeyMaps", {
					test: {
						shortcuts: {
							testShortcut: {
								keys: [ "a" ],
								includeInputs: false,
								info: "test.shortcuts.testShortcut"
							}
						}
					},
					global: {
						shortcuts: {
							anotherOne: {
								keys: [ "b" ],
								info: "global.shortcuts.anotherOne"
							}
						}
					}
				} );

				store.getState().keyMaps.should.eql( {
					test: {
						shortcuts: {
							testShortcut: {
								keys: [ "a" ],
								includeInputs: false,
								info: "test.shortcuts.testShortcut"
							}
						}
					},
					global: {
						shortcuts: {
							anotherOne: {
								keys: [ "b" ],
								info: "global.shortcuts.anotherOne"
							}
						}
					}
				} );
			} );
		} );

		describe( "activateScope", () => {
			beforeEach( () => {
				Object.assign( store.getState().keyMaps, {
					test: {
						shortcuts: {
							testShortcut: {
								keys: [ "a" ],
								includeInputs: false,
								info: "test.shortcuts.testShortcut"
							}
						}
					},
					testTwo: {
						isExclusive: false,
						shortcuts: {
							testShortcut: {
								keys: [ "b" ],
								info: "testTwo.shortcuts.testShortcut"
							}
						}
					}
				} );
			} );

			describe( "when the scope is exclusive", () => {
				describe( "and the scope is not a base scope", () => {
					it( "should add as a new scope", () => {
						const state = store.getState();
						state.scopeStack = [ [ "testTwo" ] ];

						dispatch( "activateScope", "test" );

						state.scopeStack.should.eql( [
							[ "testTwo" ],
							[ "test" ]
						] );
					} );
				} );

				describe( "and the scope is a base scope", () => {
					it( "should add the scope to the beginning of outer stack", () => {
						const state = store.getState();
						state.scopeStack = [ [ "testTwo" ] ];
						state.keyMaps.test = { baseScope: true };

						dispatch( "activateScope", "test" );

						state.scopeStack.should.eql( [
							[ "test" ],
							[ "testTwo" ]
						] );
					} );
				} );
			} );

			describe( "when the scopeStack is empty", () => {
				describe( "and the scope is not a base scope", () => {
					it( "should add the scope to the stack", () => {
						const state = store.getState();

						dispatch( "activateScope", "test" );

						state.scopeStack.should.eql( [
							[ "test" ]
						] );
					} );
				} );

				describe( "and the scope is a base scope", () => {
					it( "should add the scope to the beginning of outer stack", () => {
						const state = store.getState();
						state.keyMaps.test = { baseScope: true };
						dispatch( "activateScope", "test" );

						state.scopeStack.should.eql( [
							[ "test" ]
						] );
					} );
				} );
			} );

			describe( "when the scopeStack has items and scope is not exclusive", () => {
				describe( "and the scope is not a base scope", () => {
					it( "should add to the existing scope", () => {
						const state = store.getState();
						state.scopeStack = [ [ "test" ] ];

						dispatch( "activateScope", "testTwo" );

						state.scopeStack.should.eql( [
							[ "test", "testTwo" ]
						] );
					} );
				} );

				describe( "and the scope is a base scope", () => {
					it( "should add the scope to the beginning of the last scope array in the stack", () => {
						const state = store.getState();
						state.scopeStack = [ [ "first" ], [ "test" ] ];
						state.keyMaps.testTwo = { baseScope: true, isExclusive: false };

						dispatch( "activateScope", "testTwo" );

						state.scopeStack.should.eql( [
							[ "first" ],
							[ "testTwo", "test" ]
						] );
					} );
				} );
			} );
		} );

		describe( "deactivateScope", () => {
			describe( "when the current scope array is empty after removing this scope", () => {
				it( "should remove the current scope array", () => {
					const state = store.getState();
					state.scopeStack = [ [ "test" ], [ "testTwo" ] ];

					dispatch( "deactivateScope", "testTwo" );

					state.scopeStack.should.eql( [ [ "test" ] ] );
				} );
			} );

			describe( "when the current scope array still has another value when removing this scope", () => {
				it( "should retain the current scope array", () => {
					const state = store.getState();
					state.scopeStack = [ [ "testThree" ], [ "test", "testTwo" ] ];

					dispatch( "deactivateScope", "testTwo" );

					state.scopeStack.should.eql( [ [ "testThree" ], [ "test" ] ] );
				} );
			} );

			describe( "when removing a scope that is not the active scope", () => {
				describe( "when the scope group ends up empty", () => {
					it( "should leave other scopes and remove the matching scope group", () => {
						const state = store.getState();
						state.scopeStack = [ [ "testThree" ], [ "test", "testTwo" ], [ "testZero" ] ];

						dispatch( "deactivateScope", "testTwo" );

						state.scopeStack.should.eql( [ [ "testThree" ], [ "test" ], [ "testZero" ] ] );
					} );
				} );

				describe( "when the scope group still has additional scopes", () => {
					it( "should leave other scopes and the matching scope group (minus the supplied scope)", () => {
						const state = store.getState();
						state.scopeStack = [ [ "testThree" ], [ "test" ], [ "testZero" ] ];

						dispatch( "deactivateScope", "test" );

						state.scopeStack.should.eql( [ [ "testThree" ], [ "testZero" ] ] );
					} );
				} );
			} );
		} );
	} );

	describe( "helpers", () => {
		describe( "when calling getCurrentKeyMap", () => {
			describe( "when not enabled", () => {
				it( "should return an empty list of handlers", () => {
					store.getState().enabled = false;

					store.getCurrentKeyMap().should.eql( {} );
				} );
			} );

			describe( "when enabled", () => {
				describe( "when there is no active scope", () => {
					describe( "when there are no global shortcuts", () => {
						it( "should return an empty list of handlers", () => {
							store.getCurrentKeyMap().should.eql( {} );
						} );
					} );

					describe( "when there are global shortcuts", () => {
						it( "should return an empty list of handlers", () => {
							store.getState().keyMaps = {
								global: {
									shortcuts: {
										handleRequestToClose: {
											keys: [ "esc" ],
											info: "default.shortcuts.closeDialog",
											preventDefault: false
										}
									}
								}
							};

							store.getCurrentKeyMap().should.eql( {
								esc: {
									actionName: "handleRequestToClose",
									includeInputs: true,
									preventDefault: false
								}
							} );
						} );
					} );
				} );

				describe( "when there is an active scope", () => {
					it( "should return the handlers", () => {
						Object.assign( store.getState(), {
							keyMaps: {
								global: {
									shortcuts: {
										handleRequestToClose: {
											keys: [ "a", "esc" ],
											info: "default.shortcuts.closeDialog",
											preventDefault: false
										}
									}
								},
								test: {
									shortcuts: {
										testShortcut: {
											keys: [ "a", "b" ],
											includeInputs: false,
											info: "test.shortcuts.testShortcut"
										},
										anotherTestShortcut: {
											keys: [ "c", "d" ],
											info: "test.shortcuts.anotherTestShortcut"
										}
									}
								},
								testTwo: {
									isExclusive: false,
									shortcuts: {
										testShortcut: {
											keys: "e",
											info: "testTwo.shortcuts.testShortcut"
										}
									}
								},
								testThree: {
									shortcuts: {
										testShortcut: {
											keys: [ "f" ],
											info: "testThree.shortcuts.testShortcut"
										}
									}
								}
							},
							scopeStack: [ [ "testThree" ], [ "test", "testTwo" ] ]
						} );

						store.getCurrentKeyMap().should.eql( {
							a: { actionName: "testShortcut", includeInputs: false, preventDefault: true },
							b: { actionName: "testShortcut", includeInputs: false, preventDefault: true },
							c: { actionName: "anotherTestShortcut", includeInputs: true, preventDefault: true },
							d: { actionName: "anotherTestShortcut", includeInputs: true, preventDefault: true },
							e: { actionName: "testShortcut", includeInputs: true, preventDefault: true },
							esc: { actionName: "handleRequestToClose", includeInputs: true, preventDefault: false }
						} );
					} );
				} );
			} );
		} );
	} );
} );
