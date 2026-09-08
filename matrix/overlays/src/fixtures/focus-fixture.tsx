import * as React from 'react'
import { Overlay } from '@reference-ui/lib'

export function FocusFixture() {
  // 1. OV-FOCUS-01: Default first tabbable & autoFocus support
  const [openDefault, setOpenDefault] = React.useState(false)
  const [openAutoFocus, setOpenAutoFocus] = React.useState(false)

  // 2. OV-FOCUS-02: initialFocus ref, resolver, invalid fallback
  const [openRef, setOpenRef] = React.useState(false)
  const [openResolver, setOpenResolver] = React.useState(false)
  const [openInvalid, setOpenInvalid] = React.useState(false)
  const thirdBtnRef = React.useRef<HTMLButtonElement | null>(null)
  const secondBtnRef = React.useRef<HTMLButtonElement | null>(null)

  // 3. OV-FOCUS-03: initialFocus={false}
  const [openNoInitial, setOpenNoInitial] = React.useState(false)

  // 4. OV-RESTORE-02: Zero-duration restore
  const [openZeroRestore, setOpenZeroRestore] = React.useState(false)

  // 5. OV-RESTORE-01: Animated restore
  const [openAnimatedRestore, setOpenAnimatedRestore] = React.useState(false)

  // 6. OV-RESTORE-04: restoreFocus={false}
  const [openNoRestore, setOpenNoRestore] = React.useState(false)

  // 7. OV-RESTORE-07: Explicit restoreFocus target
  const [openCustomRestore, setOpenCustomRestore] = React.useState(false)
  const customRestoreTargetRef = React.useRef<HTMLButtonElement | null>(null)

  // 8. OV-FOCUS-05: Focus containment when active descendant removed/disabled/hidden
  const [openDynamicFocus, setOpenDynamicFocus] = React.useState(false)
  const [showMiddleBtn, setShowMiddleBtn] = React.useState(true)
  const [disableMiddleBtn, setDisableMiddleBtn] = React.useState(false)
  const [hideMiddleBtn, setHideMiddleBtn] = React.useState(false)

  // 9. OV-FOCUS-06: Nested modal focus pause and resume
  const [openParentModal, setOpenParentModal] = React.useState(false)
  const [openChildModal, setOpenChildModal] = React.useState(false)

  // Step 4: Focus & restore contracts
  // OV-FOCUS-07: Shard portalled child
  const [openShardParent, setOpenShardParent] = React.useState(false)
  const [openShardChild, setOpenShardChild] = React.useState(false)
  const [portalTargetEl, setPortalTargetEl] = React.useState<HTMLElement | null>(null)

  // OV-RESTORE-03: Opener removed or disabled before exit completes
  const [openDeadOpener, setOpenDeadOpener] = React.useState(false)
  const [openerDisabled, setOpenerDisabled] = React.useState(false)
  const [openerRemoved, setOpenerRemoved] = React.useState(false)

  // OV-RESTORE-04: restoreFocus={false} with Presence
  const [openRestoreFalse, setOpenRestoreFalse] = React.useState(false)

  return (
    <div data-testid="focus-fixture-root" style={{ padding: 16 }}>
      <h2>Overlay Focus Trapping & Restoration Fixtures</h2>

      {/* Outside helpers */}
      <button type="button" data-testid="btn-outside-focus-target">
        Outside Focus Target
      </button>
      <button
        type="button"
        ref={customRestoreTargetRef}
        data-testid="btn-custom-restore-target"
        style={{ marginLeft: 8 }}
      >
        Custom Restore Target
      </button>

      <hr style={{ margin: '16px 0' }} />

      {/* Section 1: OV-FOCUS-01 Default first tabbable & autoFocus */}
      <section data-testid="section-ov-focus-01">
        <h3>OV-FOCUS-01: First Tabbable & autoFocus</h3>
        <Overlay open={openDefault} onOpenChange={setOpenDefault}>
          <Overlay.Trigger data-testid="btn-trigger-focus-default">
            Open Default Focus
          </Overlay.Trigger>
          <Overlay.Backdrop data-testid="focus-default-backdrop" />
          <Overlay.Content
            data-testid="focus-default-content"
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <p>Default Focus Dialog</p>
            <button type="button" data-testid="focus-default-btn-1">Button 1</button>
            <button type="button" data-testid="focus-default-btn-2">Button 2</button>
            <button
              type="button"
              data-testid="btn-close-focus-default"
              onClick={() => setOpenDefault(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>

        <Overlay open={openAutoFocus} onOpenChange={setOpenAutoFocus}>
          <Overlay.Trigger data-testid="btn-trigger-focus-autofocus">
            Open AutoFocus
          </Overlay.Trigger>
          <Overlay.Content
            data-testid="focus-autofocus-content"
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <p>AutoFocus Dialog</p>
            <button type="button" data-testid="focus-autofocus-btn-1">Button 1</button>
            <button
              type="button"
              autoFocus
              data-autofocus
              data-testid="focus-autofocus-btn-2"
            >
              Button 2 (autoFocus)
            </button>
            <button
              type="button"
              data-testid="btn-close-focus-autofocus"
              onClick={() => setOpenAutoFocus(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '16px 0' }} />

      {/* Section 2: OV-FOCUS-02 initialFocus ref, resolver, invalid fallback */}
      <section data-testid="section-ov-focus-02">
        <h3>OV-FOCUS-02: initialFocus Options</h3>
        <button
          type="button"
          data-testid="btn-open-focus-ref"
          onClick={() => setOpenRef(true)}
        >
          Open Ref Focus
        </button>
        <Overlay open={openRef} onOpenChange={setOpenRef}>
          <Overlay.Content
            data-testid="focus-ref-content"
            initialFocus={thirdBtnRef}
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <button type="button" data-testid="focus-ref-btn-1">Ref 1</button>
            <button type="button" data-testid="focus-ref-btn-2">Ref 2</button>
            <button type="button" ref={thirdBtnRef} data-testid="focus-ref-btn-3">Ref 3</button>
            <button type="button" onClick={() => setOpenRef(false)} data-testid="btn-close-focus-ref">Close</button>
          </Overlay.Content>
        </Overlay>

        <button
          type="button"
          data-testid="btn-open-focus-resolver"
          onClick={() => setOpenResolver(true)}
        >
          Open Resolver Focus
        </button>
        <Overlay open={openResolver} onOpenChange={setOpenResolver}>
          <Overlay.Content
            data-testid="focus-resolver-content"
            initialFocus={() => secondBtnRef.current}
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <button type="button" data-testid="focus-resolver-btn-1">Resolver 1</button>
            <button type="button" ref={secondBtnRef} data-testid="focus-resolver-btn-2">Resolver 2</button>
            <button type="button" onClick={() => setOpenResolver(false)} data-testid="btn-close-focus-resolver">Close</button>
          </Overlay.Content>
        </Overlay>

        <button
          type="button"
          data-testid="btn-open-focus-invalid"
          onClick={() => setOpenInvalid(true)}
        >
          Open Invalid Resolver Focus
        </button>
        <Overlay open={openInvalid} onOpenChange={setOpenInvalid}>
          <Overlay.Content
            data-testid="focus-invalid-content"
            initialFocus={() => document.createElement('button')}
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <button type="button" data-testid="focus-invalid-btn-1">Fallback First</button>
            <button type="button" data-testid="focus-invalid-btn-2">Button 2</button>
            <button type="button" onClick={() => setOpenInvalid(false)} data-testid="btn-close-focus-invalid">Close</button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '16px 0' }} />

      {/* Section 3: OV-FOCUS-03 initialFocus={false} */}
      <section data-testid="section-ov-focus-03">
        <h3>OV-FOCUS-03: initialFocus=false</h3>
        <Overlay
          open={openNoInitial}
          onOpenChange={setOpenNoInitial}
          isolation={{ inert: false }}
        >
          <Overlay.Trigger data-testid="btn-trigger-no-initial">
            Open No Initial Focus
          </Overlay.Trigger>
          <Overlay.Content
            data-testid="focus-no-initial-content"
            initialFocus={false}
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <p>Skip Initial Move</p>
            <button type="button" data-testid="focus-no-initial-btn-1">Inside Btn 1</button>
            <button type="button" data-testid="focus-no-initial-btn-2">Inside Btn 2</button>
            <button type="button" onClick={() => setOpenNoInitial(false)} data-testid="btn-close-no-initial">Close</button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '16px 0' }} />

      {/* Section 4: OV-RESTORE-02 & OV-RESTORE-01 */}
      <section data-testid="section-ov-restore">
        <h3>Focus Restoration</h3>
        {/* Zero duration restore */}
        <Overlay open={openZeroRestore} onOpenChange={setOpenZeroRestore}>
          <Overlay.Trigger data-testid="btn-trigger-restore-zero">
            Open Zero Restore
          </Overlay.Trigger>
          <Overlay.Content
            data-testid="restore-zero-content"
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <p>Zero Duration Dialog</p>
            <button type="button" data-testid="restore-zero-inner-btn">Zero Inner</button>
            <button
              type="button"
              data-testid="btn-close-restore-zero"
              onClick={() => setOpenZeroRestore(false)}
            >
              Close Zero
            </button>
          </Overlay.Content>
        </Overlay>

        {/* Animated restore */}
        <Overlay open={openAnimatedRestore} onOpenChange={setOpenAnimatedRestore}>
          <Overlay.Trigger data-testid="btn-trigger-restore-animated">
            Open Animated Restore
          </Overlay.Trigger>
          <Overlay.Backdrop
            data-testid="restore-animated-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              transition: 'opacity 150ms ease',
              opacity: openAnimatedRestore ? 1 : 0,
            }}
          />
          <Overlay.Content
            data-testid="restore-animated-content"
            style={{
              position: 'fixed',
              top: '20%',
              left: '20%',
              background: '#fff',
              padding: 16,
              transition: 'opacity 150ms ease',
              opacity: openAnimatedRestore ? 1 : 0,
            }}
          >
            <p>Animated Dialog</p>
            <button type="button" data-testid="restore-animated-inner-btn">Animated Inner</button>
            <button
              type="button"
              data-testid="btn-close-restore-animated"
              onClick={() => setOpenAnimatedRestore(false)}
            >
              Close Animated
            </button>
          </Overlay.Content>
        </Overlay>

        {/* restoreFocus={false} */}
        <Overlay open={openNoRestore} onOpenChange={setOpenNoRestore}>
          <Overlay.Trigger data-testid="btn-trigger-no-restore">
            Open No Restore
          </Overlay.Trigger>
          <Overlay.Content
            data-testid="no-restore-content"
            restoreFocus={false}
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <p>No Restore Dialog</p>
            <button
              type="button"
              data-testid="btn-close-no-restore"
              onClick={() => {
                setOpenNoRestore(false)
                // App explicitly moves focus elsewhere
                document.getElementById('btn-outside-focus-target')?.focus()
              }}
            >
              Close No Restore
            </button>
          </Overlay.Content>
        </Overlay>

        {/* restoreFocus pointing to custom target */}
        <Overlay open={openCustomRestore} onOpenChange={setOpenCustomRestore}>
          <Overlay.Trigger data-testid="btn-trigger-custom-restore">
            Open Custom Restore
          </Overlay.Trigger>
          <Overlay.Content
            data-testid="custom-restore-content"
            restoreFocus={customRestoreTargetRef}
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <p>Custom Target Dialog</p>
            <button
              type="button"
              data-testid="btn-close-custom-restore"
              onClick={() => setOpenCustomRestore(false)}
            >
              Close Custom Target
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '16px 0' }} />

      {/* Section 5: OV-FOCUS-05 Focus containment on element removal/disable/hide */}
      <section data-testid="section-ov-focus-05">
        <h3>OV-FOCUS-05: Dynamic Element Removal/Disable/Hide</h3>
        <button
          type="button"
          data-testid="btn-open-dynamic-focus"
          onClick={() => {
            setShowMiddleBtn(true)
            setDisableMiddleBtn(false)
            setHideMiddleBtn(false)
            setOpenDynamicFocus(true)
          }}
        >
          Open Dynamic Focus
        </button>
        <Overlay open={openDynamicFocus} onOpenChange={setOpenDynamicFocus}>
          <Overlay.Content
            data-testid="dynamic-focus-content"
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <p>Dynamic Focus Dialog</p>
            <button type="button" data-testid="btn-dynamic-first">First</button>
            {showMiddleBtn && (
              <button
                type="button"
                data-testid="btn-dynamic-middle"
                disabled={disableMiddleBtn}
                style={hideMiddleBtn ? { display: 'none' } : undefined}
              >
                Middle Target
              </button>
            )}
            <button
              type="button"
              data-testid="btn-action-remove-middle"
              onClick={() => setShowMiddleBtn(false)}
            >
              Remove Middle
            </button>
            <button
              type="button"
              data-testid="btn-action-disable-middle"
              onClick={() => setDisableMiddleBtn(true)}
            >
              Disable Middle
            </button>
            <button
              type="button"
              data-testid="btn-action-hide-middle"
              onClick={() => setHideMiddleBtn(true)}
            >
              Hide Middle
            </button>
            <button type="button" data-testid="btn-dynamic-last">Last</button>
            <button
              type="button"
              data-testid="btn-close-dynamic-focus"
              onClick={() => setOpenDynamicFocus(false)}
            >
              Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '16px 0' }} />

      {/* Section 6: OV-FOCUS-06 Nested modal pause and resume */}
      <section data-testid="section-ov-focus-06">
        <h3>OV-FOCUS-06: Nested Modal Focus Lock Stacking</h3>
        <button
          type="button"
          data-testid="btn-open-parent-modal"
          onClick={() => setOpenParentModal(true)}
        >
          Open Parent Modal
        </button>

        <Overlay open={openParentModal} onOpenChange={setOpenParentModal}>
          <Overlay.Backdrop data-testid="parent-modal-backdrop" />
          <Overlay.Content
            data-testid="parent-modal-content"
            style={{ position: 'fixed', top: '20%', left: '20%', background: '#fff', padding: 16 }}
          >
            <h4>Parent Modal</h4>
            <button type="button" data-testid="btn-parent-focus-1">Parent Btn 1</button>
            <button
              type="button"
              data-testid="btn-open-child-modal"
              onClick={() => setOpenChildModal(true)}
            >
              Open Child Modal
            </button>
            <button type="button" data-testid="btn-parent-focus-2">Parent Btn 2</button>
            <button
              type="button"
              data-testid="btn-close-parent-modal"
              onClick={() => setOpenParentModal(false)}
            >
              Close Parent
            </button>
          </Overlay.Content>
        </Overlay>

        <Overlay open={openChildModal} onOpenChange={setOpenChildModal}>
          <Overlay.Backdrop data-testid="child-modal-backdrop" />
          <Overlay.Content
            data-testid="child-modal-content"
            style={{ position: 'fixed', top: '35%', left: '35%', background: '#f0f0f0', padding: 16, zIndex: 1005 }}
          >
            <h4>Child Modal</h4>
            <button type="button" data-testid="btn-child-focus-1">Child Btn 1</button>
            <button type="button" data-testid="btn-child-focus-2">Child Btn 2</button>
            <button
              type="button"
              data-testid="btn-close-child-modal"
              onClick={() => setOpenChildModal(false)}
            >
              Close Child
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '16px 0' }} />

      {/* Section 7: OV-RESTORE-03 Dead or Disabled Opener */}
      <section data-testid="section-ov-restore-03">
        <h3>OV-RESTORE-03: Dead or Disabled Opener</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!openerRemoved && (
            <button
              type="button"
              data-testid="btn-dead-opener"
              disabled={openerDisabled}
              onClick={() => setOpenDeadOpener(true)}
            >
              Dead Opener Button
            </button>
          )}
          <button type="button" data-testid="btn-live-sibling">
            Live Sibling Button
          </button>
          <button
            type="button"
            data-testid="btn-reset-dead-opener-state"
            onClick={() => {
              setOpenerDisabled(false)
              setOpenerRemoved(false)
            }}
          >
            Reset Opener State
          </button>
        </div>

        <Overlay open={openDeadOpener} onOpenChange={setOpenDeadOpener}>
          <Overlay.Backdrop
            data-testid="dead-opener-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              transition: 'opacity 150ms ease',
              opacity: openDeadOpener ? 1 : 0,
            }}
          />
          <Overlay.Content
            data-testid="dead-opener-content"
            style={{
              position: 'fixed',
              top: '20%',
              left: '20%',
              background: '#fff',
              padding: 16,
              transition: 'opacity 150ms ease',
              opacity: openDeadOpener ? 1 : 0,
            }}
          >
            <p>Dead Opener Dialog</p>
            <button
              type="button"
              data-testid="btn-disable-opener-and-close"
              onClick={() => {
                setOpenerDisabled(true)
                setOpenDeadOpener(false)
              }}
            >
              Disable Opener & Close
            </button>
            <button
              type="button"
              data-testid="btn-remove-opener-and-close"
              onClick={() => {
                setOpenerRemoved(true)
                setOpenDeadOpener(false)
              }}
            >
              Remove Opener & Close
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '16px 0' }} />

      {/* Section 8: OV-RESTORE-04 restoreFocus=false with Presence */}
      <section data-testid="section-ov-restore-04">
        <h3>OV-RESTORE-04: restoreFocus=false with Presence</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            data-testid="btn-trigger-restore-false"
            onClick={() => setOpenRestoreFalse(true)}
          >
            Open restoreFocus=false
          </button>
          <button
            type="button"
            id="btn-consumer-focus-target"
            data-testid="btn-consumer-focus-target"
            data-reference-overlay-ignore=""
          >
            Consumer Focus Target
          </button>
        </div>

        <Overlay open={openRestoreFalse} onOpenChange={setOpenRestoreFalse}>
          <Overlay.Backdrop
            data-testid="restore-false-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              transition: 'opacity 150ms ease',
              opacity: openRestoreFalse ? 1 : 0,
            }}
          />
          <Overlay.Content
            data-testid="restore-false-content"
            restoreFocus={false}
            style={{
              position: 'fixed',
              top: '25%',
              left: '25%',
              background: '#fff',
              padding: 16,
              transition: 'opacity 150ms ease',
              opacity: openRestoreFalse ? 1 : 0,
            }}
          >
            <p>Restore False Dialog</p>
            <button
              type="button"
              data-testid="btn-close-and-move-focus"
              onClick={() => {
                setOpenRestoreFalse(false)
                setTimeout(() => {
                  document.getElementById('btn-consumer-focus-target')?.focus()
                }, 0)
              }}
            >
              Close and Move Focus to Target
            </button>
          </Overlay.Content>
        </Overlay>
      </section>

      <hr style={{ margin: '16px 0' }} />

      {/* Section 9: OV-FOCUS-07 Portalled child as FocusLock shard */}
      <section data-testid="section-ov-focus-07">
        <h3>OV-FOCUS-07: Portalled Child Shard</h3>
        <button
          type="button"
          data-testid="btn-open-shard-parent"
          onClick={() => setOpenShardParent(true)}
        >
          Open Shard Parent
        </button>

        <div
          ref={el => setPortalTargetEl(el)}
          id="external-portal-container"
          data-testid="external-portal-container"
          data-reference-portal-container=""
          style={{ marginTop: 8 }}
        />

        <Overlay open={openShardParent} onOpenChange={setOpenShardParent}>
          <Overlay.Backdrop data-testid="shard-parent-backdrop" />
          <Overlay.Content
            data-testid="shard-parent-content"
            style={{ position: 'fixed', top: '15%', left: '15%', background: '#fff', padding: 20, zIndex: 1000 }}
          >
            <h4>Shard Parent Dialog</h4>
            <button type="button" data-testid="btn-shard-parent-1">Parent Btn 1</button>
            <button
              type="button"
              data-testid="btn-open-shard-child"
              onClick={() => setOpenShardChild(true)}
            >
              Open Portalled Child
            </button>
            <button type="button" data-testid="btn-shard-parent-2">Parent Btn 2</button>
            <button
              type="button"
              data-testid="btn-close-shard-parent"
              onClick={() => setOpenShardParent(false)}
            >
              Close Parent
            </button>

            {/* Child Overlay whose Content portals to document.body */}
            <Overlay open={openShardChild} onOpenChange={setOpenShardChild}>
              <Overlay.Content
                data-testid="shard-child-content"
                style={{ position: 'fixed', top: '40%', left: '40%', background: '#eef', padding: 20, zIndex: 1005 }}
              >
                <h5>Portalled Child Overlay</h5>
                <button type="button" data-testid="btn-shard-child-1">Child Btn 1</button>
                <button type="button" data-testid="btn-shard-child-2">Child Btn 2</button>
                <button
                  type="button"
                  data-testid="btn-close-shard-child"
                  onClick={() => setOpenShardChild(false)}
                >
                  Close Child
                </button>
              </Overlay.Content>
            </Overlay>
          </Overlay.Content>
        </Overlay>
      </section>
    </div>
  )
}
