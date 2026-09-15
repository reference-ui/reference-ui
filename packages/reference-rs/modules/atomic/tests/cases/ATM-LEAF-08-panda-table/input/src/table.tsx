export const Table = ({
  isHovered,
  isActive,
  isFull,
  isOpen,
  disabled,
  isModal,
  compact,
  hidden,
  vertical,
  center,
  stretch,
  rtl,
  rounded,
  clickable,
}: Record<string, boolean>) => (
  <>
    <Div bg={isHovered ? 'n100' : 'n200'} />
    <Div color={isActive ? 'primary' : undefined} />
    <Div border={false && '1px solid red'} />
    <Div borderColor={0 && 'transparent'} />
    <Div m={['0', '1r', '2r', '3r']} />
    <Div w={isFull ? '100%' : 'auto'} />
    <Div h={isOpen ? '200px' : '0px'} />
    <Div opacity={disabled ? '0.5' : '1'} />
    <Div zIndex={isModal ? '1000' : '1'} />
    <Div gap={compact ? '0.5r' : '1r'} />
    <Div display={hidden ? 'none' : 'flex'} />
    <Div flexDirection={vertical ? 'column' : 'row'} />
    <Div justifyContent={center ? 'center' : 'flex-start'} />
    <Div alignItems={stretch ? 'stretch' : 'center'} />
    <Div textAlign={rtl ? 'right' : 'left'} />
    <Div borderRadius={rounded ? 'full' : 'md'} />
    <Div cursor={clickable ? 'pointer' : 'default'} />
  </>
)
