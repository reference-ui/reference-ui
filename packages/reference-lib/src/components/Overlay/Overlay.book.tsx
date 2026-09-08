import * as React from 'react'
import { Div, Button, H3, H4, P, Span, Input } from '@reference-ui/react'
import { Overlay } from './index'
import { Popover } from '../Popover'
import { Menu } from '../Menu'
import { Tooltip } from '../Tooltip'

const dialogChrome = {
  p: '5r' as const,
  bg: 'ui.dialog.background' as const,
  color: 'ui.dialog.foreground' as const,
  borderRadius: 'lg' as const,
  border: '1px solid' as const,
  borderColor: 'ui.dialog.border' as const,
  boxShadow: '0 10px 40px rgba(0,0,0,0.35)' as const,
  minW: '75r' as const,
}

function LayerBadge({ level, zIndex, type }: { level: number; zIndex: number; type: string }) {
  return (
    <Div
      display="inline-flex"
      alignItems="center"
      gap="1.5r"
      px="2r"
      py="0.5r"
      borderRadius="full"
      bg="rgba(56, 189, 248, 0.15)"
      color="rgb(56, 189, 248)"
      border="1px solid rgba(56, 189, 248, 0.3)"
      fontSize="2.5r"
      fontWeight="600"
      mb="2r"
      alignSelf="flex-start"
    >
      <Span>Tier {level}</Span>
      <Span color="rgba(255, 255, 255, 0.4)">•</Span>
      <Span>{type}</Span>
      <Span color="rgba(255, 255, 255, 0.4)">•</Span>
      <Span fontFamily="monospace">z:{zIndex}</Span>
    </Div>
  )
}

