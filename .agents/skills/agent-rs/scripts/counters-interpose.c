// Census interpose shim for the Operation Flamegraph Obj 4 counters pass.
// Loaded via DYLD_INSERT_LIBRARIES, it interposes 15 libc file/syscall-adjacent
// calls (16 tuples: close plus its close$NOCANCEL twin, which is the spelling
// libuv's uv__close_nocancel binds — node would otherwise close invisibly),
// counts each call with mach_absolute_time nanosecond totals (plus bytes
// transferred where meaningful), and on process exit writes one JSON census to
// the path in $COUNTERS_CENSUS_OUT (writing nothing when unset). It takes no
// arguments and emits {"schema":1,"calls":{...}} via the real open/write/close.
// Because dyld applies interposition to dlsym results, any lookup that resolves
// back to our own replacement is re-resolved through the loaded images' own
// symbol tables, and re-entrant calls during resolution forward via a raw
// syscall trap, so forwarding can never recurse into this file.

#include <sys/types.h>
#include <sys/stat.h>
#include <sys/mman.h>
#include <sys/uio.h>
#include <sys/syscall.h>

#include <dlfcn.h>
#include <errno.h>
#include <fcntl.h>
#include <mach-o/dyld.h>
#include <mach-o/ldsyms.h>
#include <mach/mach_time.h>
#include <stdarg.h>
#include <stdatomic.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

enum {
    IDX_OPEN,
    IDX_OPENAT,
    IDX_CLOSE,
    IDX_READ,
    IDX_PREAD,
    IDX_READV,
    IDX_WRITE,
    IDX_PWRITE,
    IDX_WRITEV,
    IDX_STAT,
    IDX_LSTAT,
    IDX_FSTAT,
    IDX_LSEEK,
    IDX_MMAP,
    IDX_MUNMAP,
    N_CALLS
};

static _Atomic unsigned long long g_count[N_CALLS];
static _Atomic unsigned long long g_total_ns[N_CALLS];
static _Atomic unsigned long long g_bytes[N_CALLS];

static uint32_t g_tb_num = 0;
static uint32_t g_tb_den = 0;

static uint64_t to_ns(uint64_t delta) {
    if (g_tb_den == 0) {
        mach_timebase_info_data_t info = {0, 0};
        (void)mach_timebase_info(&info);
        if (info.denom != 0) {
            g_tb_num = info.numer;
            g_tb_den = info.denom;
        } else {
            return delta;
        }
    }
    return (uint64_t)(((unsigned __int128)delta * g_tb_num) / g_tb_den);
}

static void record_call(int idx, uint64_t t0, uint64_t t1) {
    atomic_fetch_add(&g_count[idx], 1ULL);
    atomic_fetch_add(&g_total_ns[idx], (unsigned long long)to_ns(t1 - t0));
}

// Raw syscall trap used only while the real symbols are unavailable.
// Pure trap + errno: no libc calls, no allocation, safe under re-entry.
static long raw_call(long num, long a, long b, long c, long d, long e, long f) {
#if defined(__x86_64__)
    register long r10 __asm__("r10") = d;
    register long r8 __asm__("r8") = e;
    register long r9 __asm__("r9") = f;
    long ret;
    unsigned long carry = 0;
    __asm__ volatile("syscall\n\t"
                     "setc %b1"
                     : "=a"(ret), "+r"(carry)
                     : "a"(num + 0x2000000L), "D"(a), "S"(b), "d"(c),
                       "r"(r10), "r"(r8), "r"(r9)
                     : "rcx", "r11", "memory", "cc");
    if (carry != 0) {
        errno = (int)ret;
        return -1;
    }
    return ret;
#elif defined(__arm64__)
    register long x0 __asm__("x0") = a;
    register long x1 __asm__("x1") = b;
    register long x2 __asm__("x2") = c;
    register long x3 __asm__("x3") = d;
    register long x4 __asm__("x4") = e;
    register long x5 __asm__("x5") = f;
    register long x16 __asm__("x16") = num + 0x2000000L;
    unsigned long nzcv = 0;
    __asm__ volatile("svc #0x80\n\t"
                     "mrs %1, nzcv"
                     : "+r"(x0), "=r"(nzcv)
                     : "r"(x1), "r"(x2), "r"(x3), "r"(x4), "r"(x5), "r"(x16)
                     : "memory", "cc");
    if ((nzcv & 0x20000000UL) != 0) {
        errno = (int)x0;
        return -1;
    }
    return x0;
#else
#error "raw_call needs x86_64 or arm64"
#endif
}

