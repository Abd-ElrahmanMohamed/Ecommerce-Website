# Account Component Testing Guide

## Quick Test Steps

### 1. **Backend Prerequisites**

Make sure your backend is running and seeded with data:

```bash
cd backend
npm run dev
# Or
npm start
```

### 2. **Frontend Start**

```bash
npm start
# Navigate to http://localhost:4200
```

### 3. **Test Scenarios**

#### Scenario A: Full User Experience

1. ✅ Register a new account via `/register`
2. ✅ Login via `/login`
3. ✅ Navigate to `/account`
4. Expected: User profile loads with all data from database

#### Scenario B: View User Profile

1. ✅ After login, go to `/account`
2. Expected results:
   - User name, email, phone displayed
   - Member since date shown
   - Profile picture placeholder shows first letter

#### Scenario C: View Orders

1. ✅ Go to "My Orders" tab in account
2. Expected results:
   - Orders list loads from backend
   - If no orders: "You haven't placed any orders yet"
   - Shows order number, date, status, total, items

#### Scenario D: Manage Addresses

1. ✅ Go to "Addresses" tab
2. Expected results:
   - Existing addresses load from user data
   - Can view all address details
   - Can add new address
   - Can delete address with confirmation
   - User data updates after operations

#### Scenario E: Change Password

1. ✅ Go to "Settings" tab
2. ✅ Fill password form:
   - Current password
   - New password (6+ chars)
   - Confirm password (must match)
3. Expected results:
   - ✅ Success message if password updated
   - ❌ Error message if validation fails or API error

#### Scenario F: Error Handling

1. ✅ Disconnect backend while on account page
2. Expected:
   - Error messages show in UI
   - Component doesn't crash
   - User can still view cached data

### 4. **Browser Console Checks**

Open DevTools (F12) → Console tab:

**Expected Messages:**

```
✅ User profile loaded: {firstName: "...", lastName: "...", ...}
✅ Orders loaded: [{...}, {...}]
```

**Should NOT See:**

```
❌ QuotaExceededError
❌ Cannot read property 'firstName' of null
❌ 404 Not Found
```

### 5. **Data Validation**

#### User Profile Fields

- [ ] firstName & lastName
- [ ] email
- [ ] phone
- [ ] createdAt (joined date)
- [ ] role (if available)
- [ ] addresses array

#### Orders Fields

- [ ] orderNumber or id
- [ ] date/createdAt
- [ ] total (numeric)
- [ ] status (pending/processing/shipped/delivered)
- [ ] items count

#### Address Fields

- [ ] type (Home/Work/Other)
- [ ] street
- [ ] city
- [ ] state
- [ ] zipCode/postalCode
- [ ] isDefault flag

### 6. **Performance Checks**

- [ ] Initial load takes < 3 seconds
- [ ] No console warnings
- [ ] No memory leaks (check DevTools)
- [ ] Subscriptions cleanup on navigate away
- [ ] No duplicate API calls

### 7. **UI/UX Checks**

- [ ] Loading spinner shows during data fetch
- [ ] Success messages appear for operations
- [ ] Error messages are readable and helpful
- [ ] Forms validate properly
- [ ] Buttons are enabled/disabled appropriately
- [ ] Responsive on mobile (test with browser zoom)

## Debug Helpers

### View Network Requests

1. DevTools → Network tab
2. Filter by "XHR"
3. Expected endpoints:
   - `GET /api/users/profile`
   - `GET /api/orders`
   - `POST /api/users/address`
   - `DELETE /api/users/address/...`

### View Application State

1. DevTools → Application tab
2. LocalStorage → Check cart data (should be compressed)
3. SessionStorage → Check sessionId

### Check Component State (Angular DevTools)

1. Install "Angular DevTools" browser extension
2. Navigate to account page
3. Inspect AccountComponent
4. View properties: user, orders, addresses, etc.

## Common Issues & Solutions

### Issue: "User profile undefined"

**Solution:**

- Check if user is logged in
- Verify auth token is in localStorage
- Check backend is running

### Issue: "Orders not loading"

**Solution:**

- Verify user has placed orders in backend
- Check API endpoint is correct
- Look for 403/401 errors (auth issue)

### Issue: "QuotaExceededError"

**Solution:**

- Clear browser cache: Ctrl+Shift+Delete
- Clear localStorage: DevTools → Application → Clear All
- Restart browser

### Issue: "Addresses not showing"

**Solution:**

- Verify user data includes addresses array
- Check address object structure in backend
- Ensure addresses are properly mapped in component

## Test Data Setup

If backend has no test data, seed it:

```bash
# Backend folder
node seed-data.js      # Seeds users & products
npm run init-db        # Initialize database
```

Then create test user:

```bash
# Use registration page or API call
POST /api/auth/register
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "+201000000000"
}
```

## Success Criteria ✅

Account component is successfully migrated when:

1. ✅ No mock data hardcoded in component
2. ✅ All data fetched from API with auth headers
3. ✅ Proper error handling for all API calls
4. ✅ No `QuotaExceededError` or memory leaks
5. ✅ Subscription cleanup on component destroy
6. ✅ User-friendly error messages
7. ✅ Loading states work properly
8. ✅ Forms submit to backend successfully
9. ✅ Console shows no errors
10. ✅ All tabs work correctly (overview, orders, addresses, settings)

## Rollback Plan

If issues occur:

1. Stop the dev server
2. Revert changes:
   ```bash
   git checkout src/app/features/account/account.component.ts
   git checkout src/app/core/services/user.service.ts
   git checkout src/app/core/services/order.service.ts
   ```
3. Run `npm start` again
4. Report issue with console logs

---

**Last Updated:** Feb 1, 2026
**Status:** Ready for Testing
