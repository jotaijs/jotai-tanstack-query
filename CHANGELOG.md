# Change Log

## [Unreleased]

## [0.11.0] - 2025-08-01

### Changed

- feat: `QueryClientAtomProvider` is a ready-to-use wrapper that combines Jotai Provider and TanStack Query QueryClientProvider.
- breaking: removed `QueryClientProvider`

## [0.10.1] - 2025-07-24

### Changed

- fix: '/react' import path for QueryClientProvider utils

## [0.10.0] - 2025-07-23

### Changed

- feat: atomWithQueries for tanstack/query's useQueries
- feat: add QueryClientProvider utils for react

## [0.9.2] - 2025-07-10

### Changed

- upgrade @tankstack/query-core to 5.81.5

## [0.9.1] - 2025-07-09

### Changed

- upgrade @tankstack/query-core to 5.81.2

## [0.9.0] - 2024-09-29

### Added

- add: change atom signature to return a setter function to force re-evaluate an atom. This is to help the atom able to reevaluate when it hits an error boundary by throwing a rejected promise.

## [0.8.8] - 2024-09-15

### Changed

- fix: use query.reset on error instead of client.resetQueries.

## [0.8.7] - 2024-08-18

### Changed

- add: batch calls to improve perf
- fix: return appropriate cleanup functions
- fix: cleanup - remove unused code

## [0.8.6] - 2024-08-05

### Changed

- fix: remove wonka as a peer dependency

## [0.8.5] - 2024-02-04

### Changed

- fix: include types.ts in build

## [0.8.4] - 2024-01-31

### Changed

- fix: fix generics

## [0.8.3] - 2024-01-29

### Changed

- fix: update types

## [0.8.2] - 2024-01-15

### Changed

- fix: update jotai peer dependency to v2

## [0.8.1] - 2023-12-23

### Changed

- fix: add default staletime for suspense atoms
- fix: suspense example

## [0.8.0] - 2023-12-09

### Added

- breaking: update atom api to resemble tanstack/query api
- add: atomWithSuspenseQuery, atomWithSuspenseInfiniteQuery, atomWithMutationState

## [0.7.2] - 2023-09-08

### Changed

- fix: loading mutation does not call refresh on unmount #38

## [0.7.1] - 2023-05-25

### Changed

- Fix result of statusAtom sometimes not updated #35

## [0.7.0] - 2023-04-03

### Added

- feat: atomsWithQueryAsync, plus example #30

## [0.6.0] - 2023-03-03

### Added

- feat: mark internal atoms as private

## [0.5.0] - 2023-01-31

### Added

- Migrate to Jotai v2 API #18

## [0.4.0] - 2022-10-21

### Changed

- fix: status should change #10
- breaking: simplify api names #11

## [0.3.0] - 2022-10-11

### Changed

- make mutation atom type correct #7
- update jotai and fix types #8

## [0.2.1] - 2022-10-04

### Changed

- fix setOptions not to delay #6

## [0.2.0] - 2022-09-27

### Changed

- for dataAtom, re-create observer when options change #5

## [0.1.0] - 2022-09-24

### Added

- implement refetch #1
- feat: observer cache #2
- feat: infinite query #3
- feat: mutation api #4

## [0.0.1] - 2022-09-20

### Added

- Initial experimental release
