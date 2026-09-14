import * as React from 'react'

export interface SearchInputProps {
  size: 'sm' | 'md'
  children?: React.ReactNode
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ size, children }: SearchInputProps, ref): React.ReactElement {
    return (
      <label>
        <span>{children}</span>
        <input ref={ref} data-size={size} />
      </label>
    )
  }
)

export default SearchInput
