// Entry for the PGEN-03 world. It takes the bound form primitives and emits
// one probe per html-form family member with native wiring: uncontrolled
// inputs, a submit button driving a click counter, a grouped select, and
// native meter, progress, label, and fieldset legs. Every probe paints
// brand through a sibling style prop.
import { createRoot } from 'react-dom/client'
import { Button, Datalist, Fieldset, Input, Label, Legend, Meter, Optgroup, Option, Output, Progress, Select, Textarea } from '@reference-ui/react'

export function PgenForm() {
  return (
    <>
      <div id="form-root">
        <Button
          id="form-button"
          type="submit"
          color="brand"
          onClick={() => {
            const counter = document.getElementById('clicks')
            if (counter) counter.textContent = 'clicked'
          }}
        >
          send
        </Button>
        <Datalist id="form-datalist" color="brand">
          <option value="a" />
          <option value="b" />
        </Datalist>
        <Fieldset id="form-fieldset" color="brand">
          <Legend id="form-legend" color="brand">legend</Legend>
        </Fieldset>
        <Input id="form-text" type="text" defaultValue="hello" color="brand" />
        <Input id="form-check" type="checkbox" color="brand" />
        <Label id="form-label" htmlFor="form-text" color="brand">label</Label>
        <Meter id="form-meter" value={0.5} min={0} max={1} color="brand" />
        <Output id="form-output" htmlFor="form-text" color="brand">out</Output>
        <Progress id="form-progress" value={50} max={100} color="brand" />
        <Select id="form-select" defaultValue="b" color="brand">
          <Optgroup id="form-optgroup" label="grp" color="brand">
            <Option id="form-option-a" value="a" color="brand">a</Option>
          </Optgroup>
          <Option id="form-option-b" value="b" color="brand">b</Option>
        </Select>
        <Textarea id="form-textarea" defaultValue="text" rows={3} color="brand" />
      </div>
      <div id="clicks">unclicked</div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PgenForm />)
