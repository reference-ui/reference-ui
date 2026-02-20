import x from y


// reads config from ui.config.ts, copies user files to codegen, runs Panda codegen and css, generates primitives, and copies final artifacts to node_modules

const syncCommand = async (config, options: { watch?: boolean }) => {

    // watches files in user proejct, sends events to bus when files change and what file changed
    initWatcher(config)

    // manages everything related to generating a styled system.
    // has it's own eval system that runs user files and collects config, tokens, and styles via registered functions
    // system produces an up to date styled-system based on panda css.
    initSystem(config)



    // listens for when system is done generating, then bundles and copies files to node_modules/@reference-ui/core etc.
    // this is what creates import { Button } from '@reference-ui/core' for the user project. etc.
    initBundler(config)

}