import { Div, css } from '@reference-ui/react'

const resizable = {
	border: '[2px solid #666]',
	padding: '4r',
	marginTop: '2r',
	resize: 'horizontal',
	overflow: 'auto',
	maxWidth: '[100%]',
	minWidth: '[220px]',
}

const frameClass = css({
	display: 'grid',
	gap: '3r',
	padding: '3r',
	borderRadius: 'xl',
	backgroundColor: 'gray.50',
	borderWidth: '1px',
	borderStyle: 'solid',
	borderColor: 'gray.300',
	'@container (min-width: 280px)': {
		gap: '4r',
		padding: '4r',
	},
	'@container (min-width: 460px)': {
		gridTemplateColumns: 'minmax(0, 1.5fr) minmax(180px, 1fr)',
		alignItems: 'stretch',
	},
	'@container (min-width: 620px)': {
		padding: '5r',
	},
})

const heroClass = css({
	display: 'grid',
	gap: '2r',
	padding: '4r',
	borderRadius: 'xl',
	backgroundColor: 'red.600',
	color: 'white',
	'@container (min-width: 280px)': {
		padding: '5r',
		backgroundColor: 'green.600',
	},
	'@container (min-width: 460px)': {
		gap: '3r',
		backgroundColor: 'blue.600',
	},
	'@container (min-width: 620px)': {
		padding: '6r',
		backgroundColor: 'purple.600',
	},
})

const eyebrowClass = css({
	margin: '0',
	fontSize: 'xs',
	fontWeight: '700',
	letterSpacing: '0.08em',
	textTransform: 'uppercase',
	opacity: '0.82',
})

const titleClass = css({
	margin: '0',
	fontSize: 'lg',
	fontWeight: '700',
	lineHeight: '1.1',
	'@container (min-width: 460px)': {
		fontSize: 'xl',
	},
	'@container (min-width: 620px)': {
		fontSize: '2xl',
	},
})

const copyClass = css({
	margin: '0',
	fontSize: 'sm',
	lineHeight: '1.6',
	maxWidth: '52ch',
	'@container (min-width: 460px)': {
		fontSize: 'md',
	},
})

const tagRowClass = css({
	display: 'flex',
	flexWrap: 'wrap',
	gap: '2r',
})

const tagClass = css({
	borderWidth: '1px',
	borderStyle: 'solid',
	borderColor: 'white',
	backgroundColor: 'white',
	color: 'gray.900',
	borderRadius: '999px',
	px: '2.5r',
	py: '1r',
	fontSize: 'xs',
	fontWeight: '700',
})

const noteClass = css({
	display: 'grid',
	gap: '2.5r',
	padding: '3r',
	borderRadius: 'lg',
	borderWidth: '1px',
	borderStyle: 'dashed',
	borderColor: 'gray.400',
	backgroundColor: 'white',
	color: 'gray.900',
	'@container (min-width: 280px)': {
		padding: '4r',
	},
})

const noteTextClass = css({
	margin: '0',
	fontSize: 'sm',
	lineHeight: '1.6',
	color: 'gray.600',
})

const actionClass = css({
	justifySelf: 'start',
	border: 'none',
	borderRadius: '999px',
	backgroundColor: 'gray.900',
	color: 'white',
	px: '3r',
	py: '1.5r',
	fontSize: 'xs',
	fontWeight: '700',
	cursor: 'pointer',
	'@container (min-width: 460px)': {
		fontSize: 'sm',
	},
})

/**
 * Cosmos fixture for validating css()-authored container queries on raw elements.
 * The outer Div contributes the container boundary; the inner div/button classes own
 * the responsive layout and visual changes.
 */
export default function ResponsiveCssSugarFixture() {
	return (
		<Div padding="5r" fontFamily="reference.sans" display="grid" gap="3r">
			<Div fontSize="lg" fontWeight="700">
				Responsive css() sugar
			</Div>
			<Div color="gray.600" maxWidth="72ch">
				Drag the lower-right corner to resize. The outer Div provides the container
				context, while the raw inner div and button respond through css() with explicit
				@container rules.
			</Div>

			<Div container css={resizable}>
				<div className={frameClass}>
					<div className={heroClass}>
						<p className={eyebrowClass}>Cosmos preview</p>
						<h3 className={titleClass}>Raw primitives react to the Div container</h3>
						<p className={copyClass}>
							Resize through each breakpoint to watch spacing, layout, and color shift
							without using the `r` prop on the inner elements.
						</p>
						<div className={tagRowClass}>
							<div className={tagClass}>280px</div>
							<div className={tagClass}>460px</div>
							<div className={tagClass}>620px</div>
						</div>
					</div>

					<div className={noteClass}>
						<p className={noteTextClass}>
							This fixture isolates the interaction you asked about: `container` on Div,
							responsive styling from css(), and raw HTML elements as the actual targets.
						</p>
						<button type="button" className={actionClass}>
							css() button
						</button>
					</div>
				</div>
			</Div>
		</Div>
	)
}
