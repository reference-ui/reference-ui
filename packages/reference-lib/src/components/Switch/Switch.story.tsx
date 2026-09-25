import * as React from 'react'
import { Div, Button, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Switch } from './index'

export const InteractiveFixture = () => {
  const [checked, setChecked] = React.useState(false)
  const [disabled, setDisabled] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="switch-fixture-root" display="flex" flexDirection="column" gap="4r">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Span>Notifications</Span>
          <Switch
            data-testid="test-switch"
            checked={checked}
            onChange={setChecked}
            disabled={disabled}
          />
        </label>

        <div>
          <Button
            type="button"
            data-testid="btn-toggle-disabled"
            onClick={() => setDisabled(d => !d)}
          >
            Toggle Disabled
          </Button>
        </div>
      </Div>
    </ReferenceLibrary>
  )
}

export const StatesFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" display="flex" flexDirection="column" gap="4r" data-testid="switch-states">
      <Div display="flex" alignItems="center" gap="3r">
        <Switch defaultChecked={false} />
        <Span>Unchecked</Span>
      </Div>
      <Div display="flex" alignItems="center" gap="3r">
        <Switch defaultChecked={true} />
        <Span>Checked</Span>
      </Div>
      <Div display="flex" alignItems="center" gap="3r">
        <Switch disabled checked={false} />
        <Span color="design.text.light">Disabled Unchecked</Span>
      </Div>
      <Div display="flex" alignItems="center" gap="3r">
        <Switch disabled checked={true} />
        <Span color="design.text.light">Disabled Checked</Span>
      </Div>
    </Div>
  </ReferenceLibrary>
)

