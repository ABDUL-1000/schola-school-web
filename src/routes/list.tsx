import { createFileRoute } from '@tanstack/react-router'
import { Country, State } from 'country-state-city'

export const Route = createFileRoute('/list')({
  component: RouteComponent,
})

function RouteComponent() {
  console.log(Country.getAllCountries())
  console.log(State.getAllStates())
  return <div>Hello "/list"!</div>
}
