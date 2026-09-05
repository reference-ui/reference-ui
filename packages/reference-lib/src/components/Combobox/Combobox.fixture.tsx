import * as React from 'react'
import { Button, Div, Span } from '@reference-ui/react'
import { ArrowDropDownIcon } from '@reference-ui/icons'
import { Combobox } from './index'
import { Field } from '../Field'
import { Listbox } from '../Listbox'

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
]

function selectedLabel(value: string | null) {
  return frameworks.find(item => item.value === value)?.label ?? 'Select framework'
}

export default {
  Searchable: () => {
    const [selected, setSelected] = React.useState<string | null>('react')
    const [query, setQuery] = React.useState('React')
    const selectedItem = frameworks.find(item => item.value === selected)
    const searching = query !== (selectedItem?.label ?? '')
    const visible = searching
      ? frameworks.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
      : frameworks

    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Combobox
          value={selected}
          onChange={value => {
            setSelected(value)
            setQuery(frameworks.find(item => item.value === value)?.label ?? '')
          }}
          inputValue={query}
          onInputValueChange={setQuery}
        >
          <Field width="100%">
            <Combobox.Input placeholder="Select framework..." />
            <Button
              type="button"
              aria-label="Open suggestions"
              width="8.5r"
              height="8.5r"
              minWidth="8.5r"
              p="0"
              bg="transparent"
              border="none"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              color="design.text.base"
              _hover={{ bg: 'ui.button.mutedBackground' }}
              onClick={event => {
                const field = event.currentTarget.closest('[data-reference-field]')
                field?.querySelector('input')?.focus()
              }}
            >
              <ArrowDropDownIcon width="4r" height="4r" />
            </Button>
          </Field>
          <Combobox.Popover>
            <Listbox>
              {visible.length ? (
                visible.map(item => (
                  <Listbox.Option key={item.value} value={item.value} textValue={item.label}>
                    {item.label}
                  </Listbox.Option>
                ))
              ) : (
                <Listbox.Empty>No frameworks found</Listbox.Empty>
              )}
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Span fontSize="3r" color="design.text.light">
          Selected framework: {selected ?? 'None'}
        </Span>
      </Div>
    )
  },
  WithSections: () => {
    const [selected, setSelected] = React.useState<string | null>('react')
    const [query, setQuery] = React.useState('React')

    const sections = [
      {
        title: 'Frontend Libraries',
        items: [
          { value: 'react', label: 'React' },
          { value: 'vue', label: 'Vue' },
          { value: 'svelte', label: 'Svelte' },
        ],
      },
      {
        title: 'Fullstack Frameworks',
        items: [
          { value: 'next', label: 'Next.js' },
          { value: 'nuxt', label: 'Nuxt' },
          { value: 'remix', label: 'Remix' },
          { value: 'astro', label: 'Astro', disabled: true },
        ],
      },
    ]

    const allItems = sections.flatMap(s => s.items)
    const selectedItem = allItems.find(item => item.value === selected)
    const searching = query !== (selectedItem?.label ?? '')

    const filteredSections = sections
      .map(sec => ({
        ...sec,
        items: searching
          ? sec.items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
          : sec.items,
      }))
      .filter(sec => sec.items.length > 0)

    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Combobox
          value={selected}
          onChange={value => {
            setSelected(value)
            setQuery(allItems.find(item => item.value === value)?.label ?? '')
          }}
          inputValue={query}
          onInputValueChange={setQuery}
        >
          <Field width="100%">
            <Combobox.Input placeholder="Search libraries..." />
            <Button
              type="button"
              aria-label="Open suggestions"
              width="8.5r"
              height="8.5r"
              minWidth="8.5r"
              p="0"
              bg="transparent"
              border="none"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              color="design.text.base"
              _hover={{ bg: 'ui.button.mutedBackground' }}
              onClick={event => {
                const field = event.currentTarget.closest('[data-reference-field]')
                field?.querySelector('input')?.focus()
              }}
            >
              <ArrowDropDownIcon width="4r" height="4r" />
            </Button>
          </Field>
          <Combobox.Popover>
            <Listbox>
              {filteredSections.length ? (
                filteredSections.map(sec => (
                  <Listbox.Section key={sec.title} title={sec.title}>
                    {sec.items.map(item => (
                      <Listbox.Option
                        key={item.value}
                        value={item.value}
                        textValue={item.label}
                        disabled={item.disabled}
                      >
                        {item.label}
                      </Listbox.Option>
                    ))}
                  </Listbox.Section>
                ))
              ) : (
                <Listbox.Empty>No matching libraries</Listbox.Empty>
              )}
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Span fontSize="3r" color="design.text.light">
          Selected: {selected ?? 'None'}
        </Span>
      </Div>
    )
  },
  WithDescriptions: () => {
    const [selected, setSelected] = React.useState<string | null>('deploy')
    const options = [
      { value: 'deploy', label: 'Deploy to Production', desc: 'Trigger immediate production rollout', disabled: false },
      { value: 'preview', label: 'Create Preview Deployment', desc: 'Spin up ephemeral branch environment', disabled: false },
      { value: 'rollback', label: 'Rollback Release', desc: 'Revert traffic to previous deployment', disabled: true },
    ]
    return (
      <Div maxW="90r" display="flex" flexDirection="column" gap="3r">
        <Combobox
          value={selected}
          onChange={setSelected}
        >
          <Field width="100%">
            <Combobox.Input placeholder="Choose action..." />
            <Button
              type="button"
              aria-label="Open suggestions"
              width="8.5r"
              height="8.5r"
              minWidth="8.5r"
              p="0"
              bg="transparent"
              border="none"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              color="design.text.base"
              _hover={{ bg: 'ui.button.mutedBackground' }}
            >
              <ArrowDropDownIcon width="4r" height="4r" />
            </Button>
          </Field>
          <Combobox.Popover>
            <Listbox>
              {options.map(opt => (
                <Listbox.Option
                  key={opt.value}
                  value={opt.value}
                  textValue={opt.label}
                  disabled={opt.disabled}
                  height="auto"
                  minHeight="10r"
                  py="1.5r"
                >
                  <Span display="flex" flexDirection="column" gap="0.5r">
                    <Span fontWeight="500">{opt.label}</Span>
                    <Span data-slot="description">{opt.desc}</Span>
                  </Span>
                </Listbox.Option>
              ))}
            </Listbox>
          </Combobox.Popover>
        </Combobox>
      </Div>
    )
  },
  SelectOnly: () => {
    const [selected, setSelected] = React.useState<string | null>('react')
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Combobox value={selected} onChange={setSelected}>
          <Combobox.Trigger width="100%" justifyContent="space-between">
            {selectedLabel(selected)}
            <ArrowDropDownIcon width="4r" height="4r" />
          </Combobox.Trigger>
          <Combobox.Popover>
            <Listbox>
              {frameworks.map(item => (
                <Listbox.Option key={item.value} value={item.value}>
                  {item.label}
                </Listbox.Option>
              ))}
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Span fontSize="3r" color="design.text.light">
          Selected framework: {selected ?? 'None'}
        </Span>
      </Div>
    )
  },
}
