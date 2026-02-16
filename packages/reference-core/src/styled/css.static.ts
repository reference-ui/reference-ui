import { staticCss } from './api'

staticCss({
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
      },
    },
  ],
  recipes: {
    fontStyle: ['*'],
  },
})
