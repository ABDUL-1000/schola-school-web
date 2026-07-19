declare module 'naija-state-local-government' {
  interface StateDetails {
    state: string
    lgas: Array<string>
    senatorial_districts?: Array<string>
  }

  interface NaijaStates {
    states: () => Array<string>
    lgas: (state: string) => StateDetails | undefined
    lga: (state: string) => StateDetails | undefined
    all: () => Array<StateDetails>
  }

  const NaijaStates: NaijaStates
  export default NaijaStates

  export function states(): Array<string>
  export function lgas(state: string): StateDetails | undefined
  export function lga(state: string): StateDetails | undefined
  export function all(): Array<StateDetails>
}
