# What was patched in chat.swf

Two small ActionScript edits, both removing hardcoded checks that the SWF's
URL contains the literal string `"htfgames.com"` (otherwise it refuses to
boot / immediately unloads its UI when hosted anywhere else). Both patches
were applied with JPEXS FFDec (`-importScript`), so the SWF's structure,
assets, and every other behavior are untouched — byte-identical except for
these two functions.

### 1. Frame 1 setup script

Before:
```as
if (this._url.indexOf(serverDomain) != -1 || serverOnline == false) {
    gotoAndStop("Setup"); play();
} else {
    gotoAndStop("Done");
}
```
After: unconditionally `gotoAndStop("Setup"); play();`

### 2. `actionStart()` in frame 4

Before: looped over `serverClients` (just `["htfgames.com"]`) checking whether
`_level1._url` (the loaded `artwork.swf`) contained one of those strings, and
called `unloadMovieNum(1)` — killing the just-loaded UI — if not.

After: the whole check is removed (function body is now empty), so the UI
never gets unloaded.

Nothing about game logic, the chat protocol, room layout, or any asset was
touched — this only removes the "must be hosted on htfgames.com" gate.
