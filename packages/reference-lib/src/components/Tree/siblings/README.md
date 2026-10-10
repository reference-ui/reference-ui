# siblings

Tree's posinset/setsize bookkeeping: each container counts its direct
treeitem children so authored decoration never corrupts the sibling
metadata. Items, groups, and the root all refresh through this one
function on mount, mutation, and commit.
