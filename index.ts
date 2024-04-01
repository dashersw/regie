type Mutation<S> = (arg: { state: S; mutations: MutationTree<S> }, value: any) => any
type Action<S, M> = (arg: { state: S; mutations: MutationTree<S>; actions: ActionTree<S, M> }, value: any) => any

interface MutationTree<S> {
  [key: string]: Mutation<S>
}
interface ActionTree<S, M> {
  [key: string]: Action<S, M>
}

import slim from 'observable-slim'
import { EventEmitter } from 'eventemitter3'
import get from 'lodash.get'
import isEqual from 'lodash.isequal'
import register from './lib/register.js'

type Change = {
  type: 'update' | 'add' | 'delete' | 'splice' | 'reconfigure' | 'get' | 'set'
  property: string | number | symbol
  target: any
  newValue?: any
  oldValue?: any
  currentPath: string
}

export default function regie<S, M = MutationTree<S>, A = ActionTree<S, M>>(
  {
    initialState = {} as S,
    actions = {} as A,
    mutations = {} as M,
  }: {
    initialState?: S
    actions?: A
    mutations?: M
  } = {
    initialState: {} as S,
    actions: {} as A,
    mutations: {} as M,
  },
): {
  state: S
  observe: (mapper: any, handler: (value: any, change: any) => void) => () => void
  actions: { [key in keyof A]: (value?: any) => void }
  mutations: { [key in keyof M]: (value?: any) => void }
  $$register: any
} {
  type MapperFn = ((state: S) => any) & { path?: string; lastValue?: any }
  type Mapper = string | MapperFn

  const bus = new EventEmitter()

  const state = slim.create(initialState, false, changes => {
    changes.forEach(change => {
      if (
        change.type == 'update' &&
        change.property == 'length' &&
        Array.isArray(change.target) &&
        change.target.length == change.newValue
      ) {
        return
      }

      bus.emit('root', state, change)
    })
  })

  function observeLater(
    mapper: ((state: S) => any) & { path?: string; lastValue?: any },
    handler: (value: any, change: Change) => void,
  ): () => void {
    function observer(_value: unknown, change: Change) {
      let val
      try {
        val = mapper(state)
      } catch (e) {
        // a previously known and watched value (and its parent) is probably deleted
        // so call the handler with value undefined and update lastValue to undefined.
        if (typeof mapper.lastValue != 'undefined') handler(undefined, change)
        mapper.lastValue = undefined
        return
      }

      if (typeof val != 'undefined') {
        const path = (val && val.__getPath) || mapper.path

        if (
          !isEqual(mapper.lastValue, val) ||
          (change.currentPath.startsWith(path) && path.length <= change.currentPath.length)
        ) {
          mapper.lastValue = val
          handler(val, change)
        }
      } else if (typeof mapper.lastValue != 'undefined' && typeof val == 'undefined') {
        handler(undefined, change)
        mapper.lastValue = undefined
      }
    }

    bus.on('root', observer)
    const off = () => bus.removeListener('root', observer)
    return () => off()
  }

  function observe(mapper: Mapper, handler: (value: any, change: Change) => void): () => void {
    let mapperFn = mapper
    if (typeof mapper != 'function' && typeof mapper != 'string') mapperFn = () => mapper

    if (typeof mapper == 'string') {
      mapperFn = () => get(state, mapper)
      mapperFn.path = mapper
    }

    let val

    try {
      val = (mapperFn as () => any)()
    } catch (e) {
      return observeLater(mapperFn as MapperFn, handler)
    }

    ;(mapperFn as MapperFn).lastValue = val

    return observeLater(mapperFn as MapperFn, handler)
  }

  const boundRegister = register(observe, state)
  const boundActions = {} as { [key in keyof A]: (value?: any) => void }
  const boundMutations = {} as { [key in keyof M]: (value?: any) => void }

  const store = {
    state,
    observe,
    actions: boundActions,
    mutations: boundMutations,
  }

  Object.keys(actions || {}).forEach((key: string) => {
    boundActions[key as keyof A] = (actions[key as keyof A] as Function).bind(store, {
      actions: boundActions,
      mutations: boundMutations,
      state,
    })
  })

  Object.keys(mutations || {}).forEach((key: string) => {
    boundMutations[key as keyof M] = (mutations[key as keyof M] as Function).bind(store, {
      mutations: boundMutations,
      state,
    })
  })

  return {
    ...store,
    $$register: boundRegister,
  }
}
