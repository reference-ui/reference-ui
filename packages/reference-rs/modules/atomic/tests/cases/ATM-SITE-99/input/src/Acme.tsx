/**
 * Use site for ATM-SITE-99 through the package's published wrapper:
 * `acme-ui` renders `AcmeCard` with its own runtime, so the tag is external.
 */
import { AcmeCard } from 'acme-ui'

export const Acme = () => <AcmeCard p="1r" />
