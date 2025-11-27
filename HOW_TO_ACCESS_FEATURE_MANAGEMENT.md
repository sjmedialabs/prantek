# How to Access Feature Management

## ✅ Setup Status

All files are created and the application has been restarted successfully.

## 📍 Location

**Path**: Super Admin → Subscription Plans → Feature Management tab

## 🔍 Step-by-Step Access

1. **Login** to your application as Super Admin

2. **Navigate** to the left sidebar

3. **Click** on "Subscription Plans" (should be in the super-admin menu)

4. You will see **3 tabs**:
   - All Plans
   - Plan Analytics  
   - **Feature Management** ← Click this!

5. The feature matrix will load showing:
   - Plans as columns
   - Features as rows
   - Toggle switches for each feature

## 🔧 If You Don't See It

### Option 1: Hard Refresh Browser
Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac) to clear browser cache

### Option 2: Clear Browser Cache
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Click "Clear site data"
4. Refresh page

### Option 3: Check Browser Console
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for any red errors
4. Share errors if you see any

### Option 4: Verify Files
Run this command to verify all files exist:
```bash
cd /www/wwwroot/prantek
ls -lh app/api/subscription-plans/features/route.ts
ls -lh components/super-admin/plan-feature-matrix.tsx
grep -n "Feature Management" app/super-admin/subscriptions/page.tsx
```

## 📊 What You Should See

When you access the Feature Management tab, you'll see:

```
┌─────────────────┬─────────┬─────────┬─────────┐
│ Feature         │ Plan 1  │ Plan 2  │ Plan 3  │
├─────────────────┼─────────┼─────────┼─────────┤
│ User Creation   │ [toggle]│ [toggle]│ [toggle]│
│ Analytics       │ [toggle]│ [toggle]│ [toggle]│
│ Export Reports  │ [toggle]│ [toggle]│ [toggle]│
│ API Access      │ [toggle]│ [toggle]│ [toggle]│
│ Custom Branding │ [toggle]│ [toggle]│ [toggle]│
│ RBAC            │ [toggle]│ [toggle]│ [toggle]│
└─────────────────┴─────────┴─────────┴─────────┘
```

## 🆘 Still Not Working?

1. **Check PM2 status**:
   ```bash
   pm2 status prantek-app
   ```
   Should show "online"

2. **Check logs**:
   ```bash
   pm2 logs prantek-app --lines 50
   ```
   Look for errors

3. **Rebuild** (if needed):
   ```bash
   cd /www/wwwroot/prantek
   npm run build
   pm2 restart prantek-app
   ```

4. **Verify port**: 
   Application runs on port 9080
   Check: http://your-domain:9080 or https://admin.skcmines.com

## 📝 Files Verification

Run these commands to verify everything:
```bash
cd /www/wwwroot/prantek

# Check component
cat components/super-admin/plan-feature-matrix.tsx | head -5

# Check subscriptions page has the tab
grep "Feature Management" app/super-admin/subscriptions/page.tsx

# Check API endpoint
ls -l app/api/subscription-plans/features/route.ts

# Check if types are updated
grep "PlanFeatures" lib/models/types.ts
```

All should return results without errors.

## 💡 Quick Test

If you have existing subscription plans, the Feature Management tab will show them.
If you have NO plans yet:
1. Go to "All Plans" tab first
2. Create a test plan
3. Then go to "Feature Management" tab
4. You'll see your plan with toggle switches

---

Created: November 26, 2025
Application restarted: ✅
Browser cache cleared: Required (do Ctrl+Shift+R)