static int (*real_open)(const char *, int, ...);
static int (*real_openat)(int, const char *, int, ...);
static int (*real_close)(int);
static int (*real_close_nocancel)(int);
static ssize_t (*real_read)(int, void *, size_t);
static ssize_t (*real_pread)(int, void *, size_t, off_t);
static ssize_t (*real_readv)(int, const struct iovec *, int);
static ssize_t (*real_write)(int, const void *, size_t);
static ssize_t (*real_pwrite)(int, const void *, size_t, off_t);
static ssize_t (*real_writev)(int, const struct iovec *, int);
static int (*real_stat)(const char *, struct stat *);
static int (*real_lstat)(const char *, struct stat *);
static int (*real_fstat)(int, struct stat *);
static off_t (*real_lseek)(int, off_t, int);
static void *(*real_mmap)(void *, size_t, int, int, int, off_t);
static int (*real_munmap)(void *, size_t);

// Resolution itself (dlsym, image-table scan) may issue file syscalls that land
// back in these replacements before the pointers are set. The flag below
// diverts such re-entrant calls (or any racing first-use thread) to raw_call,
// which is always correct forwarding, just without the libc wrapper.
static _Atomic int g_resolving = 0;

// True-definition lookup that bypasses interposition: the loaded images'
// symbol tables still point at the real libc stubs. Skips our own image.
static void *image_sym(const char *bare) {
    char sym[64];
    sym[0] = '_';
    int i = 0;
    while (i < 63 && bare[i] != '\0') {
        sym[1 + i] = bare[i];
        i++;
    }
    sym[1 + i] = '\0';
    if (bare[i] != '\0') {
        return NULL;
    }
    uint32_t n = _dyld_image_count();
    for (uint32_t k = 0; k < n; k++) {
        const struct mach_header *mh = _dyld_get_image_header(k);
        if (mh == &_mh_dylib_header) {
            continue;
        }
        NSSymbol s = NSLookupSymbolInImage(
            mh, sym,
            NSLOOKUPSYMBOLINIMAGE_OPTION_RETURN_ON_ERROR |
                NSLOOKUPSYMBOLINIMAGE_OPTION_BIND_FULLY);
        if (s != NULL) {
            return NSAddressOfSymbol(s);
        }
    }
    return NULL;
}

static void *next_sym(const char *name64, const char *name, const void *repl) {
    void *p = dlsym(RTLD_NEXT, name64);
    if (p == NULL && name != NULL) {
        p = dlsym(RTLD_NEXT, name);
    }
    if (p == NULL || p == repl) {
        // dlsym honors interposition, so for our own symbols it hands back
        // our replacement (forwarding to it would recurse forever) or NULL.
        // Fall through to the image tables for the true definition.
        void *q = image_sym(name64);
        if (q != NULL && q != repl) {
            return q;
        }
        if (name != NULL) {
            q = image_sym(name);
            if (q != NULL && q != repl) {
                return q;
            }
        }
        return NULL;
    }
    return p;
}

static int ensure_resolved(void **slot, const char *name64, const char *name,
                           const void *repl) {
    if (*slot != NULL) {
        return 1;
    }
    if (atomic_load(&g_resolving)) {
        return 0;
    }
    int saved = errno;
    atomic_store(&g_resolving, 1);
    void *p = next_sym(name64, name, repl);
    if (p != NULL) {
        *slot = p;
    }
    atomic_store(&g_resolving, 0);
    errno = saved;
    return p != NULL;
}

#define HAVE_REAL(ptr, n64, n, repl) \
    ((ptr) != NULL || \
     ensure_resolved((void **)&(ptr), (n64), (n), (const void *)(repl)))

