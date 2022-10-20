import {
  atomsWithInfiniteQuery,
  atomsWithMutation,
  atomsWithQuery,
  queryClientAtom,
} from '../src/index'

describe('basic spec', () => {
  it('should export functions', () => {
    expect(queryClientAtom).toBeDefined()
    expect(atomsWithQuery).toBeDefined()
    expect(atomsWithInfiniteQuery).toBeDefined()
    expect(atomsWithMutation).toBeDefined()
  })
})
