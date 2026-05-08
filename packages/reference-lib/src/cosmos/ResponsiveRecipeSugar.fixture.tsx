import { Div, recipe, type RecipeDefinition } from '@reference-ui/react'

const resizable = {
	border: '[2px solid #666]',
	padding: '4r',
	marginTop: '2r',
	resize: 'horizontal',
	overflow: 'auto',
	maxWidth: '[100%]',
	minWidth: '[220px]',
}

const panelRecipe = recipe({
	base: {
		display: 'grid',
		gap: '2.5r',
		padding: '3r',
		borderRadius: 'xl',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'gray.300',
		backgroundColor: 'white',
		color: 'gray.900',
		r: {
			280: {
				padding: '4r',
				gap: '3r',
			},
			460: {
				gridTemplateColumns: 'minmax(0, 1.35fr) minmax(160px, 1fr)',
				alignItems: 'start',
			},
			620: {
				padding: '5r',
			},
		},
	},
	variants: {
		tone: {
			sunrise: {
				backgroundColor: 'orange.500',
				color: 'white',
				r: {
					280: {
						backgroundColor: 'green.600',
					},
					460: {
						backgroundColor: 'blue.600',
					},
				},
			},
			slate: {
				backgroundColor: 'gray.900',
				color: 'white',
				r: {
					280: {
						backgroundColor: 'gray.800',
					},
				},
			},
		},
		emphasis: {
			soft: {
				boxShadow: 'none',
			},
			strong: {
				boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
				r: {
					460: {
						transform: 'translateY(-2px)',
					},
				},
			},
		},
	},
	compoundVariants: [
		{
			tone: 'sunrise',
			emphasis: 'strong',
			css: {
				borderColor: 'orange.300',
				r: {
					620: {
						gridTemplateColumns: 'minmax(0, 1.5fr) minmax(200px, 1fr)',
					},
				},
			},
		},
	],
	defaultVariants: {
		tone: 'sunrise',
		emphasis: 'soft',
	},
} as unknown as RecipeDefinition)

const actionRecipe = recipe({
	base: {
		justifySelf: 'start',
		border: 'none',
		borderRadius: '999px',
		px: '3r',
		py: '1.5r',
		fontSize: 'xs',
		fontWeight: '700',
		cursor: 'pointer',
		backgroundColor: 'gray.900',
		color: 'white',
		r: {
			460: {
				fontSize: 'sm',
			},
		},
	},
	variants: {
		visual: {
			dark: {},
			light: {
				backgroundColor: 'white',
				color: 'gray.900',
			},
		},
	},
	defaultVariants: {
		visual: 'dark',
	},
} as unknown as RecipeDefinition)

export default function ResponsiveRecipeSugarFixture() {
	return (
		<Div padding="5r" fontFamily="reference.sans" display="grid" gap="3r">
			<Div fontSize="lg" fontWeight="700">
				Responsive recipe() sugar
			</Div>
			<Div color="gray.600" maxWidth="72ch">
				Drag the lower-right corner to resize. This fixture exercises `recipe()` with
				`r` sugar in base styles, variants, and a compound variant so the runtime
				wrapper path is visible in one place.
			</Div>

			<Div container css={resizable}>
				<div
					className={panelRecipe({ tone: 'sunrise', emphasis: 'strong' })}
				>
					<div>
						<p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.82 }}>
							Recipe preview
						</p>
						<h3 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', lineHeight: 1.1 }}>
							recipe() variants respond through the container
						</h3>
						<p style={{ margin: '0.75rem 0 0', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '52ch' }}>
							Base layout, tone styling, and the strong sunrise compound branch all carry
							responsive `r` entries here.
						</p>
					</div>

					<div style={{ display: 'grid', gap: '0.75rem' }}>
						<div className={panelRecipe({ tone: 'slate', emphasis: 'soft' })}>
							<div>
								<strong>Slate / soft</strong>
								<p style={{ margin: '0.5rem 0 0', lineHeight: 1.5 }}>
									Variant-only responsive branch.
								</p>
							</div>
							<button type="button" className={actionRecipe({ visual: 'light' })}>
								recipe() action
							</button>
						</div>

						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
							<div style={{ borderRadius: 999, background: 'rgba(255,255,255,0.18)', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
								280px
							</div>
							<div style={{ borderRadius: 999, background: 'rgba(255,255,255,0.18)', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
								460px
							</div>
							<div style={{ borderRadius: 999, background: 'rgba(255,255,255,0.18)', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
								620px
							</div>
						</div>
					</div>
				</div>
			</Div>
		</Div>
	)
}