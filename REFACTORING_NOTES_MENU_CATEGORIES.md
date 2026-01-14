# Menu Categories Refactoring - Implementation Summary

## Overview
Refactored the home screen to fetch menu categories dynamically from a `menu_categories` database table instead of using hardcoded categories.

## Changes Made

### 1. **Types** (`types/index.ts`)
- Added `MenuCategory` interface:
  ```typescript
  export interface MenuCategory {
    id: string;
    name: string;
    display_name: string;
    sort_order?: number | null;
  }
  ```

### 2. **Supabase Service** (`services/supabaseService.ts`)
- Added `getMenuCategories()` method to `menuService`:
  ```typescript
  async getMenuCategories() {
    // Fetches from menu_categories table
    // Orders by sort_order ascending
    // Returns MenuCategory[] with error handling
  }
  ```

### 3. **App Context** (`contexts/AppContext.tsx`)
- Added `MenuCategory` to imports
- Added state: `menuCategories: MenuCategory[]`
- Added method: `loadMenuCategories()` callback
- Imported `MenuCategory` type
- Added `menuCategories` and `loadMenuCategories` to context interface
- Exports both in the context value
- Automatically adds "All" category at index 0 with id "all"

### 4. **Home Screen** (`app/(tabs)/(home)/index.tsx`)
- Removed hardcoded `menuCategories` array
- Updated component hook:
  - Added `menuCategories` destructure
  - Added `loadMenuCategories` destructure
  - Changed `selectedCategory` initial state from `"All"` to `"all"`
- Updated `useEffect` to load both menu items AND menu categories
- Updated filtering logic:
  - Changed `selectedCategory === "All"` to `selectedCategory === "all"`
- Updated both category rendering sections:
  - Dropdown modal: uses `category.id` and `category.display_name`
  - Horizontal scroll list: uses `category.id` and `category.display_name`

## Database Schema Requirements

The `menu_categories` table should have:
```sql
CREATE TABLE menu_categories (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  display_name VARCHAR NOT NULL,
  sort_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key relationship in menu_items table
ALTER TABLE menu_items 
ADD CONSTRAINT fk_menu_items_category 
FOREIGN KEY (category_id) REFERENCES menu_categories(id);
```

## How It Works

1. **Initialization**: When the home screen mounts, it triggers `loadMenuCategories()`
2. **Data Fetching**: AppContext fetches categories from Supabase `menu_categories` table
3. **Special "All" Category**: An "all" category is automatically prepended to the list
4. **Category Selection**: Users select a category by its `id` (e.g., "all", "appetizers", etc.)
5. **Filtering**: Menu items are filtered by matching their `category_id` with the selected category
6. **Display**: Categories show their `display_name` in the UI

## Breaking Changes

- The hardcoded category strings have been removed
- `selectedCategory` state now uses IDs instead of display names
- Category comparison logic updated to use `id` field
- Components now expect category objects with `id`, `name`, and `display_name` properties

## Benefits

✅ Dynamic category management without code changes  
✅ Easy to add/remove categories from database  
✅ Supports custom sort order  
✅ Maintains relationship between menu_items and menu_categories  
✅ Display names can differ from database IDs  
✅ Follows existing data fetching patterns in AppContext
