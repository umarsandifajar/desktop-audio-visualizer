// Mode wallpaper (eksperimental): tempel jendela overlay di belakang icon desktop (WorkerW trick).
// Pakai koffi (FFI prebuilt, tanpa compile) untuk memanggil user32.dll.
const koffi = require('koffi');
const u = koffi.load('user32.dll');
const EnumProc = koffi.proto('bool __stdcall EnumWindowsProc(intptr hwnd, intptr lparam)');
const FindWindowW = u.func('intptr __stdcall FindWindowW(str16 c, str16 n)');
const FindWindowExW = u.func('intptr __stdcall FindWindowExW(intptr p, intptr a, str16 c, str16 n)');
const SendMessageTimeoutW = u.func('intptr __stdcall SendMessageTimeoutW(intptr h, uint32 m, uintptr w, intptr l, uint32 f, uint32 t, _Out_ uintptr *r)');
const EnumWindows = u.func('bool __stdcall EnumWindows(EnumWindowsProc *cb, intptr lp)');
const SetParent = u.func('intptr __stdcall SetParent(intptr c, intptr p)');
const MoveWindow = u.func('bool __stdcall MoveWindow(intptr h, int x, int y, int w, int hh, bool r)');
const SetWindowPos = u.func('bool __stdcall SetWindowPos(intptr h, intptr a, int x, int y, int cx, int cy, uint32 f)');

function rect(screen) {
  const all = screen.getAllDisplays().map((d) => screen.dipToScreenRect(null, d.bounds));
  const minX = Math.min(...all.map((r) => r.x));
  const minY = Math.min(...all.map((r) => r.y));
  const p = screen.dipToScreenRect(null, screen.getPrimaryDisplay().bounds);
  return { x: p.x - minX, y: p.y - minY, w: p.width, h: p.height };
}

function attach(hwnd, r) {
  const progman = FindWindowW('Progman', null);
  if (!progman) return false;
  SendMessageTimeoutW(progman, 0x052c, 0, 0, 0, 1000, [0]);
  let workerw = 0;
  const cb = koffi.register((h) => {
    if (h !== progman && FindWindowExW(h, 0, 'SHELLDLL_DefView', null)) {
      workerw = FindWindowExW(0, h, 'WorkerW', null);
    }
    return true;
  }, koffi.pointer(EnumProc));
  EnumWindows(cb, 0);
  koffi.unregister(cb);
  SetParent(hwnd, workerw || progman);
  // Windows 11 24H2: tidak ada WorkerW terpisah -> taruh di dasar z-order Progman (di bawah icon)
  if (!workerw) SetWindowPos(hwnd, 1, 0, 0, 0, 0, 0x13);
  MoveWindow(hwnd, r.x, r.y, r.w, r.h, true);
  return true;
}
module.exports = { attach, rect };
