# CLI TODO

## combine cli and scripts.
to expose a public api without breaking the users env, 
/system and /react ideally need to exist before eval() runs .
therefore, we need to plan to merge scripts and cli in reference-ui,
specifically we should not actually prebuild the cli then have users install it,
we need to make ref-sync more self aware and portable


## public build time api

tokens(), keyframes, font() etc need to be added to eval
eval needs to monitor virtual filesystem too, to seek out calls
need to create a proper entry point for system , public facing api.

## performance

- Graceful shutdown? explore it.

## scripts vs cli

- should we find a way to merge scripts and the cli together?
- this would be a bit cleaner.

## packager-ts

- packager-ts - find a way to cache it?
- package-ts - is there a watch / incremental mode?