int census_open(const char *path, int oflag, ...);
int census_openat(int fd, const char *path, int oflag, ...);
int census_close(int fd);
int census_close_nocancel(int fd);
ssize_t census_read(int fd, void *buf, size_t nbyte);
ssize_t census_pread(int fd, void *buf, size_t nbyte, off_t offset);
ssize_t census_readv(int fd, const struct iovec *iov, int iovcnt);
ssize_t census_write(int fd, const void *buf, size_t nbyte);
ssize_t census_pwrite(int fd, const void *buf, size_t nbyte, off_t offset);
ssize_t census_writev(int fd, const struct iovec *iov, int iovcnt);
int census_stat(const char *path, struct stat *buf);
int census_lstat(const char *path, struct stat *buf);
int census_fstat(int fd, struct stat *buf);
off_t census_lseek(int fd, off_t offset, int whence);
void *census_mmap(void *addr, size_t len, int prot, int flags, int fd,
                  off_t offset);
int census_munmap(void *addr, size_t len);

static void resolve_all(void) {
    HAVE_REAL(real_open, "open", NULL, census_open);
    HAVE_REAL(real_openat, "openat", NULL, census_openat);
    HAVE_REAL(real_close, "close", NULL, census_close);
    HAVE_REAL(real_close_nocancel, "close$NOCANCEL", NULL, census_close_nocancel);
    HAVE_REAL(real_read, "read", NULL, census_read);
    HAVE_REAL(real_pread, "pread", NULL, census_pread);
    HAVE_REAL(real_readv, "readv", NULL, census_readv);
    HAVE_REAL(real_write, "write", NULL, census_write);
    HAVE_REAL(real_pwrite, "pwrite", NULL, census_pwrite);
    HAVE_REAL(real_writev, "writev", NULL, census_writev);
    HAVE_REAL(real_stat, "stat$INODE64", "stat", census_stat);
    HAVE_REAL(real_lstat, "lstat$INODE64", "lstat", census_lstat);
    HAVE_REAL(real_fstat, "fstat$INODE64", "fstat", census_fstat);
    HAVE_REAL(real_lseek, "lseek", NULL, census_lseek);
    HAVE_REAL(real_mmap, "mmap", NULL, census_mmap);
    HAVE_REAL(real_munmap, "munmap", NULL, census_munmap);
}

__attribute__((constructor)) static void census_init(void) {
    mach_timebase_info_data_t info = {0, 0};
    if (mach_timebase_info(&info) == 0 && info.denom != 0) {
        g_tb_num = info.numer;
        g_tb_den = info.denom;
    }
    resolve_all();
}

int census_open(const char *path, int oflag, ...) {
    mode_t mode = 0;
    if ((oflag & O_CREAT) != 0) {
        va_list ap;
        va_start(ap, oflag);
        mode = (mode_t)va_arg(ap, int);
        va_end(ap);
    }
    int use_real = HAVE_REAL(real_open, "open", NULL, census_open);
    uint64_t t0 = mach_absolute_time();
    int rv;
    if (use_real) {
        if ((oflag & O_CREAT) != 0) {
            rv = real_open(path, oflag, mode);
        } else {
            rv = real_open(path, oflag);
        }
    } else {
        rv = (int)raw_call(SYS_open, (long)path, oflag, (long)mode, 0, 0, 0);
    }
    record_call(IDX_OPEN, t0, mach_absolute_time());
    return rv;
}

int census_openat(int fd, const char *path, int oflag, ...) {
    mode_t mode = 0;
    if ((oflag & O_CREAT) != 0) {
        va_list ap;
        va_start(ap, oflag);
        mode = (mode_t)va_arg(ap, int);
        va_end(ap);
    }
    int use_real = HAVE_REAL(real_openat, "openat", NULL, census_openat);
    uint64_t t0 = mach_absolute_time();
    int rv;
    if (use_real) {
        if ((oflag & O_CREAT) != 0) {
            rv = real_openat(fd, path, oflag, mode);
        } else {
            rv = real_openat(fd, path, oflag);
        }
    } else {
        rv = (int)raw_call(SYS_openat, fd, (long)path, oflag, (long)mode, 0, 0);
    }
    record_call(IDX_OPENAT, t0, mach_absolute_time());
    return rv;
}

