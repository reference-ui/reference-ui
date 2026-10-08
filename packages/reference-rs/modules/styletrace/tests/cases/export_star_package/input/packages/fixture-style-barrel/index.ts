/**
 * Mock package barrel for the export_star_package station.
 * Re-exports every binding from ./card so PackageCard is reachable from the
 * package root. The tracer must follow export * across the package boundary.
 */
export * from './card'
