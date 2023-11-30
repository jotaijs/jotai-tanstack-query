import {
  atomWithInfiniteQuery,
  atomWithMutation,
  atomWithQuery,
  queryClientAtom,
} from '../src/index'

describe('basic spec', () => {
  it('should export functions', () => {
    expect(queryClientAtom).toBeDefined()
    expect(atomWithQuery).toBeDefined()
    expect(atomWithInfiniteQuery).toBeDefined()
    expect(atomWithMutation).toBeDefined()
  })
})