int census_close(int fd) {
    int use_real = HAVE_REAL(real_close, "close", NULL, census_close);
    uint64_t t0 = mach_absolute_time();
    int rv;
    if (use_real) {
        rv = real_close(fd);
    } else {
        rv = (int)raw_call(SYS_close, fd, 0, 0, 0, 0, 0);
    }
    record_call(IDX_CLOSE, t0, mach_absolute_time());
    return rv;
}

// The $NOCANCEL twin shares the close counters: it is the same operation,
// just the non-cancellation-point spelling libuv binds. Verified by probe
// (plain.c closes count once each): libc close does not route through it.
int census_close_nocancel(int fd) {
    int use_real =
        HAVE_REAL(real_close_nocancel, "close$NOCANCEL", NULL, census_close_nocancel);
    uint64_t t0 = mach_absolute_time();
    int rv;
    if (use_real) {
        rv = real_close_nocancel(fd);
    } else {
        rv = (int)raw_call(SYS_close, fd, 0, 0, 0, 0, 0);
    }
    record_call(IDX_CLOSE, t0, mach_absolute_time());
    return rv;
}

ssize_t census_read(int fd, void *buf, size_t nbyte) {
    int use_real = HAVE_REAL(real_read, "read", NULL, census_read);
    uint64_t t0 = mach_absolute_time();
    ssize_t rv;
    if (use_real) {
        rv = real_read(fd, buf, nbyte);
    } else {
        rv = (ssize_t)raw_call(SYS_read, fd, (long)buf, (long)nbyte, 0, 0, 0);
    }
    record_call(IDX_READ, t0, mach_absolute_time());
    if (rv > 0) {
        atomic_fetch_add(&g_bytes[IDX_READ], (unsigned long long)rv);
    }
    return rv;
}

ssize_t census_pread(int fd, void *buf, size_t nbyte, off_t offset) {
    int use_real = HAVE_REAL(real_pread, "pread", NULL, census_pread);
    uint64_t t0 = mach_absolute_time();
    ssize_t rv;
    if (use_real) {
        rv = real_pread(fd, buf, nbyte, offset);
    } else {
        rv = (ssize_t)raw_call(SYS_pread, fd, (long)buf, (long)nbyte,
                               (long)offset, 0, 0);
    }
    record_call(IDX_PREAD, t0, mach_absolute_time());
    if (rv > 0) {
        atomic_fetch_add(&g_bytes[IDX_PREAD], (unsigned long long)rv);
    }
    return rv;
}

ssize_t census_readv(int fd, const struct iovec *iov, int iovcnt) {
    int use_real = HAVE_REAL(real_readv, "readv", NULL, census_readv);
    uint64_t t0 = mach_absolute_time();
    ssize_t rv;
    if (use_real) {
        rv = real_readv(fd, iov, iovcnt);
    } else {
        rv = (ssize_t)raw_call(SYS_readv, fd, (long)iov, iovcnt, 0, 0, 0);
    }
    record_call(IDX_READV, t0, mach_absolute_time());
    if (rv > 0) {
        atomic_fetch_add(&g_bytes[IDX_READV], (unsigned long long)rv);
    }
    return rv;
}

ssize_t census_write(int fd, const void *buf, size_t nbyte) {
    int use_real = HAVE_REAL(real_write, "write", NULL, census_write);
    uint64_t t0 = mach_absolute_time();
    ssize_t rv;
    if (use_real) {
        rv = real_write(fd, buf, nbyte);
    } else {
        rv = (ssize_t)raw_call(SYS_write, fd, (long)buf, (long)nbyte, 0, 0, 0);
    }
    record_call(IDX_WRITE, t0, mach_absolute_time());
    if (rv > 0) {
        atomic_fetch_add(&g_bytes[IDX_WRITE], (unsigned long long)rv);
    }
    return rv;
}