// Quarantine-parity fixture: mirrors matrix/lib/src/switch.tsx section-for-section
// (same testids) so the salvaged SW-* cases run against the preserved API.
export const ParityFixture = () => {
  const [dom01Checked, setDom01Checked] = React.useState(false)
  const [dom02Checked, setDom02Checked] = React.useState(false)
  const [dom04Shape, setDom04Shape] = React.useState<'thumbless' | 'authored' | 'restored'>('thumbless')
  const [dom04Checked, setDom04Checked] = React.useState(false)
  const [dom04ThumbTag, setDom04ThumbTag] = React.useState('')
  const [dom05Rerender, setDom05Rerender] = React.useState(0)
  const [dom05RootClicked, setDom05RootClicked] = React.useState(false)
  const [dom05RootTag, setDom05RootTag] = React.useState('')
  const [dom05ThumbTag, setDom05ThumbTag] = React.useState('')
  const [dom06Checked, setDom06Checked] = React.useState(true)
  const [dom06ChangeCount, setDom06ChangeCount] = React.useState(0)
  const [dom07Submitted, setDom07Submitted] = React.useState(false)
  const [dom07Checked, setDom07Checked] = React.useState(false)

  const [act01Checked, setAct01Checked] = React.useState(false)
  const [act01Log, setAct01Log] = React.useState<boolean[]>([])
  const [act02Checked, setAct02Checked] = React.useState(true)
  const [act02Log, setAct02Log] = React.useState<boolean[]>([])
  const [act03Checked, setAct03Checked] = React.useState(false)
  const [act03Log, setAct03Log] = React.useState<boolean[]>([])
  const [act04Shape, setAct04Shape] = React.useState<'default' | 'authored'>('default')
  const [act04Log, setAct04Log] = React.useState<boolean[]>([])
  const [act05Log, setAct05Log] = React.useState<boolean[]>([])
  const [act06Log, setAct06Log] = React.useState<boolean[]>([])
  const [act07Checked, setAct07Checked] = React.useState(false)
  const [act07Log, setAct07Log] = React.useState<boolean[]>([])

  const [name01Checked, setName01Checked] = React.useState(false)
  const [name02Checked, setName02Checked] = React.useState(false)

  const [env04Checked, setEnv04Checked] = React.useState(true)
  const [env04Log, setEnv04Log] = React.useState<boolean[]>([])

  const [comp02Checked, setComp02Checked] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="4r" data-testid="switch-parity-root" display="flex" flexDirection="column" gap="4r">
        <section data-testid="section-dom-01">
          <span data-testid="sw-dom-01-before">BeforeSibling</span>
          <label htmlFor="sw-dom-01-id">Label DOM 01</label>
          <Switch
            id="sw-dom-01-id"
            data-testid="sw-dom-01"
            checked={dom01Checked}
            onChange={setDom01Checked}
            width="6r"
            padding="0.25r"
          />
          <span data-testid="sw-dom-01-after">AfterSibling</span>
        </section>

        <section data-testid="section-dom-02">
          <Switch
            data-testid="sw-dom-02"
            checked={dom02Checked}
            onChange={setDom02Checked}
            data-state="checked"
            aria-checked="true"
            data-custom="keep-me"
            {...({ 'aria-pressed': 'true' } as any)}
          />
          <button type="button" data-testid="sw-dom-02-flip" onClick={() => setDom02Checked(c => !c)}>
            Flip DOM 02
          </button>
        </section>

        <section data-testid="section-dom-03">
          <Switch data-testid="sw-dom-03" checked={false} disabled />
        </section>

        <section data-testid="section-dom-04">
          {dom04Shape === 'thumbless' && (
            <Switch data-testid="sw-dom-04" checked={dom04Checked} onChange={setDom04Checked} />
          )}
          {dom04Shape === 'authored' && (
            <Switch data-testid="sw-dom-04" checked={dom04Checked} onChange={setDom04Checked}>
              <Switch.Thumb
                ref={el => { setDom04ThumbTag(el ? el.tagName : '') }}
                data-testid="sw-dom-04-authored-thumb"
                width="2r"
                bg="bg"
              />
              <span data-testid="sw-dom-04-extra">Extra Visual</span>
            </Switch>
          )}
          {dom04Shape === 'restored' && (
            <Switch data-testid="sw-dom-04" checked={dom04Checked} onChange={setDom04Checked} />
          )}
          <span data-testid="sw-dom-04-thumb-tag">{dom04ThumbTag}</span>
          <button type="button" data-testid="sw-dom-04-to-authored" onClick={() => setDom04Shape('authored')}>
            To Authored
          </button>
          <button type="button" data-testid="sw-dom-04-to-restored" onClick={() => setDom04Shape('restored')}>
            To Restored
          </button>
        </section>

        <section data-testid="section-dom-05">
          <Switch
            ref={el => { setDom05RootTag(el ? el.tagName : '') }}
            data-testid="sw-dom-05"
            checked={false}
            className="consumer-root-class"
            style={{ opacity: 0.9 }}
            data-custom-root="root-val"
            aria-label="Custom Switch"
            onClick={() => setDom05RootClicked(true)}
          >
            <Switch.Thumb
              ref={el => { setDom05ThumbTag(el ? el.tagName : '') }}
              data-testid="sw-dom-05-thumb"
              className="consumer-thumb-class"
              style={{ borderRadius: '9999px' }}
              data-custom-thumb="thumb-val"
            />
          </Switch>
          <span data-testid="sw-dom-05-clicked">{dom05RootClicked ? 'yes' : 'no'}</span>
          <span data-testid="sw-dom-05-root-tag">{dom05RootTag}</span>
          <span data-testid="sw-dom-05-thumb-tag">{dom05ThumbTag}</span>
          <button type="button" data-testid="sw-dom-05-rerender" onClick={() => setDom05Rerender(r => r + 1)}>
            Rerender DOM 05 ({dom05Rerender})
          </button>
        </section>

        <section data-testid="section-dom-06">
          <form id="sw-dom-06-form" data-testid="sw-dom-06-form" name="settings-form" onSubmit={e => e.preventDefault()}>
            <Switch
              data-testid="sw-dom-06"
              checked={dom06Checked}
              onChange={val => {
                setDom06Checked(val)
                setDom06ChangeCount(c => c + 1)
              }}
            />
            <button type="submit" data-testid="sw-dom-06-submit">Submit</button>
            <button type="reset" data-testid="sw-dom-06-reset">Reset</button>
          </form>
          <span data-testid="sw-dom-06-change-count">{dom06ChangeCount}</span>
        </section>

        <section data-testid="section-dom-07">
          <form
            data-testid="sw-dom-07-form"
            onSubmit={e => {
              e.preventDefault()
              setDom07Submitted(true)
            }}
          >
            <Switch data-testid="sw-dom-07" checked={dom07Checked} onChange={setDom07Checked} />
          </form>
          <span data-testid="sw-dom-07-submitted">{dom07Submitted ? 'submitted' : 'clean'}</span>
        </section>

        <section data-testid="section-act-01">
          <Switch
            data-testid="sw-act-01"
            checked={act01Checked}
            onChange={val => setAct01Log(l => [...l, val])}
          />
          <span data-testid="sw-act-01-log">{JSON.stringify(act01Log)}</span>
          <button type="button" data-testid="sw-act-01-accept" onClick={() => setAct01Checked(true)}>
            Accept ACT 01
          </button>
        </section>

        <section data-testid="section-act-02">
          <Switch
            data-testid="sw-act-02"
            checked={act02Checked}
            onChange={val => setAct02Log(l => [...l, val])}
          />
          <span data-testid="sw-act-02-log">{JSON.stringify(act02Log)}</span>
        </section>

        <section data-testid="section-act-03">
          <Switch
            data-testid="sw-act-03"
            checked={act03Checked}
            onChange={val => setAct03Log(l => [...l, val])}
          />
          <span data-testid="sw-act-03-log">{JSON.stringify(act03Log)}</span>
          <button type="button" data-testid="sw-act-03-set-checked" onClick={() => setAct03Checked(true)}>
            Set Checked ACT 03
          </button>
        </section>

        <section data-testid="section-act-04">
          {act04Shape === 'default' ? (
            <Switch
              data-testid="sw-act-04"
              checked={true}
              onChange={val => setAct04Log(l => [...l, val])}
            />
          ) : (
            <Switch
              data-testid="sw-act-04"
              checked={true}
              onChange={val => setAct04Log(l => [...l, val])}
            >
              <Switch.Thumb data-testid="sw-act-04-thumb" />
            </Switch>
          )}
          <span data-testid="sw-act-04-log">{JSON.stringify(act04Log)}</span>
          <button type="button" data-testid="sw-act-04-switch-to-authored" onClick={() => setAct04Shape('authored')}>
            Switch to Authored
          </button>
        </section>

        <section data-testid="section-act-05">
          <Switch
            data-testid="sw-act-05"
            checked={false}
            onClick={e => e.preventDefault()}
            onChange={val => setAct05Log(l => [...l, val])}
          />
          <span data-testid="sw-act-05-log">{JSON.stringify(act05Log)}</span>
        </section>

        <section data-testid="section-act-06">
          <Switch
            data-testid="sw-act-06-unchecked"
            checked={false}
            disabled
            onChange={val => setAct06Log(l => [...l, val])}
          />
          <Switch
            data-testid="sw-act-06-checked"
            checked={true}
            disabled
            onChange={val => setAct06Log(l => [...l, val])}
          />
          <span data-testid="sw-act-06-log">{JSON.stringify(act06Log)}</span>
        </section>

        <section data-testid="section-act-07">
          <Switch
            data-testid="sw-act-07"
            checked={act07Checked}
            onChange={val => setAct07Log(l => [...l, val])}
          />
          <span data-testid="sw-act-07-log">{JSON.stringify(act07Log)}</span>
          <button type="button" data-testid="sw-act-07-prog" onClick={() => setAct07Checked(true)}>
            Programmatic Check
          </button>
        </section>

        <section data-testid="section-act-08">
          <Switch data-testid="sw-act-08" checked={false} />
        </section>

        <section data-testid="section-name-01">
          <label htmlFor="airplane" data-testid="sw-name-01-label">Airplane mode</label>
          <Switch
            id="airplane"
            data-testid="sw-name-01"
            checked={name01Checked}
            onChange={setName01Checked}
          />
        </section>

        <section data-testid="section-name-02">
          <label data-testid="sw-name-02-label">
            Notifications
            <Switch data-testid="sw-name-02" checked={name02Checked} onChange={setName02Checked} />
          </label>
        </section>

        <section data-testid="section-env-04" dir="rtl">
          <Switch
            data-testid="sw-env-04"
            checked={env04Checked}
            onChange={val => {
              setEnv04Log(l => [...l, val])
              setEnv04Checked(val)
            }}
          />
          <span data-testid="sw-env-04-log">{JSON.stringify(env04Log)}</span>
        </section>

        <section data-testid="section-a11y-01">
          <label htmlFor="a11y-sw-1">A11y Unchecked</label>
          <Switch id="a11y-sw-1" data-testid="a11y-sw-1" checked={false} />

          <label htmlFor="a11y-sw-2">A11y Checked</label>
          <Switch id="a11y-sw-2" data-testid="a11y-sw-2" checked={true} />

          <label htmlFor="a11y-sw-3">A11y Disabled</label>
          <Switch id="a11y-sw-3" data-testid="a11y-sw-3" checked={false} disabled />

          <label data-testid="a11y-wrap-label">
            A11y Wrapping Label
            <Switch data-testid="a11y-sw-4" checked={false} />
          </label>

          <label htmlFor="a11y-sw-5">A11y Authored Thumb</label>
          <Switch id="a11y-sw-5" data-testid="a11y-sw-5" checked={true}>
            <Switch.Thumb />
          </Switch>
        </section>

        <section data-testid="section-comp-02">
          <form data-testid="sw-comp-02-form">
            <label data-testid="sw-comp-02-label">
              Notifications
              <Switch data-testid="sw-comp-02" checked={comp02Checked} onChange={setComp02Checked} />
            </label>
            <input
              type="checkbox"
              name="notifications_enabled"
              data-testid="sw-comp-02-mirror"
              checked={comp02Checked}
              onChange={e => setComp02Checked(e.target.checked)}
              style={{ display: 'none' }}
            />
            <button type="submit" data-testid="sw-comp-02-submit">Submit</button>
            <button type="reset" data-testid="sw-comp-02-reset">Reset</button>
          </form>
        </section>
      </Div>
    </ReferenceLibrary>
  )
}
