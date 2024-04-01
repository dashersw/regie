declare module 'observable-slim' {
  export function create<S>(
    initialState: S,
    deep: boolean,
    callback: (changes: { type: string; property: string; target: any; newValue: any; oldValue: any }[]) => void,
  ): S
}
