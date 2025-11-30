# PowerShell-Compatible Test Commands

## The Issue
PowerShell aliases `curl` to `Invoke-WebRequest` which has different syntax.
Use `curl.exe` for Unix-style curl or PowerShell's native syntax.

---

## ✅ Working Commands for PowerShell

### Test 1: Check if server is running
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/pools" -UseBasicParsing
```

### Test 2: Stream pools (SSE)
```powershell
# PowerShell doesn't handle SSE well, use browser instead:
# Open: http://localhost:3000/api/stream/pools
```

### Test 3: Execute a swap
```powershell
$body = @{
    pool_id = 1
    trader = "0xtest"
    token_in_id = 1
    amount_in = "100000000"
    min_amount_out = "95000000"
    deadline = 9999999999999
    idempotency_key = "testswap-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/swap/v2" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -UseBasicParsing
```

### Test 4: Check WebSocket stats
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/ws-stats" -UseBasicParsing
```

---

## 🚀 EASIEST Way: Just Open the Browser!

```
http://localhost:3000/realtime-demo
```

**This page shows EVERYTHING working:**
- ✅ Live pools
- ✅ Real-time updates
- ✅ Wallet connection
- ✅ Swap feed
- ✅ Connection status

---

## Or Use the Test Script

```powershell
# The test script works on PowerShell:
node test-realtime.js
```

---

## Fix Server Errors

The server is showing favicon errors. To fix:

### Option 1: Delete broken favicon
```powershell
Remove-Item "public\favicon.ico" -ErrorAction SilentlyContinue
```

### Option 2: Restart server
```powershell
# Press Ctrl+C to stop server
# Then:
npm run dev:turbo
```

---

## Quick Reference

| Task | PowerShell Command |
|------|-------------------|
| GET request | `Invoke-WebRequest -Uri "URL"` |
| POST request | `Invoke-WebRequest -Uri "URL" -Method POST -Body $json -ContentType "application/json"` |
| Stream SSE | Open in browser: `http://localhost:3000/api/stream/pools` |
| View pools | Browser: `http://localhost:3000/api/pools` |
| Demo page | Browser: `http://localhost:3000/realtime-demo` |

---

## 🎯 Recommended: Use Browser

The easiest way to test everything:

1. **Start server:**
   ```powershell
   npm run dev:turbo
   ```

2. **Open browser:**
   ```
   http://localhost:3000/realtime-demo
   ```

3. **Done!** See everything working in real-time!

---

## Troubleshooting

**"500 Internal Server Error"**
- Favicon.ico is corrupted
- Solution: Delete it or ignore (doesn't affect functionality)

**"Unable to connect"**
- Server not running
- Check server terminal for errors
- Restart: `npm run dev:turbo`

**"curl: command not found"**
- Use `Invoke-WebRequest` instead
- Or use `curl.exe` (if Git is installed)
