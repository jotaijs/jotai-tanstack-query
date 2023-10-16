import { QueryClient } from '@tanstack/query-core';
import type { Getter } from 'jotai/vanilla';
export declare const createAtoms: <Options, Result extends {
    isSuccess: boolean;
    isError: boolean;
    data: any;
    error: any;
    dataUpdatedAt?: any;
}, Observer extends {
    setOptions(options: Options): void;
    getCurrentResult(): Result;
    subscribe(callback: (result: Result) => void): () => void;
}, Action, ActionResult>(getOptions: (get: Getter) => Options, getQueryClient: (get: Getter) => QueryClient, createObserver: (client: QueryClient, options: Options) => Observer, handleAction: (action: Action, observer: Observer, refresh: () => void) => ActionResult) => readonly [import("jotai/vanilla").WritableAtom<any, [action: Action], ActionResult>, import("jotai/vanilla").WritableAtom<Result, [action: Action], ActionResult>];
export declare const createAsyncAtoms: <Options, Result extends {
    isSuccess: boolean;
    isError: boolean;
    data: any;
    error: any;
}, Observer extends {
    setOptions(options: Options): void;
    getCurrentResult(): Result;
    subscribe(callback: (result: Result) => void): () => void;
}, Action, ActionResult>(getOptions: (get: Getter) => Promise<Options>, getQueryClient: (get: Getter) => QueryClient, createObserver: (client: QueryClient, options: Options) => Observer, handleAction: (action: Action, observer: Observer, refresh: () => void) => Promise<ActionResult>) => readonly [import("jotai/vanilla").WritableAtom<Promise<any>, [action: Action], Promise<ActionResult>>, import("jotai/vanilla").WritableAtom<Promise<Result>, [action: Action], Promise<ActionResult>>];