ssize_t census_pwrite(int fd, const void *buf, size_t nbyte, off_t offset) {
    int use_real = HAVE_REAL(real_pwrite, "pwrite", NULL, census_pwrite);
    uint64_t t0 = mach_absolute_time();
    ssize_t rv;
    if (use_real) {
        rv = real_pwrite(fd, buf, nbyte, offset);
    } else {
        rv = (ssize_t)raw_call(SYS_pwrite, fd, (long)buf, (long)nbyte,
                               (long)offset, 0, 0);
    }
    record_call(IDX_PWRITE, t0, mach_absolute_time());
    if (rv > 0) {
        atomic_fetch_add(&g_bytes[IDX_PWRITE], (unsigned long long)rv);
    }
    return rv;
}

ssize_t census_writev(int fd, const struct iovec *iov, int iovcnt) {
    int use_real = HAVE_REAL(real_writev, "writev", NULL, census_writev);
    uint64_t t0 = mach_absolute_time();
    ssize_t rv;
    if (use_real) {
        rv = real_writev(fd, iov, iovcnt);
    } else {
        rv = (ssize_t)raw_call(SYS_writev, fd, (long)iov, iovcnt, 0, 0, 0);
    }
    record_call(IDX_WRITEV, t0, mach_absolute_time());
    if (rv > 0) {
        atomic_fetch_add(&g_bytes[IDX_WRITEV], (unsigned long long)rv);
    }
    return rv;
}

int census_stat(const char *path, struct stat *buf) {
    int use_real = HAVE_REAL(real_stat, "stat$INODE64", "stat", census_stat);
    uint64_t t0 = mach_absolute_time();
    int rv;
    if (use_real) {
        rv = real_stat(path, buf);
    } else {
        rv = (int)raw_call(SYS_stat64, (long)path, (long)buf, 0, 0, 0, 0);
    }
    record_call(IDX_STAT, t0, mach_absolute_time());
    return rv;
}

int census_lstat(const char *path, struct stat *buf) {
    int use_real = HAVE_REAL(real_lstat, "lstat$INODE64", "lstat", census_lstat);
    uint64_t t0 = mach_absolute_time();
    int rv;
    if (use_real) {
        rv = real_lstat(path, buf);
    } else {
        rv = (int)raw_call(SYS_lstat64, (long)path, (long)buf, 0, 0, 0, 0);
    }
    record_call(IDX_LSTAT, t0, mach_absolute_time());
    return rv;
}

int census_fstat(int fd, struct stat *buf) {
    int use_real = HAVE_REAL(real_fstat, "fstat$INODE64", "fstat", census_fstat);
    uint64_t t0 = mach_absolute_time();
    int rv;
    if (use_real) {
        rv = real_fstat(fd, buf);
    } else {
        rv = (int)raw_call(SYS_fstat64, fd, (long)buf, 0, 0, 0, 0);
    }
    record_call(IDX_FSTAT, t0, mach_absolute_time());
    return rv;
}

off_t census_lseek(int fd, off_t offset, int whence) {
    int use_real = HAVE_REAL(real_lseek, "lseek", NULL, census_lseek);
    uint64_t t0 = mach_absolute_time();
    off_t rv;
    if (use_real) {
        rv = real_lseek(fd, offset, whence);
    } else {
        rv = (off_t)raw_call(SYS_lseek, fd, (long)offset, whence, 0, 0, 0);
    }
    record_call(IDX_LSEEK, t0, mach_absolute_time());
    return rv;
}

void *census_mmap(void *addr, size_t len, int prot, int flags, int fd,
                  off_t offset) {
    int use_real = HAVE_REAL(real_mmap, "mmap", NULL, census_mmap);
    uint64_t t0 = mach_absolute_time();
    void *rv;
    if (use_real) {
        rv = real_mmap(addr, len, prot, flags, fd, offset);
    } else {
        rv = (void *)raw_call(SYS_mmap, (long)addr, (long)len, prot, flags, fd,
                              (long)offset);
    }
    record_call(IDX_MMAP, t0, mach_absolute_time());
    if (rv != MAP_FAILED) {
        atomic_fetch_add(&g_bytes[IDX_MMAP], (unsigned long long)len);
    }
    return rv;
}