export default {
  Dialog: () => {
    const [open, setOpen] = React.useState(false)
    return (
      <Div p="6r">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open dialog
        </Button>

        <Overlay open={open} onOpenChange={setOpen}>
          <Overlay.Backdrop bg="rgba(0,0,0,0.5)" />
          <Overlay.Content
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            role="dialog"
            aria-modal="true"
            {...dialogChrome}
          >
            <H3 fontSize="4.5r" fontWeight="600" m="0">
              Confirm action
            </H3>
            <P fontSize="3r" color="design.text.light" mt="2r" mb="0">
              Modal overlay with backdrop and focus containment.
            </P>
            <Div display="flex" justifyContent="flex-end" gap="2r" mt="4r">
              <Button onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Confirm
              </Button>
            </Div>
          </Overlay.Content>
        </Overlay>
      </Div>
    )
  },

  WithTrigger: () => {
    const [open, setOpen] = React.useState(false)
    return (
      <Div p="6r">
        <Overlay open={open} onOpenChange={setOpen}>
          <Overlay.Trigger variant="primary">Open via trigger</Overlay.Trigger>
          <Overlay.Backdrop bg="rgba(0,0,0,0.5)" />
          <Overlay.Content
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            p="4r"
            bg="ui.dialog.background"
            borderRadius="md"
            border="1px solid"
            borderColor="ui.dialog.border"
            boxShadow="0 8px 24px rgba(0,0,0,0.2)"
            minW="60r"
            role="dialog"
            aria-modal="true"
          >
            <P fontSize="3.5r" m="0">
              Opened using Overlay.Trigger
            </P>
          </Overlay.Content>
        </Overlay>
      </Div>
    )
  },

  Anchored: () => {
    const [open, setOpen] = React.useState(false)
    return (
      <Div p="8r">
        <Overlay open={open} onOpenChange={setOpen} isolation={false}>
          <Overlay.Trigger variant="primary">Open anchored</Overlay.Trigger>
          <Overlay.Content
            placement="bottom-start"
            offset={8}
            p="4r"
            bg="ui.dialog.background"
            color="ui.dialog.foreground"
            borderRadius="md"
            border="1px solid"
            borderColor="ui.dialog.border"
            boxShadow="0 8px 24px rgba(0,0,0,0.2)"
          >
            <P fontSize="3.5r" m="0">
              Anchored to the trigger. Overlay writes position.
            </P>
          </Overlay.Content>
        </Overlay>
      </Div>
    )
  },

  StackedModals: () => {
    const [tier1Open, setTier1Open] = React.useState(false)
    const [tier2Open, setTier2Open] = React.useState(false)
    const [tier3Open, setTier3Open] = React.useState(false)
    const [authCode, setAuthCode] = React.useState('')

    return (
      <Div p="6r" display="flex" flexDirection="column" gap="4r">
        <Div>
          <H3 fontSize="4.5r" fontWeight="700" m="0">Stacked Modal Dialogs</H3>
          <P fontSize="3r" color="design.text.light" mt="1r" mb="3r">
            Multi-tier modal confirmations. Each nested modal automatically receives an elevated z-index (z:100 → z:110 → z:120) with independent dark backdrops that dim previous levels. Escape dismisses only the topmost modal.
          </P>
          <Button variant="primary" data-testid="btn-open-tier1" onClick={() => setTier1Open(true)}>
            Open Organization Settings (Tier 1)
          </Button>
        </Div>

        {/* Tier 1 Modal */}
        <Overlay open={tier1Open} onOpenChange={setTier1Open}>
          <Overlay.Backdrop bg="rgba(0,0,0,0.5)" />
          <Overlay.Content
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            role="dialog"
            aria-modal="true"
            data-testid="modal-tier1"
            {...dialogChrome}
          >
            <LayerBadge level={1} zIndex={100} type="Root Modal" />
            <H3 fontSize="4.5r" fontWeight="600" m="0">
              Organization Settings
            </H3>
            <P fontSize="3r" color="design.text.light" mt="1.5r" mb="4r">
              Manage workspace configuration, access policies, and deletion requests.
            </P>
            <Div p="3r" bg="rgba(255, 255, 255, 0.04)" borderRadius="md" border="1px solid rgba(255, 255, 255, 0.08)" mb="4r">
              <Div fontSize="2.8r" color="design.text.light">Active Members: <Span color="design.text.base" fontWeight="600">42 engineers</Span></Div>
              <Div fontSize="2.8r" color="design.text.light" mt="1r">Production Clusters: <Span color="design.text.base" fontWeight="600">8 regions</Span></Div>
            </Div>
            <Div display="flex" justifyContent="space-between" alignItems="center" mt="4r">
              <Button
                variant="destructive"
                data-testid="btn-open-tier2"
                onClick={() => setTier2Open(true)}
              >
                Delete Workspace...
              </Button>
              <Button data-testid="btn-close-tier1" onClick={() => setTier1Open(false)}>
                Done
              </Button>
            </Div>

            {/* Tier 2 Modal (Nested in Tier 1) */}
            <Overlay open={tier2Open} onOpenChange={setTier2Open}>
              <Overlay.Backdrop bg="rgba(0,0,0,0.6)" />
              <Overlay.Content
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                role="dialog"
                aria-modal="true"
                data-testid="modal-tier2"
                {...dialogChrome}
                minW="65r"
                border="1px solid"
                borderColor="ui.status.error.border"
              >
                <LayerBadge level={2} zIndex={110} type="Nested Modal" />
                <H3 fontSize="4.2r" fontWeight="600" m="0" color="ui.status.error.text">
                  Confirm Workspace Deletion
                </H3>
                <P fontSize="3r" color="design.text.light" mt="2r" mb="4r">
                  Warning: This action will purge all 8 cluster deployments and cannot be reversed. Two-factor authentication is required.
                </P>
                <Div display="flex" justifyContent="flex-end" gap="2r">
                  <Button data-testid="btn-cancel-tier2" onClick={() => setTier2Open(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    data-testid="btn-open-tier3"
                    onClick={() => setTier3Open(true)}
                  >
                    Proceed to 2FA Challenge...
                  </Button>
                </Div>

                {/* Tier 3 Modal (Nested in Tier 2) */}
                <Overlay open={tier3Open} onOpenChange={setTier3Open}>
                  <Overlay.Backdrop bg="rgba(0,0,0,0.7)" />
                  <Overlay.Content
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    role="dialog"
                    aria-modal="true"
                    data-testid="modal-tier3"
                    {...dialogChrome}
                    minW="55r"
                  >
                    <LayerBadge level={3} zIndex={120} type="Security Challenge" />
                    <H3 fontSize="4r" fontWeight="600" m="0">
                      Two-Factor Authentication
                    </H3>
                    <P fontSize="2.8r" color="design.text.light" mt="1.5r" mb="3r">
                      Enter the 6-digit verification code from your authenticator app to authorize deletion.
                    </P>
                    <Input
                      data-testid="input-auth-code"
                      placeholder="e.g. 849 201"
                      value={authCode}
                      onChange={(e: any) => setAuthCode(e.target.value)}
                      autoFocus
                      mb="4r"
                    />
                    <Div display="flex" justifyContent="flex-end" gap="2r">
                      <Button data-testid="btn-cancel-tier3" onClick={() => setTier3Open(false)}>
                        Back
                      </Button>
                      <Button
                        variant="destructive"
                        data-testid="btn-confirm-tier3"
                        onClick={() => {
                          setTier3Open(false)
                          setTier2Open(false)
                          setTier1Open(false)
                        }}
                      >
                        Authorize & Delete
                      </Button>
                    </Div>
                  </Overlay.Content>
                </Overlay>
              </Overlay.Content>
            </Overlay>
          </Overlay.Content>
        </Overlay>
      </Div>
    )
  },

  ModalWithPopoverAndTooltip: () => {
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [selectedTags, setSelectedTags] = React.useState<string[]>(['engineering', 'cloud'])
    const [newTag, setNewTag] = React.useState('')

    const availableTags = [
      { id: 'engineering', label: 'Engineering', desc: 'Core platform & services development' },
      { id: 'cloud', label: 'Cloud Ops', desc: 'Kubernetes infrastructure & multi-region networks' },
      { id: 'security', label: 'Security', desc: 'Vulnerability scanners, auth providers, IAM' },
      { id: 'ai', label: 'AI / Machine Learning', desc: 'Model inference engines & training clusters' },
    ]

    return (
      <Div p="6r" display="flex" flexDirection="column" gap="4r">
        <Div>
          <H3 fontSize="4.5r" fontWeight="700" m="0">Modal Hosting Portaled Popover & Tooltips</H3>
          <P fontSize="3r" color="design.text.light" mt="1r" mb="3r">
            Demonstrates an isolating modal dialog with active FocusLock hosting a portaled Popover and Tooltips. FocusLock respects portaled overlay children as valid shard targets and does not steal focus back to the dialog.
          </P>
          <Button variant="primary" data-testid="btn-open-perm-dialog" onClick={() => setDialogOpen(true)}>
            Edit Cluster Permissions (Modal)
          </Button>
        </Div>

        <Overlay open={dialogOpen} onOpenChange={setDialogOpen}>
          <Overlay.Backdrop bg="rgba(0,0,0,0.5)" />
          <Overlay.Content
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            role="dialog"
            aria-modal="true"
            data-testid="perm-dialog-content"
            {...dialogChrome}
            minW="80r"
          >
            <LayerBadge level={1} zIndex={100} type="Modal Dialog" />
            <H3 fontSize="4.5r" fontWeight="600" m="0">
              Cluster Access Policy
            </H3>
            <P fontSize="3r" color="design.text.light" mt="1.5r" mb="4r">
              Configure assigned capability tags and automated role elevation.
            </P>

            {/* Tag summary list with Tooltips */}
            <Div mb="4r">
              <Div fontSize="2.8r" fontWeight="600" mb="2r" color="design.text.base">
                Active Capability Tags:
              </Div>
              <Div display="flex" flexWrap="wrap" gap="2r">
                {selectedTags.map(tagId => {
                  const tag = availableTags.find(t => t.id === tagId)
                  return (
                    <Tooltip key={tagId} openDelay={100}>
                      <Tooltip.Trigger>
                        <Button
                          variant="secondary"
                          size="sm"
                          data-testid={`chip-tag-${tagId}`}
                        >
                          🏷️ {tag?.label ?? tagId}
                        </Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content placement="top" data-testid={`tooltip-tag-${tagId}`}>
                        {tag?.desc}
                        <Tooltip.Arrow />
                      </Tooltip.Content>
                    </Tooltip>
                  )
                })}
              </Div>
            </Div>

            {/* Popover trigger inside modal */}
            <Div display="flex" alignItems="center" gap="3r" pt="3r" borderTop="1px solid rgba(255, 255, 255, 0.08)">
              <Popover>
                <Popover.Trigger data-testid="btn-open-tag-popover" variant="primary">
                  + Manage Tags (Popover)
                </Popover.Trigger>
                <Popover.Content
                  p="4r"
                  bg="ui.dialog.background"
                  color="ui.dialog.foreground"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="ui.dialog.border"
                  boxShadow="0 10px 30px rgba(0,0,0,0.3)"
                  minW="55r"
                  data-testid="tag-popover-content"
                >
                  <LayerBadge level={2} zIndex={110} type="Portaled Popover" />
                  <H4 fontSize="3.5r" fontWeight="600" m="0" mb="2r">
                    Select Available Tags
                  </H4>
                  <Div display="flex" flexDirection="column" gap="1.5r" mb="3r">
                    {availableTags.map(tag => {
                      const isSelected = selectedTags.includes(tag.id)
                      return (
                        <Div
                          key={tag.id}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          p="2r"
                          borderRadius="sm"
                          bg={isSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.03)'}
                          cursor="pointer"
                          onClick={() => {
                            setSelectedTags(prev =>
                              prev.includes(tag.id)
                                ? prev.filter(t => t !== tag.id)
                                : [...prev, tag.id]
                            )
                          }}
                        >
                          <Span fontSize="2.8r" fontWeight={isSelected ? '600' : '400'}>
                            {tag.label}
                          </Span>
                          <Span fontSize="2.5r" color="design.text.light">
                            {isSelected ? '✓ Added' : '+ Add'}
                          </Span>
                        </Div>
                      )
                    })}
                  </Div>
                  <Div display="flex" gap="2r">
                    <Input
                      data-testid="input-custom-tag"
                      placeholder="Add custom tag..."
                      value={newTag}
                      onChange={(e: any) => setNewTag(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (newTag.trim()) {
                          setSelectedTags(prev => [...prev, newTag.trim().toLowerCase()])
                          setNewTag('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </Div>
                </Popover.Content>
              </Popover>

              <Tooltip openDelay={100}>
                <Tooltip.Trigger>
                  <Button variant="ghost" data-testid="btn-help-tooltip">
                    ℹ️ Help info
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content placement="right">
                  Changes take effect immediately across all cluster pods.
                  <Tooltip.Arrow />
                </Tooltip.Content>
              </Tooltip>
            </Div>

            <Div display="flex" justifyContent="flex-end" gap="2r" mt="5r">
              <Button data-testid="btn-close-perm-dialog" onClick={() => setDialogOpen(false)}>
                Close Policy Editor
              </Button>
            </Div>
          </Overlay.Content>
        </Overlay>
      </Div>
    )
  },

  NestedPopovers: () => {
    const [filterPopoverOpen, setFilterPopoverOpen] = React.useState(false)
    const [datePopoverOpen, setDatePopoverOpen] = React.useState(false)
    const [presetPopoverOpen, setPresetPopoverOpen] = React.useState(false)
    const [selectedRange, setSelectedRange] = React.useState('Last 30 Days')
    const [activePreset, setActivePreset] = React.useState('P99 Hourly')

    return (
      <Div p="6r" display="flex" flexDirection="column" gap="4r">
        <Div>
          <H3 fontSize="4.5r" fontWeight="700" m="0">Nested Cascading Popovers</H3>
          <P fontSize="3r" color="design.text.light" mt="1r" mb="3r">
            Three floating popovers anchored to each other. Popover 1 triggers Popover 2, which triggers Popover 3. Clicking outside or pressing Escape unwinds the layers in reverse order.
          </P>
          <Overlay open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen} isolation={false}>
            <Overlay.Trigger variant="primary" data-testid="btn-open-popover-tier1">
              Filter Metrics (Tier 1 Popover)
            </Overlay.Trigger>
            <Overlay.Content
              placement="bottom-start"
              offset={8}
              p="4r"
              bg="ui.dialog.background"
              color="ui.dialog.foreground"
              borderRadius="md"
              border="1px solid"
              borderColor="ui.dialog.border"
              boxShadow="0 10px 30px rgba(0,0,0,0.25)"
              minW="50r"
              data-testid="popover-tier1-content"
            >
              <LayerBadge level={1} zIndex={100} type="Filter Popover" />
              <H4 fontSize="3.5r" fontWeight="600" m="0" mb="2r">
                Query Filters
              </H4>
              <Div display="flex" flexDirection="column" gap="2r" mb="3r">
                <Div fontSize="2.8r" color="design.text.light">Environment: <Span color="design.text.base" fontWeight="600">Production</Span></Div>
                <Div fontSize="2.8r" color="design.text.light">Active Range: <Span color="design.text.base" fontWeight="600">{selectedRange}</Span></Div>
              </Div>

              {/* Tier 2 Popover Trigger inside Tier 1 */}
              <Overlay open={datePopoverOpen} onOpenChange={setDatePopoverOpen} isolation={false}>
                <Overlay.Trigger variant="secondary" data-testid="btn-open-popover-tier2">
                  Configure Date Range →
                </Overlay.Trigger>
                <Overlay.Content
                  placement="right-start"
                  offset={10}
                  p="4r"
                  bg="ui.dialog.background"
                  color="ui.dialog.foreground"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="ui.dialog.border"
                  boxShadow="0 10px 30px rgba(0,0,0,0.3)"
                  minW="50r"
                  data-testid="popover-tier2-content"
                >
                  <LayerBadge level={2} zIndex={110} type="Date Range Picker" />
                  <H4 fontSize="3.5r" fontWeight="600" m="0" mb="2r">
                    Select Range
                  </H4>
                  <Div display="flex" flexDirection="column" gap="1.5r" mb="3r">
                    {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Quarter to Date'].map(range => (
                      <Button
                        key={range}
                        size="sm"
                        variant={selectedRange === range ? 'primary' : 'ghost'}
                        justifyContent="flex-start"
                        onClick={() => setSelectedRange(range)}
                      >
                        {range}
                      </Button>
                    ))}
                  </Div>

                  {/* Tier 3 Popover Trigger inside Tier 2 */}
                  <Overlay open={presetPopoverOpen} onOpenChange={setPresetPopoverOpen} isolation={false}>
                    <Overlay.Trigger variant="secondary" size="sm" data-testid="btn-open-popover-tier3">
                      Advanced Granularity ({activePreset}) →
                    </Overlay.Trigger>
                    <Overlay.Content
                      placement="bottom-start"
                      offset={8}
                      p="4r"
                      bg="ui.dialog.background"
                      color="ui.dialog.foreground"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="ui.dialog.border"
                      boxShadow="0 12px 36px rgba(0,0,0,0.35)"
                      minW="45r"
                      data-testid="popover-tier3-content"
                    >
                      <LayerBadge level={3} zIndex={120} type="Granularity Preset" />
                      <H4 fontSize="3.2r" fontWeight="600" m="0" mb="2r">
                        Aggregation Buckets
                      </H4>
                      <Div display="flex" flexDirection="column" gap="1.5r">
                        {['P50 1-Minute', 'P95 5-Minute', 'P99 Hourly', 'Daily Rollup'].map(preset => (
                          <Button
                            key={preset}
                            size="sm"
                            variant={activePreset === preset ? 'primary' : 'ghost'}
                            justifyContent="flex-start"
                            onClick={() => {
                              setActivePreset(preset)
                              setPresetPopoverOpen(false)
                            }}
                          >
                            {preset}
                          </Button>
                        ))}
                      </Div>
                    </Overlay.Content>
                  </Overlay>
                </Overlay.Content>
              </Overlay>
            </Overlay.Content>
          </Overlay>
        </Div>
      </Div>
    )
  },

  FullShebangCascade: () => {
    const [modalOpen, setModalOpen] = React.useState(false)
    const [popoverOpen, setPopoverOpen] = React.useState(false)
    const [confirmModalOpen, setConfirmModalOpen] = React.useState(false)
    const [clusterNotes, setClusterNotes] = React.useState('Production cluster healthy. All nodes synchronized.')

    return (
      <Div p="6r" display="flex" flexDirection="column" gap="4r">
        <Div>
          <H3 fontSize="4.5r" fontWeight="700" m="0">The Full Shebang (5-Tier Deep Cascade)</H3>
          <P fontSize="3r" color="design.text.light" mt="1r" mb="3r">
            The ultimate deep overlay stacking showcase. Tier 1 Modal Dialog → Tier 2 Anchored Popover → Tier 3 Actions Menu → Tier 4 Confirmation Modal Dialog → Tier 5 Tooltip. Stacks cleanly with dynamic z-indices (z:100 → z:110 → z:120 → z:130 → z:140) and flawless Escape unwinding.
          </P>
          <Button variant="primary" data-testid="btn-open-shebang-root" onClick={() => setModalOpen(true)}>
            Open Infrastructure Console (Tier 1 Modal)
          </Button>
        </Div>

        {/* Tier 1 Modal */}
        <Overlay open={modalOpen} onOpenChange={setModalOpen}>
          <Overlay.Backdrop bg="rgba(0,0,0,0.5)" />
          <Overlay.Content
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            role="dialog"
            aria-modal="true"
            data-testid="shebang-tier1-modal"
            {...dialogChrome}
            minW="85r"
          >
            <LayerBadge level={1} zIndex={100} type="Infrastructure Console" />
            <Div display="flex" justifyContent="space-between" alignItems="flex-start">
              <Div>
                <H3 fontSize="4.5r" fontWeight="700" m="0">Cluster Controller</H3>
                <P fontSize="3r" color="design.text.light" mt="1r" mb="0">
                  Real-time orchestrator for worker nodes.
                </P>
              </Div>
              <Tooltip openDelay={50}>
                <Tooltip.Trigger>
                  <Button variant="secondary" size="sm" data-testid="btn-cluster-health-tooltip">
                    🟢 99.98% Healthy
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content placement="bottom-end">
                  All 12 cluster control plane nodes responding within 4ms.
                  <Tooltip.Arrow />
                </Tooltip.Content>
              </Tooltip>
            </Div>

            <Div p="3r" bg="rgba(255, 255, 255, 0.03)" borderRadius="md" border="1px solid rgba(255, 255, 255, 0.08)" my="4r">
              <Div fontSize="2.8r" color="design.text.light">Cluster Region: <Span color="design.text.base" fontWeight="600">eu-central-1</Span></Div>
              <Div fontSize="2.8r" color="design.text.light" mt="1r">Worker Nodes: <Span color="design.text.base" fontWeight="600">24 active / 0 cordoned</Span></Div>
            </Div>

            {/* Tier 2 Popover Trigger inside Modal */}
            <Div display="flex" gap="2r" alignItems="center">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <Popover.Trigger variant="primary" data-testid="btn-open-shebang-tier2">
                  Inspect Worker Node 04 (Tier 2 Popover) →
                </Popover.Trigger>
                <Popover.Content
                  p="4r"
                  bg="ui.dialog.background"
                  color="ui.dialog.foreground"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="ui.dialog.border"
                  boxShadow="0 10px 30px rgba(0,0,0,0.3)"
                  minW="60r"
                  data-testid="shebang-tier2-popover"
                >
                  <LayerBadge level={2} zIndex={110} type="Node Inspector" />
                  <H4 fontSize="3.5r" fontWeight="600" m="0" mb="2r">
                    Worker Node: worker-eu-04.k8s
                  </H4>
                  <P fontSize="2.8r" color="design.text.light" mb="3r">
                    Allocated Pods: 18 • CPU Load: 34% • Memory: 14.2 GB / 32 GB
                  </P>

                  <Div mb="3r">
                    <Input
                      data-testid="shebang-input-notes"
                      placeholder="Operator notes..."
                      value={clusterNotes}
                      onChange={(e: any) => setClusterNotes(e.target.value)}
                    />
                  </Div>

                  {/* Tier 3 Menu Trigger inside Popover */}
                  <Div display="flex" justifyContent="space-between" alignItems="center">
                    <Menu>
                      <Menu.Trigger variant="secondary" data-testid="btn-open-shebang-tier3">
                        Node Operations Menu (Tier 3) ▾
                      </Menu.Trigger>
                      <Menu.Content data-testid="shebang-tier3-menu">
                        <Menu.Item data-testid="menu-item-diagnostics" onClick={() => console.log('Diagnostics')}>
                          Run Node Diagnostics
                        </Menu.Item>
                        <Menu.Item data-testid="menu-item-metrics" onClick={() => console.log('Metrics')}>
                          Export Metrics (Prometheus)
                        </Menu.Item>
                        <Menu.Separator />
                        <Menu.Item
                          data-testid="menu-item-drain"
                          color="ui.status.error.text"
                          onClick={() => setConfirmModalOpen(true)}
                        >
                          ⚠️ Drain & Cordon Node...
                        </Menu.Item>
                      </Menu.Content>
                    </Menu>

                    <Button size="sm" onClick={() => setPopoverOpen(false)}>
                      Dismiss
                    </Button>
                  </Div>
                </Popover.Content>
              </Popover>
            </Div>

            <Div display="flex" justifyContent="flex-end" mt="5r">
              <Button data-testid="btn-close-shebang-root" onClick={() => setModalOpen(false)}>
                Close Console
              </Button>
            </Div>

            {/* Tier 4 Confirmation Modal Triggered from Menu */}
            <Overlay open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
              <Overlay.Backdrop bg="rgba(0,0,0,0.65)" />
              <Overlay.Content
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                role="dialog"
                aria-modal="true"
                data-testid="shebang-tier4-modal"
                {...dialogChrome}
                minW="60r"
                border="1px solid"
                borderColor="ui.status.error.border"
              >
                <LayerBadge level={4} zIndex={130} type="Emergency Drain Confirmation" />
                <H3 fontSize="4.2r" fontWeight="700" m="0" color="ui.status.error.text">
                  Drain Node: worker-eu-04.k8s
                </H3>
                <P fontSize="3r" color="design.text.light" mt="2r" mb="4r">
                  Evacuating this node will reschedule 18 running pods onto neighbouring workers. Confirm evacuation procedure.
                </P>

                <Div display="flex" justifyContent="flex-end" alignItems="center" gap="2r">
                  <Button data-testid="btn-cancel-shebang-tier4" onClick={() => setConfirmModalOpen(false)}>
                    Cancel
                  </Button>

                  {/* Tier 5 Tooltip on Destructive Action */}
                  <Tooltip openDelay={50}>
                    <Tooltip.Trigger>
                      <Button
                        variant="destructive"
                        data-testid="btn-confirm-drain-tier4"
                        onClick={() => {
                          setConfirmModalOpen(false)
                          setPopoverOpen(false)
                        }}
                      >
                        Evacuate Pods
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content placement="top" data-testid="shebang-tier5-tooltip">
                      Tier 5 Tooltip: Graceful pod termination timeout is 60s.
                      <Tooltip.Arrow />
                    </Tooltip.Content>
                  </Tooltip>
                </Div>
              </Overlay.Content>
            </Overlay>
          </Overlay.Content>
        </Overlay>
      </Div>
    )
  },

  DrawerWithNestedOverlays: () => {
    const [drawerOpen, setDrawerOpen] = React.useState(false)
    const [popoverOpen, setPopoverOpen] = React.useState(false)
    const [dialogOpen, setDialogOpen] = React.useState(false)

    return (
      <Div p="6r" display="flex" flexDirection="column" gap="4r">
        <Div>
          <H3 fontSize="4.5r" fontWeight="700" m="0">Bottom Sheet / Drawer with Nested Overlays</H3>
          <P fontSize="3r" color="design.text.light" mt="1r" mb="3r">
            An edge sheet overlay (edge="bottom") hosting an anchored Popover, a Menu, and a nested confirmation Modal dialog.
          </P>
          <Button variant="primary" data-testid="btn-open-drawer" onClick={() => setDrawerOpen(true)}>
            Open Bottom Drawer (edge="bottom")
          </Button>
        </Div>

        <Overlay open={drawerOpen} onOpenChange={setDrawerOpen} edge="bottom">
          <Overlay.Backdrop bg="rgba(0,0,0,0.5)" />
          <Overlay.Content
            p="5r"
            bg="ui.dialog.background"
            color="ui.dialog.foreground"
            borderTop="1px solid"
            borderColor="ui.dialog.border"
            borderTopLeftRadius="xl"
            borderTopRightRadius="xl"
            boxShadow="0 -10px 40px rgba(0,0,0,0.3)"
            maxHeight="60vh"
            overflow="auto"
            data-testid="bottom-drawer-content"
          >
            <Overlay.Handle />
            <LayerBadge level={1} zIndex={100} type="Edge Sheet (bottom)" />
            <H3 fontSize="4.5r" fontWeight="700" m="0">
              Drawer Control Panel
            </H3>
            <P fontSize="3r" color="design.text.light" mt="1r" mb="4r">
              Swipe down on the handle to dismiss, or interact with nested overlays inside this sheet.
            </P>

            <Div display="flex" flexWrap="wrap" gap="3r" alignItems="center">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <Popover.Trigger variant="secondary" data-testid="btn-drawer-popover">
                  Open Drawer Popover
                </Popover.Trigger>
                <Popover.Content
                  p="4r"
                  bg="ui.dialog.background"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="ui.dialog.border"
                  boxShadow="0 8px 24px rgba(0,0,0,0.2)"
                  minW="45r"
                  data-testid="drawer-popover-content"
                >
                  <LayerBadge level={2} zIndex={110} type="Drawer Popover" />
                  <P fontSize="3r" m="0" mb="2r">
                    Anchored floating popover nested inside a bottom sheet!
                  </P>
                  <Button size="sm" onClick={() => setPopoverOpen(false)}>
                    Close
                  </Button>
                </Popover.Content>
              </Popover>

              <Button
                variant="destructive"
                data-testid="btn-drawer-dialog"
                onClick={() => setDialogOpen(true)}
              >
                Open Confirmation Dialog
              </Button>

              <Button data-testid="btn-close-drawer" onClick={() => setDrawerOpen(false)}>
                Close Sheet
              </Button>
            </Div>

            {/* Nested Modal inside Drawer */}
            <Overlay open={dialogOpen} onOpenChange={setDialogOpen}>
              <Overlay.Backdrop bg="rgba(0,0,0,0.6)" />
              <Overlay.Content
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                role="dialog"
                aria-modal="true"
                data-testid="drawer-nested-modal"
                {...dialogChrome}
              >
                <LayerBadge level={2} zIndex={110} type="Modal over Sheet" />
                <H3 fontSize="4.2r" fontWeight="600" m="0">
                  Confirmation Dialog
                </H3>
                <P fontSize="3r" color="design.text.light" mt="2r" mb="4r">
                  Modal dialog stacked cleanly over the bottom drawer with its own dimming backdrop.
                </P>
                <Div display="flex" justifyContent="flex-end" gap="2r">
                  <Button onClick={() => setDialogOpen(false)}>
                    Dismiss
                  </Button>
                </Div>
              </Overlay.Content>
            </Overlay>
          </Overlay.Content>
        </Overlay>
      </Div>
    )
  },
}
