import React from 'react'
import { Provider, atom, createStore } from 'jotai'

export interface QueryErrorResetBoundaryValue {
  clearReset: () => void
  isReset: () => boolean
  reset: () => void
}

export const isResetAtom = atom(false)
const valueAtom = atom(null, (_get, set, action: 'clear' | 'reset') => {
  if (action === 'clear') {
    set(isResetAtom, false)
  } else {
    set(isResetAtom, true)
  }
})

export const errorResetBoundaryAtom = atom((get) => get(isResetAtom))

export interface QueryErrorResetBoundaryProps {
  children: ((reset: () => void) => React.ReactNode) | React.ReactNode
}

const store = createStore()

store.set(isResetAtom, false)
store.set(valueAtom, 'clear')

export const QueryErrorResetBoundary = ({
  children,
}: QueryErrorResetBoundaryProps) => {
  const reset = () => {
    store.set(valueAtom, 'reset')
  }

  //feels hacky.
  // Right after the reset is set, we need to set it back to clear so that  when we refetch, it doesn't think it's in a reset state
  store.sub(isResetAtom, () => {
    Promise.resolve().then(() => store.set(valueAtom, 'clear'))
  })

  return (
    <Provider store={store}>
      {typeof children === 'function' ? children(reset) : children}
    </Provider>
  )
}
