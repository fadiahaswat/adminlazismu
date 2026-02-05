# 🚀 Quick Fix - AKSES DITOLAK Error

## Problem
❌ Error: "AKSES DITOLAK: Sesi tidak valid atau Anda bukan admin"

## Solution (3 Steps)

### Step 1: Deploy Backend ⚡
1. Go to https://script.google.com
2. Create new project
3. Copy entire `Code.gs` file content
4. Update these 2 lines:
   ```javascript
   const SPREADSHEET_ID = "YOUR_SHEET_ID";  // Your Google Sheet ID
   const ALLOWED_ADMIN_EMAILS = [          // Must match admin.js
       "lazismumuallimin@gmail.com",
       "ad.lazismumuallimin@gmail.com",
       "andiaqillahfadiahaswat@gmail.com"
   ];
   ```
5. Deploy > New deployment > Web app
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy deployment URL

### Step 2: Update Frontend 🔧
Open `admin.js` line 48 and replace URL:
```javascript
const GAS_API_URL = "YOUR_DEPLOYMENT_URL_HERE";
```

### Step 3: Verify ✅
1. Logout and login again
2. Try to delete data
3. Should work now! ✅

## ⚠️ Critical
Make sure `ALLOWED_ADMIN_EMAILS` is **EXACTLY THE SAME** in:
- `admin.js` (line 22-26)
- `Code.gs` (line 14-18)

## Need Help?
See `TROUBLESHOOTING.md` for detailed guide.

---
**Last Updated**: 2026-02-05