int census_munmap(void *addr, size_t len) {
    int use_real = HAVE_REAL(real_munmap, "munmap", NULL, census_munmap);
    uint64_t t0 = mach_absolute_time();
    int rv;
    if (use_real) {
        rv = real_munmap(addr, len);
    } else {
        rv = (int)raw_call(SYS_munmap, (long)addr, (long)len, 0, 0, 0, 0);
    }
    record_call(IDX_MUNMAP, t0, mach_absolute_time());
    return rv;
}

typedef struct {
    const void *replacement;
    const void *replacee;
} census_interpose_t;

extern int close$NOCANCEL(int);

__attribute__((used)) static const census_interpose_t census_interposers[]
    __attribute__((section("__DATA,__interpose"))) = {
        {(const void *)census_open, (const void *)open},
        {(const void *)census_openat, (const void *)openat},
        {(const void *)census_close, (const void *)close},
        {(const void *)census_close_nocancel, (const void *)close$NOCANCEL},
        {(const void *)census_read, (const void *)read},
        {(const void *)census_pread, (const void *)pread},
        {(const void *)census_readv, (const void *)readv},
        {(const void *)census_write, (const void *)write},
        {(const void *)census_pwrite, (const void *)pwrite},
        {(const void *)census_writev, (const void *)writev},
        {(const void *)census_stat, (const void *)stat},
        {(const void *)census_lstat, (const void *)lstat},
        {(const void *)census_fstat, (const void *)fstat},
        {(const void *)census_lseek, (const void *)lseek},
        {(const void *)census_mmap, (const void *)mmap},
        {(const void *)census_munmap, (const void *)munmap},
};

static const char *const k_names[N_CALLS] = {
    "open",   "openat", "close", "read",  "pread",  "readv", "write",
    "pwrite", "writev", "stat",  "lstat", "fstat",  "lseek", "mmap",
    "munmap",
};

static int has_bytes(int idx) {
    return idx == IDX_READ || idx == IDX_PREAD || idx == IDX_READV ||
           idx == IDX_WRITE || idx == IDX_PWRITE || idx == IDX_WRITEV ||
           idx == IDX_MMAP;
}

__attribute__((destructor)) static void census_fini(void) {
    const char *out = getenv("COUNTERS_CENSUS_OUT");
    if (out == NULL || *out == '\0') {
        return;
    }
    resolve_all();
    if (real_open == NULL || real_write == NULL || real_close == NULL) {
        return;
    }
    int fd = real_open(out, O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) {
        return;
    }
    static char buf[8192];
    int len = 0;
    int w = snprintf(buf, sizeof(buf), "{\"schema\":1,\"calls\":{");
    if (w > 0) {
        len = w;
    }
    for (int i = 0; i < N_CALLS; i++) {
        unsigned long long c = atomic_load(&g_count[i]);
        unsigned long long t = atomic_load(&g_total_ns[i]);
        char entry[256];
        int ew;
        if (has_bytes(i)) {
            unsigned long long b = atomic_load(&g_bytes[i]);
            ew = snprintf(entry, sizeof(entry),
                          "%s\"%s\":{\"count\":%llu,\"totalNs\":%llu,\"bytes\":%llu}",
                          i == 0 ? "" : ",", k_names[i], c, t, b);
        } else {
            ew = snprintf(entry, sizeof(entry),
                          "%s\"%s\":{\"count\":%llu,\"totalNs\":%llu}",
                          i == 0 ? "" : ",", k_names[i], c, t);
        }
        if (ew > 0 && len + ew < (int)sizeof(buf)) {
            for (int k = 0; k < ew; k++) {
                buf[len + k] = entry[k];
            }
            len += ew;
        }
    }
    if (len + 3 < (int)sizeof(buf)) {
        buf[len++] = '}';
        buf[len++] = '}';
        buf[len++] = '\n';
    }
    if (len > 0) {
        (void)real_write(fd, buf, (size_t)len);
    }
    (void)real_close(fd);
}
