import {
  atomWithInfiniteQuery,
  atomWithMutation,
  atomWithMutationState,
  atomWithQuery,
  atomWithSuspenseInfiniteQuery,
  atomWithSuspenseQuery,
  queryClientAtom,
} from '../src/index'

describe('basic spec', () => {
  it('should export functions', () => {
    expect(queryClientAtom).toBeDefined()
    expect(atomWithQuery).toBeDefined()
    expect(atomWithInfiniteQuery).toBeDefined()
    expect(atomWithMutation).toBeDefined()
    expect(atomWithSuspenseQuery).toBeDefined()
    expect(atomWithSuspenseInfiniteQuery).toBeDefined()
    expect(atomWithMutationState).toBeDefined()
  })
})
