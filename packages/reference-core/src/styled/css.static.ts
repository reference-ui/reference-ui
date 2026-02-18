import { extendStaticCss } from './api'

extendStaticCss({
  css: [
    {
      properties: {
        backgroundColor: ['*'],
        color: ['*'],
        borderColor: ['*'],
        font: ['*'],
        padding: ['*'],
        paddingLeft: ['*'],
        paddingRight: ['*'],
        paddingTop: ['*'],
        paddingBottom: ['*'],
        margin: ['*'],
        gap: ['*'],
        borderRadius: ['*'],
        borderWidth: ['*'],
        fontSize: ['*'],
        fontWeight: ['*'],
        fontFamily: ['*'],
        animation: ['*'],
        animationName: ['*'],
      },
    },
  ],
  recipes: {
    fontStyle: ['*'],
  },
})
