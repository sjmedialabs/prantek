# Label Component with Required Prop

## Overview
The `Label` component has been enhanced with a `required` prop that automatically adds a red asterisk (*) to indicate mandatory fields.

## Usage

### Before (Manual approach)
```tsx
<Label htmlFor="email">
  Email <span className="text-red-500">*</span>
</Label>
```

### After (Using required prop)
```tsx
<Label htmlFor="email" required>Email</Label>
```

## Benefits
- **Consistent styling**: All required field indicators look the same
- **Less code**: No need to manually add span elements
- **Easier maintenance**: Change the styling in one place (the Label component)
- **Application-wide**: Works everywhere the Label component is used

## Examples

### Single-line label
```tsx
<Label htmlFor="name" required>Full Name</Label>
```

### Multi-line with required
```tsx
<Label htmlFor="address" required>
  Street Address
</Label>
```

### Optional field (no asterisk)
```tsx
<Label htmlFor="website">Website</Label>
```

## Implementation
The Label component (`components/ui/label.tsx`) has been updated with:
- A `required?: boolean` prop
- Automatic rendering of `<span className="text-red-500">*</span>` when `required={true}`

## Migration
To migrate existing forms:
1. Replace `<span className="text-red-500">*</span>` with the `required` prop
2. Keep the label text clean without manual asterisks
3. The red star will be automatically appended

## Applied To
- Company Details settings (`app/dashboard/settings/company/page.tsx`)
  - Company Name ✓
  - Email ✓
  - Address ✓
  - City ✓
  - State ✓
  - Pincode ✓
  - Phone ✓
  - GSTIN ✓
  - PAN ✓

## Next Steps
Other forms throughout the application can be gradually migrated to use this pattern for consistency.
