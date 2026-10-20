# Scan golden manifests

Committed manifest goldens across repo shapes. The differential battery hashes temp trees with FNV-1a and compares against these files, so the TS scan, the committed pins, and the native entry hash must agree byte-for-byte.
