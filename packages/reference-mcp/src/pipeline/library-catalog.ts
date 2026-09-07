import type { McpComponent, McpComponentProp } from './types'

function libProp(
  name: string,
  type: string,
  description: string,
  optional = true
): McpComponentProp {
  return {
    name,
    count: 0,
    usage: 'unused',
    type,
    description,
    optional,
    readonly: false,
    origin: 'documented',
    styleProp: false,
  }
}

export const REFERENCE_UI_LIBRARY_COMPONENTS: McpComponent[] = [
  {
    "name": "Accordion",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Coordinates a collection of Collapsibles: single/multiple expansion and optional keyboard traversal between headers.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Accordion",
      "parts": [
        {
          "name": "Accordion.Item",
          "tag": "<Accordion.Item>",
          "requiredProps": []
        },
        {
          "name": "Accordion.Trigger",
          "tag": "<Accordion.Trigger>",
          "requiredProps": []
        },
        {
          "name": "Accordion.Content",
          "tag": "<Accordion.Content>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Accordion expansion=\"single\" value={value} onChange={setValue}>\n  <Collapsible id=\"billing\">\n    <Collapsible.Trigger>Billing</Collapsible.Trigger>\n    <Collapsible.Content>{children}</Collapsible.Content>\n  </Collapsible>\n  <Collapsible id=\"team\">\n    <Collapsible.Trigger>Team</Collapsible.Trigger>\n    <Collapsible.Content>{children}</Collapsible.Content>\n  </Collapsible>\n</Accordion>"
    ],
    "interface": {
      "name": "AccordionProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "expansion",
        "count": 0,
        "usage": "unused",
        "type": "'single' | 'multiple'",
        "description": "Determines whether one or multiple items can be opened simultaneously.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "value",
        "count": 0,
        "usage": "unused",
        "type": "string | string[] | null",
        "description": "The controlled value of the expanded item(s).",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultValue",
        "count": 0,
        "usage": "unused",
        "type": "string | string[] | null",
        "description": "The initial value of the expanded item(s).",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onChange",
        "count": 0,
        "usage": "unused",
        "type": "(value: string | string[] | null) => void",
        "description": "Event handler called when the expanded state changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "When true, prevents user from interacting with any accordion item.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "keyboard",
        "count": 0,
        "usage": "unused",
        "type": "'headers' | 'none' | 'arrows'",
        "description": "Keyboard navigation behavior across accordion headers.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Accordion.Item or Collapsible elements.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Calendar",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Date-grid engine. Locale-aware week start and weekday headings, padded month grids, 2D keyboard movement, disabled/unavailable skipping, min/max clamping, today vs selected vs focused, range selection, and heading-driven month/year navigation. Values are canonical ISO calendar strings: `YYYY-MM-DD` in day/range mode, `YYYY-MM` in month mode, and `YYYY` in year mode — never `Date` objects or third-party date-library values. Locale is explicit; `Intl` supplies labels and week-start. Calendar does not parse typed input, format field values, or own time-of-day. Typed dates are `DateField`.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Calendar",
      "parts": [
        {
          "name": "Calendar.Grid",
          "tag": "<Calendar.Grid>",
          "requiredProps": []
        },
        {
          "name": "Calendar.Weekdays",
          "tag": "<Calendar.Weekdays>",
          "requiredProps": []
        },
        {
          "name": "Calendar.Days",
          "tag": "<Calendar.Days>",
          "requiredProps": []
        },
        {
          "name": "Calendar.Day",
          "tag": "<Calendar.Day>",
          "requiredProps": []
        },
        {
          "name": "Calendar.Header",
          "tag": "<Calendar.Header>",
          "requiredProps": []
        },
        {
          "name": "Calendar.Heading",
          "tag": "<Calendar.Heading>",
          "requiredProps": []
        },
        {
          "name": "Calendar.PrevButton",
          "tag": "<Calendar.PrevButton>",
          "requiredProps": []
        },
        {
          "name": "Calendar.NextButton",
          "tag": "<Calendar.NextButton>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Calendar\n  value={value}\n  onChange={setValue}\n  locale=\"en-GB\"\n  min={min}\n  max={max}\n/>",
      "<Calendar\n  mode=\"range\"\n  value={range}\n  onChange={setRange}\n  locale=\"en-GB\"\n/>"
    ],
    "interface": {
      "name": "CalendarProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "mode",
        "count": 0,
        "usage": "unused",
        "type": "'day' | 'range' | 'month' | 'year'",
        "description": "Selection mode for the calendar.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "value",
        "count": 0,
        "usage": "unused",
        "type": "ISODate | DateRangeValue | null",
        "description": "The controlled calendar date value.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultValue",
        "count": 0,
        "usage": "unused",
        "type": "ISODate | DateRangeValue | null",
        "description": "Default date value when uncontrolled.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onChange",
        "count": 0,
        "usage": "unused",
        "type": "(value: any) => void",
        "description": "Event handler called when selected date changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "locale",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "BCP 47 language tag for calendar localization (e.g. \"en-US\").",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "min",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "Earliest selectable ISO date (YYYY-MM-DD).",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "max",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "Latest selectable ISO date (YYYY-MM-DD).",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "When true, disables date interaction.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Collapsible",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Coordinates a single disclosure trigger and content region: `aria-expanded`, `aria-controls`, controlled visibility.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Collapsible",
      "parts": [
        {
          "name": "Collapsible.Trigger",
          "tag": "<Collapsible.Trigger>",
          "requiredProps": [],
          "description": "renders `button`."
        },
        {
          "name": "Collapsible.Content",
          "tag": "<Collapsible.Content>",
          "requiredProps": [],
          "description": "renders `div`."
        }
      ]
    },
    "examples": [
      "<Collapsible open={open} onChange={setOpen}>\n  <Collapsible.Trigger>Details</Collapsible.Trigger>\n  <Collapsible.Content>{children}</Collapsible.Content>\n</Collapsible>"
    ],
    "interface": {
      "name": "CollapsibleProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "open",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Controlled open state.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultOpen",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Default open state.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onOpenChange",
        "count": 0,
        "usage": "unused",
        "type": "(open: boolean) => void",
        "description": "Handler called when open state changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Disables collapsible trigger.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Combobox",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Coordinates an input with an associated popup while preserving DOM focus and native text editing. Active-descendant, autocomplete modes, suggestion navigation, value commitment, dismissal, restoration of the previous value.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Combobox",
      "parts": [
        {
          "name": "Combobox.Input",
          "tag": "<Combobox.Input>",
          "requiredProps": []
        },
        {
          "name": "Combobox.Popover",
          "tag": "<Combobox.Popover>",
          "requiredProps": [],
          "description": "renders `div` as wrapped\n`Overlay."
        },
        {
          "name": "Combobox.Trigger",
          "tag": "<Combobox.Trigger>",
          "requiredProps": []
        },
        {
          "name": "Combobox.VirtualItem",
          "tag": "<Combobox.VirtualItem>",
          "requiredProps": []
        },
        {
          "name": "Combobox.Option",
          "tag": "<Combobox.Option>",
          "requiredProps": []
        },
        {
          "name": "Combobox.Section",
          "tag": "<Combobox.Section>",
          "requiredProps": []
        },
        {
          "name": "Combobox.Empty",
          "tag": "<Combobox.Empty>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Combobox\n  open={open}\n  onOpen={() => setOpen(true)}\n  onDismiss={() => setOpen(false)}\n  value={value}\n  onChange={setValue}\n  inputValue={inputValue}\n  onInputValueChange={setInputValue}\n>\n  <Combobox.Input aria-label=\"Search people\" />\n  <Combobox.Popover>\n    <Listbox value={value}>\n      {options.map((option) => (\n        <Listbox.Option key={option.id} value={option.id}>\n          {option.label}\n        </Listbox.Option>\n      ))}\n    </Listbox>\n  </Combobox.Popover>\n</Combobox>",
      "<Combobox\n  open={open}\n  onOpen={() => setOpen(true)}\n  onDismiss={() => setOpen(false)}\n  value={value}\n  onChange={setValue}\n>\n  <Combobox.Trigger>{selectedLabel}</Combobox.Trigger>\n  <Combobox.Popover>\n    <Listbox value={value}>\n      {options.map((option) => (\n        <Listbox.Option key={option.id} value={option.id}>\n          {option.label}\n        </Listbox.Option>\n      ))}\n    </Listbox>\n  </Combobox.Popover>\n</Combobox>"
    ],
    "interface": {
      "name": "ComboboxProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "items",
        "count": 0,
        "usage": "unused",
        "type": "T[]",
        "description": "Array of items displayed in combobox popup.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "value",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "Selected item value.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onValueChange",
        "count": 0,
        "usage": "unused",
        "type": "(value: string) => void",
        "description": "Handler called when selection changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "DateField",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Locale-aware editing of date values. `DateField` is the recipe: - **Childless (folded)**: collapses directly to `DateField.Input`, rendering one visible locale textbox (`input[type=text]`) and managing one controlled ISO calendar date. - **Folded standard date picker**: adding `<DateField.Picker />` folds in the complete date-picker capability (trigger, popup layer, day Calendar integration, and dismissal on selection) without requiring manual assembly. - **Range editing**: two dates are `<DateField.Range>`, which manages range value types (`{ start: ISODate, end: ISODate } | null`), two inputs (`DateField.Start` and `DateField.End`), active endpoint tracking, and draft/Apply transactions in its own unified namespace. - **Unfolding on demand**: every part (`DateField.Input`, `DateField.Trigger`, `DateField.Picker`, `DateField.Calendar`, `DateField.Start`, `DateField.End`) can be explicitly authored to customize styling, icons, labels, or grid presentation without rebuilding the component.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "DateField",
      "parts": [
        {
          "name": "DateField.Picker",
          "tag": "<DateField.Picker>",
          "requiredProps": [
            "placement"
          ]
        },
        {
          "name": "DateField.Input",
          "tag": "<DateField.Input>",
          "requiredProps": []
        },
        {
          "name": "DateField.Trigger",
          "tag": "<DateField.Trigger>",
          "requiredProps": []
        },
        {
          "name": "DateField.Range",
          "tag": "<DateField.Range>",
          "requiredProps": [
            "value"
          ]
        },
        {
          "name": "DateField.Start",
          "tag": "<DateField.Start>",
          "requiredProps": []
        },
        {
          "name": "DateField.End",
          "tag": "<DateField.End>",
          "requiredProps": []
        },
        {
          "name": "DateField.Calendar",
          "tag": "<DateField.Calendar>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Label htmlFor=\"birthday\">Birthday</Label>\n<DateField\n  id=\"birthday\"\n  value={value}\n  onChange={setValue}\n  locale=\"en-GB\"\n  name=\"birthday\"\n  placeholder=\"DD/MM/YYYY\"\n/>",
      "<Label htmlFor=\"birthday\">Birthday</Label>\n<DateField\n  id=\"birthday\"\n  value={value}\n  onChange={setValue}\n  locale=\"en-GB\"\n  name=\"birthday\"\n>\n  <DateField.Picker />\n</DateField>"
    ],
    "interface": {
      "name": "DateFieldProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "value",
        "count": 0,
        "usage": "unused",
        "type": "string | null",
        "description": "Controlled ISO date string (YYYY-MM-DD).",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultValue",
        "count": 0,
        "usage": "unused",
        "type": "string | null",
        "description": "Default ISO date string.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onChange",
        "count": 0,
        "usage": "unused",
        "type": "(value: string | null) => void",
        "description": "Handler called when date value changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "locale",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "BCP 47 language tag for date formatting.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "min",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "Minimum allowed date.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "max",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "Maximum allowed date.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Disables date field input.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Field",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "The visual bezel around a form control. Field owns chrome: background, radius, spacing, prefix/suffix layout, and the visible focus ring. The enclosed control owns semantics: label, `aria-invalid`, descriptions, disabled, and read-only. Label sits above Field, never inside it.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "single",
      "root": "Field",
      "parts": []
    },
    "examples": [
      "<Label htmlFor=\"amount\">Amount</Label>\n\n<Field>\n  <span aria-hidden=\"true\">£</span>\n\n  <Input\n    id=\"amount\"\n    aria-invalid={invalid}\n    aria-describedby={invalid ? \"amount-error\" : undefined}\n  />\n\n  <Button type=\"button\" aria-label=\"Clear amount\">\n    ×\n  </Button>\n</Field>\n\n{invalid ? <P id=\"amount-error\">Enter an amount.</P> : null}",
      "<Label htmlFor=\"start-input\">Start date</Label>\n<DateField\n  id=\"start-input\"\n  value={date}\n  onChange={setDate}\n  locale=\"en-GB\"\n>\n  <DateField.Input />\n  <DateField.Trigger aria-label=\"Open calendar\">\n    <CalendarIcon />\n  </DateField.Trigger>\n  <DateField.Picker>\n    <Calendar />\n  </DateField.Picker>\n</DateField>"
    ],
    "interface": {
      "name": "FieldProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "status",
        "count": 0,
        "usage": "unused",
        "type": "'warning'",
        "description": "Validation state flag.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Form control, label, and description children.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "FocusLock",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Contains keyboard focus inside a subtree: Tab cycles, programmatic focus is reclaimed, focus is restored when the lock deactivates. Overlay uses this internally. Distinct from `RovingFocus`, which moves `tabindex` among items inside a composite widget.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "single",
      "root": "FocusLock",
      "parts": []
    },
    "examples": [
      "<FocusLock>\n  <Div role=\"dialog\" aria-modal=\"true\">\n    {children}\n  </Div>\n</FocusLock>",
      "<FocusLock\n  initialFocus={confirmRef}\n  shards={[popoverContent]}\n>\n  <Div role=\"dialog\" aria-modal=\"true\">\n    {children}\n  </Div>\n</FocusLock>"
    ],
    "interface": {
      "name": "FocusLockProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "When true, focus trapping is disabled.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "initialFocus",
        "count": 0,
        "usage": "unused",
        "type": "HTMLElement | boolean",
        "description": "Initial element to focus on mount.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "restoreFocus",
        "count": 0,
        "usage": "unused",
        "type": "HTMLElement | boolean",
        "description": "Element to restore focus to on unmount.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Listbox",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Selection and option-management engine. Single/multi selection, disabled skipping, typeahead, keyboard navigation. Built on `RovingFocus`.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Listbox",
      "parts": [
        {
          "name": "Listbox.Option",
          "tag": "<Listbox.Option>",
          "requiredProps": [
            "value"
          ],
          "description": "renders `div` with `role=\"option\"`."
        },
        {
          "name": "Listbox.Section",
          "tag": "<Listbox.Section>",
          "requiredProps": []
        },
        {
          "name": "Listbox.Header",
          "tag": "<Listbox.Header>",
          "requiredProps": []
        },
        {
          "name": "Listbox.Empty",
          "tag": "<Listbox.Empty>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Listbox value={value} onChange={setValue} selection=\"single\">\n  <Listbox.Option value=\"alpha\">Alpha</Listbox.Option>\n  <Listbox.Option value=\"bravo\" disabled>\n    Bravo\n  </Listbox.Option>\n</Listbox>"
    ],
    "interface": {
      "name": "ListboxProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "selection",
        "count": 0,
        "usage": "unused",
        "type": "'single' | 'multiple'",
        "description": "Selection mode.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "value",
        "count": 0,
        "usage": "unused",
        "type": "string | string[] | null",
        "description": "Controlled selected value.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultValue",
        "count": 0,
        "usage": "unused",
        "type": "string | string[] | null",
        "description": "Default selected value.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onChange",
        "count": 0,
        "usage": "unused",
        "type": "(value: any) => void",
        "description": "Handler called when selection changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "orientation",
        "count": 0,
        "usage": "unused",
        "type": "'horizontal' | 'vertical'",
        "description": "Layout orientation for arrow navigation.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Disables listbox options.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Menu",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "`role=\"menu\"` keyboard navigation, item activation, typeahead, nested submenu orchestration. Built on `RovingFocus`. Composes with `Popover` for dropdown and context-menu open policy. Geometry is Overlay's Floating UI port. Adopts Overlay's shared layer stack.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Menu",
      "parts": [
        {
          "name": "Menu.Item",
          "tag": "<Menu.Item>",
          "requiredProps": []
        },
        {
          "name": "Menu.Separator",
          "tag": "<Menu.Separator>",
          "requiredProps": []
        },
        {
          "name": "Menu.Trigger",
          "tag": "<Menu.Trigger>",
          "requiredProps": []
        },
        {
          "name": "Menu.Content",
          "tag": "<Menu.Content>",
          "requiredProps": []
        },
        {
          "name": "Menu.CheckboxItem",
          "tag": "<Menu.CheckboxItem>",
          "requiredProps": [
            "checked"
          ]
        },
        {
          "name": "Menu.RadioGroup",
          "tag": "<Menu.RadioGroup>",
          "requiredProps": [
            "value"
          ]
        },
        {
          "name": "Menu.RadioItem",
          "tag": "<Menu.RadioItem>",
          "requiredProps": [
            "value"
          ]
        },
        {
          "name": "Menu.LinkItem",
          "tag": "<Menu.LinkItem>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Popover\n  open={open}\n  onOpen={() => setOpen(true)}\n  onDismiss={close}\n>\n  <Popover.Trigger>File</Popover.Trigger>\n  <Popover.Content placement=\"bottom-start\">\n    <Menu>\n      <Menu.Item onSelect={create}>New</Menu.Item>\n      <Menu.Item onSelect={openFile}>Open</Menu.Item>\n      <Menu.Separator />\n      <Menu\n        open={shareOpen}\n        onOpen={() => setShareOpen(true)}\n        onDismiss={() => setShareOpen(false)}\n      >\n        <Menu.Trigger>Share</Menu.Trigger>\n        <Menu.Content>\n          <Menu.Item onSelect={shareEmail}>Email</Menu.Item>\n          <Menu.Item onSelect={shareLink}>Copy link</Menu.Item>\n        </Menu.Content>\n      </Menu>\n    </Menu>\n  </Popover.Content>\n</Popover>",
      "<Menu>\n  <Menu.CheckboxItem checked={showGrid} onChange={setShowGrid}>\n    Show grid\n  </Menu.CheckboxItem>\n  <Menu.RadioGroup value={sort} onChange={setSort} aria-label=\"Sort by\">\n    <Menu.RadioItem value=\"name\">Name</Menu.RadioItem>\n    <Menu.RadioItem value=\"date\">Date</Menu.RadioItem>\n  </Menu.RadioGroup>\n  <Menu.LinkItem href=\"/help\">Help</Menu.LinkItem>\n</Menu>"
    ],
    "interface": {
      "name": "MenuProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "open",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "The controlled open state of the menu.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onOpenChange",
        "count": 0,
        "usage": "unused",
        "type": "(open: boolean) => void",
        "description": "Event handler called when open state changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Menu.Trigger and Menu.Content.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "NumberField",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Locale-aware numeric text editing and discrete stepping. NumberField owns the hard boundary between an ephemeral localized edit string and one controlled application value. It accepts partial input without publishing `NaN`, parses supported decimal numbering systems and configured formats, performs drift-resistant step math, and exposes styleable increment/decrement buttons.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "NumberField",
      "parts": [
        {
          "name": "NumberField.Group",
          "tag": "<NumberField.Group>",
          "requiredProps": []
        },
        {
          "name": "NumberField.Decrement",
          "tag": "<NumberField.Decrement>",
          "requiredProps": []
        },
        {
          "name": "NumberField.Input",
          "tag": "<NumberField.Input>",
          "requiredProps": [
            "id"
          ]
        },
        {
          "name": "NumberField.Increment",
          "tag": "<NumberField.Increment>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Label htmlFor=\"quantity-input\">Quantity</Label>\n<NumberField\n  value={quantity}\n  onChange={setQuantity}\n  locale=\"en-GB\"\n  min={0}\n  max={100}\n  step={1}\n  name=\"quantity\"\n>\n  <NumberField.Group>\n    <NumberField.Decrement aria-label=\"Decrease quantity\">\n      −\n    </NumberField.Decrement>\n    <NumberField.Input id=\"quantity-input\" />\n    <NumberField.Increment aria-label=\"Increase quantity\">\n      +\n    </NumberField.Increment>\n  </NumberField.Group>\n</NumberField>",
      "<NumberField\n  value={price}\n  onChange={setPrice}\n  locale=\"de-DE\"\n  min={0}\n  step={0.05}\n  formatOptions={{\n    style: \"currency\",\n    currency: \"EUR\",\n    minimumFractionDigits: 2,\n    maximumFractionDigits: 2,\n  }}\n>\n  <NumberField.Group>\n    <NumberField.Input aria-label=\"Price\" />\n    <NumberField.Decrement aria-label=\"Preis verringern\">\n      −\n    </NumberField.Decrement>\n    <NumberField.Increment aria-label=\"Preis erhöhen\">\n      +\n    </NumberField.Increment>\n  </NumberField.Group>\n</NumberField>"
    ],
    "interface": {
      "name": "NumberFieldProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "value",
        "count": 0,
        "usage": "unused",
        "type": "number | null",
        "description": "Controlled numeric value.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultValue",
        "count": 0,
        "usage": "unused",
        "type": "number | null",
        "description": "Default numeric value.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onChange",
        "count": 0,
        "usage": "unused",
        "type": "(value: number | null) => void",
        "description": "Handler called when value changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "min",
        "count": 0,
        "usage": "unused",
        "type": "number",
        "description": "Minimum allowed number.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "max",
        "count": 0,
        "usage": "unused",
        "type": "number",
        "description": "Maximum allowed number.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "step",
        "count": 0,
        "usage": "unused",
        "type": "number",
        "description": "Step increment for adjustments.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Disables numeric field.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Overlay",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "One React primitive for content that sits above the application.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Overlay",
      "parts": [
        {
          "name": "Overlay.Trigger",
          "tag": "<Overlay.Trigger>",
          "requiredProps": [],
          "description": "renders `button`."
        },
        {
          "name": "Overlay.Backdrop",
          "tag": "<Overlay.Backdrop>",
          "requiredProps": []
        },
        {
          "name": "Overlay.Content",
          "tag": "<Overlay.Content>",
          "requiredProps": [
            "placement"
          ]
        },
        {
          "name": "Overlay.Handle",
          "tag": "<Overlay.Handle>",
          "requiredProps": []
        },
        {
          "name": "Overlay.Arrow",
          "tag": "<Overlay.Arrow>",
          "requiredProps": []
        },
        {
          "name": "Overlay.Portal",
          "tag": "<Overlay.Portal>",
          "requiredProps": [],
          "description": "renders nothing."
        }
      ]
    },
    "examples": [
      "<Overlay open={open} onOpen={() => setOpen(true)} onDismiss={close}>\n  <Overlay.Trigger>Delete project</Overlay.Trigger>\n  <Overlay.Backdrop />\n  <Overlay.Content\n    role=\"dialog\"\n    aria-modal=\"true\"\n    aria-labelledby=\"overlay-title\"\n  >\n    <h2 id=\"overlay-title\">Delete project?</h2>\n    {children}\n    <button type=\"button\" onClick={close}>\n      Cancel\n    </button>\n  </Overlay.Content>\n</Overlay>",
      "<Overlay\n  open={open}\n  onOpen={() => setOpen(true)}\n  onDismiss={close}\n  edge=\"bottom\"\n>\n  <Overlay.Trigger>Filters</Overlay.Trigger>\n  <Overlay.Backdrop />\n  <Overlay.Content role=\"dialog\" aria-modal=\"true\">\n    <Overlay.Handle />\n    {children}\n  </Overlay.Content>\n</Overlay>"
    ],
    "interface": {
      "name": "OverlayProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "open",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Controlled open state of overlay.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultOpen",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Default open state.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onOpenChange",
        "count": 0,
        "usage": "unused",
        "type": "(open: boolean) => void",
        "description": "Handler called when open changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "placement",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "Placement relative to anchor.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "isolation",
        "count": 0,
        "usage": "unused",
        "type": "boolean | object",
        "description": "Scroll and focus lock options.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onDismiss",
        "count": 0,
        "usage": "unused",
        "type": "() => void",
        "description": "Handler called on outside click or escape.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Popover",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Controlled, anchored, **non-isolating** floating content with hover policy.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Popover",
      "parts": [
        {
          "name": "Popover.Trigger",
          "tag": "<Popover.Trigger>",
          "requiredProps": []
        },
        {
          "name": "Popover.Content",
          "tag": "<Popover.Content>",
          "requiredProps": [
            "placement"
          ]
        },
        {
          "name": "Popover.Portal",
          "tag": "<Popover.Portal>",
          "requiredProps": [],
          "description": "renders nothing."
        },
        {
          "name": "Popover.Arrow",
          "tag": "<Popover.Arrow>",
          "requiredProps": []
        },
        {
          "name": "Popover.Close",
          "tag": "<Popover.Close>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Popover\n  open={open}\n  onOpen={() => setOpen(true)}\n  onDismiss={close}\n>\n  <Popover.Trigger>Open filters</Popover.Trigger>\n\n  <Popover.Content placement=\"bottom-start\" offset={8}>\n    {children}\n  </Popover.Content>\n</Popover>",
      "<Popover\n  open={open}\n  onDismiss={close}\n  anchor={{ x: pointerX, y: pointerY }}\n>\n  <Popover.Content placement=\"bottom-start\">\n    {children}\n  </Popover.Content>\n</Popover>"
    ],
    "interface": {
      "name": "PopoverProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "open",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "The controlled open state.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onOpenChange",
        "count": 0,
        "usage": "unused",
        "type": "(open: boolean) => void",
        "description": "Event handler called when open state changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Popover.Trigger and Popover.Content.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Portal",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Moves content to another location in the DOM while preserving its position in the React tree. Does not add a wrapper or manage stacking, focus, dismissal, or modality.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "single",
      "root": "Portal",
      "parts": []
    },
    "examples": [
      "<Portal>{children}</Portal>",
      "<Portal container={portalContainer}>\n  {children}\n</Portal>"
    ],
    "interface": {
      "name": "PortalProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "container",
        "count": 0,
        "usage": "unused",
        "type": "Element | null",
        "description": "Target DOM container to portal children into.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Elements rendered into portal container.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Presence",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Keeps unmounting elements in the DOM until CSS animations or transitions complete. Overlay and Popover use it internally for the `data-state` exit contract.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "single",
      "root": "Presence",
      "parts": []
    },
    "examples": [
      "<Presence present={open}>\n  <Div data-state={open ? \"open\" : \"closed\"}>{children}</Div>\n</Presence>"
    ],
    "interface": {
      "name": "PresenceProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "present",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Controls mounted/visible animation presence.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Single element whose exit transitions are waited on.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "ReferenceLibrary",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Mounts Reference UI's application-level runtime systems.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "single",
      "root": "ReferenceLibrary",
      "parts": []
    },
    "examples": [
      "<ReferenceLibrary\n  toaster={{\n    defaultPosition: \"bottom-end\",\n    defaultDuration: 5000,\n    limit: 4,\n  }}\n>\n  <App />\n</ReferenceLibrary>"
    ],
    "interface": {
      "name": "ReferenceLibraryProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "toaster",
        "count": 0,
        "usage": "unused",
        "type": "object",
        "description": "Toaster configuration (defaultPosition, duration, limit).",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "tooltip",
        "count": 0,
        "usage": "unused",
        "type": "object",
        "description": "Global tooltip configuration (skipDelay).",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Application tree.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "RovingFocus",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Composite-widget keyboard kernel: roving `tabindex`, arrow movement, Home/End/PageUp/PageDown boundary movement, disabled skipping, optional looping, optional typeahead, optional two-dimensional movement.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "RovingFocus",
      "parts": [
        {
          "name": "RovingFocus.Item",
          "tag": "<RovingFocus.Item>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<RovingFocus orientation=\"horizontal\" loop>\n  <Div role=\"toolbar\" aria-label=\"Formatting\">\n    <RovingFocus.Item>\n      <Button>Bold</Button>\n    </RovingFocus.Item>\n    <RovingFocus.Item>\n      <Button>Italic</Button>\n    </RovingFocus.Item>\n    <RovingFocus.Item disabled>\n      <Button>Underline</Button>\n    </RovingFocus.Item>\n  </Div>\n</RovingFocus>",
      "<RovingFocus orientation=\"both\" typeahead>\n  <Div role=\"grid\" aria-label=\"Emoji\">\n    {cells.map((cell) => (\n      <RovingFocus.Item key={cell.id}>\n        <Button>{cell.label}</Button>\n      </RovingFocus.Item>\n    ))}\n  </Div>\n</RovingFocus>"
    ],
    "interface": {
      "name": "RovingFocusRootProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "orientation",
        "count": 0,
        "usage": "unused",
        "type": "'horizontal' | 'vertical' | 'both'",
        "description": "Direction of keyboard navigation.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "loop",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "When true, wraps around navigation boundaries.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "currentId",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "Controlled active item id.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onCurrentIdChange",
        "count": 0,
        "usage": "unused",
        "type": "(id: string) => void",
        "description": "Handler called when active focus changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Slider",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Pointer drag math, multi-thumb collision, keyboard stepping (arrows, PageUp/PageDown, Home/End), ARIA value ranges (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Slider",
      "parts": [
        {
          "name": "Slider.Track",
          "tag": "<Slider.Track>",
          "requiredProps": []
        },
        {
          "name": "Slider.Range",
          "tag": "<Slider.Range>",
          "requiredProps": []
        },
        {
          "name": "Slider.Thumb",
          "tag": "<Slider.Thumb>",
          "requiredProps": [],
          "description": "renders `div` with `role=\"slider\"`."
        }
      ]
    },
    "examples": [
      "<Slider value={value} onChange={setValue} min={0} max={100} step={1}>\n  <Slider.Track>\n    <Slider.Range />\n    <Slider.Thumb aria-label=\"Volume\" />\n  </Slider.Track>\n</Slider>",
      "<Slider value={range} onChange={setRange} min={0} max={100}>\n  <Slider.Track>\n    <Slider.Range />\n    <Slider.Thumb aria-label=\"Minimum\" />\n    <Slider.Thumb aria-label=\"Maximum\" />\n  </Slider.Track>\n</Slider>"
    ],
    "interface": {
      "name": "SliderProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "value",
        "count": 0,
        "usage": "unused",
        "type": "number[]",
        "description": "Controlled array of slider thumb values.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultValue",
        "count": 0,
        "usage": "unused",
        "type": "number[]",
        "description": "Default array of thumb values.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onValueChange",
        "count": 0,
        "usage": "unused",
        "type": "(value: number[]) => void",
        "description": "Event handler called when values change.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "min",
        "count": 0,
        "usage": "unused",
        "type": "number",
        "description": "Minimum slider value.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "max",
        "count": 0,
        "usage": "unused",
        "type": "number",
        "description": "Maximum slider value.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "step",
        "count": 0,
        "usage": "unused",
        "type": "number",
        "description": "Stepping increment.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Slot",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Named-region registration for declarative component APIs. A part registers an element into a slot id; the host reads the shared registry and renders that element in the matching region. Authors compose parts in any order. The host does not collect them through layout props.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "single",
      "root": "Slot",
      "parts": []
    },
    "examples": [
      "const {\n  Provider: MyComponentSlots,\n  useSlotRegistration,\n  useScanById,\n} = createSlotRootContext()\n\nfunction MyComponent({ children }: { children: React.ReactNode }) {\n  return (\n    <MyComponentSlots>\n      {children}\n      <MyComponentLayout />\n    </MyComponentSlots>\n  )\n}\n\nfunction MyComponentTitle({ children }: { children: React.ReactNode }) {\n  useSlotRegistration({\n    slotId: \"title\",\n    element: <H1>{children}</H1>,\n  })\n  return null\n}\n\nfunction MyComponentActions({ children }: { children: React.ReactNode }) {\n  useSlotRegistration({\n    slotId: \"actions\",\n    element: <Div>{children}</Div>,\n    meta: { align: \"end\" },\n  })\n  return null\n}\n\nfunction MyComponentLayout() {\n  const title = useScanById(\"title\")\n  const actions = useScanById(\"actions\")\n  return (\n    <Div>\n      <header>{title?.element}</header>\n      <footer>{actions?.element}</footer>\n    </Div>\n  )\n}\n\n<MyComponent>\n  <MyComponentActions>\n    <Button type=\"button\">OK</Button>\n  </MyComponentActions>\n  <MyComponentTitle>Confirm</MyComponentTitle>\n</MyComponent>"
    ],
    "interface": {
      "name": "SlotProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactElement",
        "description": "Single child element to which slotted props are merged.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Splitter",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "A 1D flex partition with a window-splitter Handle. Splitter owns layout along one axis, the pointer drag loop (direct DOM writes, no React commit per move), min/max clamping, keyboard, collapse/restore, and ARIA. It is a small animation-style kernel sitting on flexbox, not a layout-mode switch.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Splitter",
      "parts": [
        {
          "name": "Splitter.Panel",
          "tag": "<Splitter.Panel>",
          "requiredProps": [
            "min"
          ]
        },
        {
          "name": "Splitter.Handle",
          "tag": "<Splitter.Handle>",
          "requiredProps": [],
          "description": "renders `div`\nwith `role=\"separator\"`."
        },
        {
          "name": "Splitter.Thumb",
          "tag": "<Splitter.Thumb>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Splitter\n  orientation=\"horizontal\"\n  value={sizes}\n  onChange={setSizes}\n  height=\"100%\"\n>\n  <Splitter.Panel min=\"12r\" collapsible>\n    {sidebar}\n  </Splitter.Panel>\n  <Splitter.Handle aria-label=\"Resize sidebar\" />\n  <Splitter.Panel>{main}</Splitter.Panel>\n</Splitter>",
      "<Splitter value={cols} onChange={setCols} height=\"100%\">\n  <Splitter.Panel min=\"12r\">{nav}</Splitter.Panel>\n  <Splitter.Handle aria-label=\"Resize navigation\" />\n  <Splitter.Panel min=\"0\">\n    <Splitter\n      orientation=\"vertical\"\n      value={rows}\n      onChange={setRows}\n      height=\"100%\"\n    >\n      <Splitter.Panel min=\"12r\">{editor}</Splitter.Panel>\n      <Splitter.Handle aria-label=\"Resize console\" />\n      <Splitter.Panel min=\"8r\">{console}</Splitter.Panel>\n    </Splitter>\n  </Splitter.Panel>\n</Splitter>"
    ],
    "interface": {
      "name": "SplitterProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "orientation",
        "count": 0,
        "usage": "unused",
        "type": "'horizontal' | 'vertical'",
        "description": "Direction in which panels are split.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Splitter.Panel and Splitter.Handle elements.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Switch",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "A compact on/off control with variable specificity. Mount `Switch` alone and it is a complete control: StyleProps land on the track, and a default thumb is rendered for you. Author `Switch.Thumb` only when the thumb itself needs props, refs, or children.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Switch",
      "parts": [
        {
          "name": "Switch.Thumb",
          "tag": "<Switch.Thumb>",
          "requiredProps": [],
          "description": "renders\n`span`."
        }
      ]
    },
    "examples": [
      "<label htmlFor=\"airplane\">Airplane mode</label>\n<Switch\n  id=\"airplane\"\n  checked={enabled}\n  onChange={setEnabled}\n  width=\"6r\"\n  padding=\"0.25r\"\n/>",
      "<label htmlFor=\"airplane\">Airplane mode</label>\n<Switch\n  id=\"airplane\"\n  checked={enabled}\n  onChange={setEnabled}\n  width=\"6r\"\n>\n  <Switch.Thumb width=\"2r\" bg=\"bg\" />\n</Switch>"
    ],
    "interface": {
      "name": "SwitchProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "checked",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Controlled boolean state of switch.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultChecked",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Default boolean state when uncontrolled.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onChange",
        "count": 0,
        "usage": "unused",
        "type": "(checked: boolean) => void",
        "description": "Event handler called when toggle changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "When true, disables switch toggle.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "id",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "DOM identifier for input pairing.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Optional Switch.Thumb element for custom thumbs.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Tabs",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Directional keyboard cycling, automatic vs. manual activation, `aria-controls` / `aria-labelledby` linking. Built on `RovingFocus`.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Tabs",
      "parts": [
        {
          "name": "Tabs.List",
          "tag": "<Tabs.List>",
          "requiredProps": [],
          "description": "renders `div` with `role=\"tablist\"`."
        },
        {
          "name": "Tabs.Tab",
          "tag": "<Tabs.Tab>",
          "requiredProps": [
            "value"
          ],
          "description": "renders `button[type=button]` with `role=\"tab\"`."
        },
        {
          "name": "Tabs.Panel",
          "tag": "<Tabs.Panel>",
          "requiredProps": [
            "value"
          ],
          "description": "renders `div` with `role=\"tabpanel\"`."
        },
        {
          "name": "Tabs.Trigger",
          "tag": "<Tabs.Trigger>",
          "requiredProps": []
        },
        {
          "name": "Tabs.Content",
          "tag": "<Tabs.Content>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Tabs\n  value={tab}\n  onChange={setTab}\n  orientation=\"horizontal\"\n  activation=\"automatic\"\n>\n  <Tabs.List aria-label=\"Settings\">\n    <Tabs.Tab value=\"general\">General</Tabs.Tab>\n    <Tabs.Tab value=\"billing\">Billing</Tabs.Tab>\n  </Tabs.List>\n  <Tabs.Panel value=\"general\">{children}</Tabs.Panel>\n  <Tabs.Panel value=\"billing\">{children}</Tabs.Panel>\n</Tabs>"
    ],
    "interface": {
      "name": "TabsProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "value",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "The controlled active tab value.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultValue",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "The value of the tab that should be active by default.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onChange",
        "count": 0,
        "usage": "unused",
        "type": "(value: string) => void",
        "description": "Event handler called when the active tab changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "orientation",
        "count": 0,
        "usage": "unused",
        "type": "'horizontal' | 'vertical'",
        "description": "The orientation of the tabs (default: \"horizontal\").",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "activation",
        "count": 0,
        "usage": "unused",
        "type": "'automatic' | 'manual'",
        "description": "Whether tabs activate on focus or manual selection.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "variant",
        "count": 0,
        "usage": "unused",
        "type": "'line' | 'pill'",
        "description": "Visual tab styling variant.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "When true, disables user interaction with tabs.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Tabs.List and Tabs.Panel elements.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Toast",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Infrastructure for transient application content. Does not prescribe appearance or meaning. No semantic variants (`success`, `error`, `loading`).",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "single",
      "root": "Toast",
      "parts": []
    },
    "examples": [
      "<ReferenceLibrary\n  toaster={{\n    defaultPosition: \"bottom-end\",\n    defaultDuration: 5000,\n    limit: 4,\n  }}\n>\n  <App />\n</ReferenceLibrary>",
      "const ProjectSavedToast = toast.define({\n  duration: 4000,\n\n  render({ project }, { close }) {\n    return (\n      <div>\n        <span>{project.name} was saved</span>\n        <button type=\"button\" onClick={close}>\n          Dismiss\n        </button>\n      </div>\n    )\n  },\n})\n\ntoast.show(\n  ProjectSavedToast,\n  { project },\n  { announce: `${project.name} was saved` }\n)"
    ],
    "interface": {
      "name": "ToastProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "title",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "Toast notification title.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "description",
        "count": 0,
        "usage": "unused",
        "type": "string",
        "description": "Secondary toast text.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Tooltip",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "Transient informative descriptions linked from the trigger with `aria-describedby`. Content is non-interactive. Hover intent delays, skip-delay across neighbouring tooltips, keyboard focus display, non-modal Escape dismissal (WCAG 2.1 SC 1.4.13). Interactive hover content is a `Popover` with `openOnHover`.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Tooltip",
      "parts": [
        {
          "name": "Tooltip.Trigger",
          "tag": "<Tooltip.Trigger>",
          "requiredProps": []
        },
        {
          "name": "Tooltip.Content",
          "tag": "<Tooltip.Content>",
          "requiredProps": [
            "id",
            "placement"
          ],
          "description": "renders `div` with `role=\"tooltip\"`."
        },
        {
          "name": "Tooltip.Portal",
          "tag": "<Tooltip.Portal>",
          "requiredProps": [],
          "description": "renders\nno node and configures the positioning destination."
        },
        {
          "name": "Tooltip.Arrow",
          "tag": "<Tooltip.Arrow>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Tooltip\n  open={open}\n  onOpen={() => setOpen(true)}\n  onDismiss={() => setOpen(false)}\n>\n  <Tooltip.Trigger aria-describedby=\"save-tip\">Save</Tooltip.Trigger>\n  <Tooltip.Content id=\"save-tip\" placement=\"top\">\n    Save the document\n  </Tooltip.Content>\n</Tooltip>"
    ],
    "interface": {
      "name": "TooltipProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "content",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Content rendered inside the tooltip popup.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "delayDuration",
        "count": 0,
        "usage": "unused",
        "type": "number",
        "description": "Hover duration in ms before showing tooltip.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "children",
        "count": 0,
        "usage": "unused",
        "type": "React.ReactNode",
        "description": "Trigger element wrapped by the tooltip.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  },
  {
    "name": "Tree",
    "kind": "component",
    "source": "@reference-ui/lib",
    "description": "A minimal APG `role=\"tree\"`. Nested collapse, roving focus among **visible** items, single selection, typeahead. Built on `RovingFocus`.",
    "count": 0,
    "usage": "unused",
    "usedWith": {},
    "anatomy": {
      "pattern": "compound",
      "root": "Tree",
      "parts": [
        {
          "name": "Tree.Item",
          "tag": "<Tree.Item>",
          "requiredProps": [
            "value"
          ],
          "description": "renders\n`div[role=\"treeitem\"]`; nested items are authored inside\n`Tree."
        },
        {
          "name": "Tree.Expander",
          "tag": "<Tree.Expander>",
          "requiredProps": []
        },
        {
          "name": "Tree.Group",
          "tag": "<Tree.Group>",
          "requiredProps": []
        },
        {
          "name": "Tree.Root",
          "tag": "<Tree.Root>",
          "requiredProps": []
        }
      ]
    },
    "examples": [
      "<Tree\n  value={selected}\n  onChange={setSelected}\n  expanded={expanded}\n  onExpandedChange={setExpanded}\n>\n  <Tree.Item value=\"src\">\n    <Tree.Expander aria-label=\"Toggle src\" />\n    src\n    <Tree.Group>\n      <Tree.Item value=\"src/index\">index.ts</Tree.Item>\n      <Tree.Item value=\"src/tree\">tree.ts</Tree.Item>\n    </Tree.Group>\n  </Tree.Item>\n  <Tree.Item value=\"readme\">README.md</Tree.Item>\n</Tree>"
    ],
    "interface": {
      "name": "TreeProps",
      "source": "@reference-ui/lib"
    },
    "props": [
      {
        "name": "value",
        "count": 0,
        "usage": "unused",
        "type": "string | null",
        "description": "Selected item id.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultValue",
        "count": 0,
        "usage": "unused",
        "type": "string | null",
        "description": "Default selected item id.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onChange",
        "count": 0,
        "usage": "unused",
        "type": "(value: string | null) => void",
        "description": "Handler called when selection changes.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "expanded",
        "count": 0,
        "usage": "unused",
        "type": "string[]",
        "description": "Controlled array of expanded branch ids.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "defaultExpanded",
        "count": 0,
        "usage": "unused",
        "type": "string[]",
        "description": "Default expanded branch ids.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "onExpandedChange",
        "count": 0,
        "usage": "unused",
        "type": "(expanded: string[]) => void",
        "description": "Handler called when branches expand/collapse.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      },
      {
        "name": "disabled",
        "count": 0,
        "usage": "unused",
        "type": "boolean",
        "description": "Disables tree navigation.",
        "optional": true,
        "readonly": false,
        "origin": "documented",
        "styleProp": false
      }
    ]
  }
];

export function findReferenceUiLibraryComponent(name: string): McpComponent | null {
  const comp = REFERENCE_UI_LIBRARY_COMPONENTS.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  )
  return comp ? { ...comp } : null
}
