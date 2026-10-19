import '@reference-ui/react/styles.css'
import {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {NumberField} from '@reference-ui/lib'
function Repro(){
 const [value,setValue]=useState<number|null>(2)
 const [calls,setCalls]=useState<Array<number|null>>([])
 return <main style={{padding:32,fontFamily:'system-ui'}}>
  <h1>NumberField commit timing — minimal reproduction</h1>
  <label htmlFor="number-min-input">Quantity</label>
  <NumberField value={value} onChange={next=>{setValue(next);setCalls(old=>[...old,next])}} locale="en-GB" min={1} max={12}>
   <NumberField.Group>
    <NumberField.Decrement aria-label="Decrease quantity"/>
    <NumberField.Input id="number-min-input"/>
    <NumberField.Increment aria-label="Increase quantity"/>
   </NumberField.Group>
  </NumberField>
  <p>Controlled value: <output id="controlled">{JSON.stringify(value)}</output></p>
  <p>onChange calls: <output id="calls">{JSON.stringify(calls)}</output></p>
  <button id="blur-target">Blur target</button>
 </main>
}
createRoot(document.getElementById('root')!).render(<Repro/>);
