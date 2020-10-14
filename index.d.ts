type Mutation<S> = (arg: { state: S, mutations: MutationTree<S> }, value: any) => any;
type Action<S, M> = (arg: { state: S, mutations: MutationTree<S>, actions: ActionTree<S, M> }, value: any) => any;

interface MutationTree<S> {
  [key: string]: Mutation<S>;
}
interface ActionTree<S, M> {
  [key: string]: Action<S, M>;
}

export default function regie<S, M = MutationTree<S>, A = ActionTree<S, M>>(arg?: {
  initialState? : S
  actions?: A,
  mutations?: M,
}, options?: {
  deep?: boolean,
}): {
  state: S,
  observe: (mapper: any, handler: (value: any, change: any) => void) => () => void,
  actions: {[key in keyof A]: (value?: any) => void },
  mutations: {[key in keyof M]: (value?: any) => void },
  $$register: any,
}
