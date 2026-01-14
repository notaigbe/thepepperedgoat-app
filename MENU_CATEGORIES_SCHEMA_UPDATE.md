# Menu Categories Schema Update

## Database Table Definition

The `menu_categories` table has been created with the following structure:

```sql
CREATE TABLE public.menu_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  title text NOT NULL,
  description text NULL,
  sort_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT menu_categories_pkey PRIMARY KEY (id),
  CONSTRAINT menu_categories_key_key UNIQUE (key)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON public.menu_categories 
USING btree (sort_order) TABLESPACE pg_default;
```

### Field Explanations

- **id**: UUID primary key (auto-generated)
- **key**: Unique text identifier for the category (e.g., "appetizers", "beverages")
- **title**: Display name shown to users (e.g., "Online Appetizers")
- **description**: Optional description of the category
- **sort_order**: Integer for ordering categories in the UI (default 0)
- **created_at**: Timestamp when the category was created
- **updated_at**: Timestamp of last update

## Updated Code Changes

### 1. Supabase Types (`app/integrations/supabase/types.ts`)

Added complete menu_categories table definition to Database interface:

```typescript
menu_categories: {
  Row: {
    id: string
    key: string
    title: string
    description: string | null
    sort_order: number | null
    created_at: string | null
    updated_at: string | null
  }
  Insert: { /* ... */ }
  Update: { /* ... */ }
}
```

### 2. Application Types (`types/index.ts`)

Updated MenuCategory interface to match database schema:

```typescript
export interface MenuCategory {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  sort_order?: number | null;
}
```

### 3. App Context (`contexts/AppContext.tsx`)

Updated `loadMenuCategories()` to properly map database fields:

```typescript
const categories: MenuCategory[] = data.map((category: any) => ({
  id: category.id,
  key: category.key,           // Unique identifier for category
  title: category.title,        // Display name
  description: category.description,
  sort_order: category.sort_order,
}));

// Prepend 'All' category
setMenuCategories([
  { id: 'all', key: 'all', title: 'All', sort_order: -1 }, 
  ...categories
]);
```

### 4. Home Screen (`app/(tabs)/(home)/index.tsx`)

Updated filtering and rendering logic:

- **Selected Category State**: Uses `key` field for identification (not `id`)
- **Dropdown Modal**: Displays category titles and uses keys for selection
- **Horizontal Categories**: Shows titles and uses keys for comparison
- **Filtering Logic**: Maps category key → ID for menu_items filtering

```typescript
const filteredItems = menuItems.filter((item) => {
  const selectedCategoryObj = menuCategories.find(cat => cat.key === selectedCategory);
  const selectedCategoryId = selectedCategoryObj?.id;
  const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategoryId;
  return matchesSearch && matchesCategory;
});
```

## Key Implementation Details

### Why Use `key` Instead of `id` for Selection?

- `key` is a human-readable unique identifier that survives database schema changes
- `id` (UUID) is an internal database identifier that can change
- Using `key` makes the category selection logic more maintainable

### Category Flow

1. **Database → Context**: Categories loaded from `menu_categories` table
2. **Mapping**: Database rows mapped to MenuCategory interface
3. **Special Case**: "All" category automatically prepended with key="all"
4. **Selection**: User selects by key (e.g., "appetizers")
5. **Filtering**: Key is mapped to UUID id for matching with menu_items.category_id
6. **Display**: Title field shown in UI

### Foreign Key Relationship

The `menu_items` table has `category_id` as a foreign key reference to `menu_categories.id`:

```sql
ALTER TABLE menu_items 
ADD CONSTRAINT fk_menu_items_category 
FOREIGN KEY (category_id) REFERENCES menu_categories(id);
```

## Sample Data Structure

```typescript
// Example menu categories in database
[
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    key: "appetizers",
    title: "Online Appetizers",
    description: "Delicious appetizers",
    sort_order: 1
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    key: "beverages",
    title: "Online Beverages",
    description: "Refreshing drinks",
    sort_order: 2
  }
]

// In app context, prepended with 'All' category
[
  {
    id: 'all',
    key: 'all',
    title: 'All'
  },
  // ... rest of categories
]
```

## Backend Consistency

When menu_items are created, the `category_id` should reference the `id` UUID from menu_categories:

```sql
INSERT INTO menu_items (
  name, description, price, category_id, image_url
) VALUES (
  'Jollof Rice',
  'Spicy rice dish',
  12.99,
  '550e8400-e29b-41d4-a716-446655440000',  -- References menu_categories.id
  'jollof-rice.jpg'
);
```

## Testing Checklist

- [ ] Database table created with all fields
- [ ] Unique constraint on `key` field enforced
- [ ] Index on `sort_order` created
- [ ] Sample categories added to database
- [ ] Menu items have valid `category_id` references
- [ ] App loads categories on startup
- [ ] "All" category appears first in UI
- [ ] Category filtering works correctly
- [ ] Category selection persists across navigation
