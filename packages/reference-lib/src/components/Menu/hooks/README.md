# Menu hooks

Menu behavior behind one hook per job. The entry-keys hooks wire
Popover triggers and context targets to the pending intent cell. The
level hooks build the root and nested level values over the shared
registry. The effect hooks compose onto the parts: entry focus,
close restore, contextmenu dismiss, menu-owned outside press, and
grace-polygon travel. Choice dismissal is shared by every choice item.
Each hook takes plain values and returns data and handlers — no JSX.
