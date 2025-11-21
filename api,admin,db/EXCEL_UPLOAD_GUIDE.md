# Excel Upload Guide for Geo Entities

This guide explains how to bulk upload geographical data using Excel files in the UbexGo Admin Panel.

## Overview

The geo hierarchy consists of 6 levels that are related to each other:

```
Country (GeoCountry)
  └─ Province (GeoProvince)
      └─ City/District (GeoCityDistrict)
          ├─ Administrative Area (GeoAdministrativeArea)
          ├─ Settlement (GeoSettlement)
          └─ Neighborhood (GeoNeighborhood)
```

**Important**: Each level depends on its parent level. You must upload data in order from top to bottom.

## Upload Order

1. **Countries** (first - no dependencies)
2. **Provinces** (requires Countries)
3. **City Districts** (requires Provinces and Countries)
4. **Administrative Areas** (requires City Districts, Provinces, and Countries)
5. **Settlements** (requires City Districts, Provinces, and Countries)
6. **Neighborhoods** (requires City Districts, Provinces, and Countries)

## Excel File Format

### General Rules

- First row must contain column headers (exact names as specified below)
- Required columns must have values in every row
- Optional columns can be left empty
- Coordinates (latitude/longitude) should be decimal numbers
- If a record with the same name already exists, it will be updated
- Excel files must be in `.xlsx` or `.xls` format

---

## 1. GeoCountry (Countries)

### Required Columns
- `name` - Country name (unique)

### Optional Columns
- `latitude` - Decimal number (e.g., 41.377491)
- `longitude` - Decimal number (e.g., 64.585262)

### Example Excel Format

| name       | latitude  | longitude |
|------------|-----------|-----------|
| Uzbekistan | 41.377491 | 64.585262 |
| Kazakhstan | 48.019573 | 66.923684 |
| Kyrgyzstan | 41.204380 | 74.766098 |
| Tajikistan | 38.861034 | 71.276093 |
| Turkmenistan | 38.969719 | 59.556278 |

### Notes
- Country names must be unique
- Coordinates are optional but recommended for map features

---

## 2. GeoProvince (Provinces/Regions)

### Required Columns
- `name` - Province name
- `country_name` - Parent country name (must exist in GeoCountry)

### Optional Columns
- `latitude` - Decimal number
- `longitude` - Decimal number

### Example Excel Format

| name      | country_name | latitude  | longitude |
|-----------|--------------|-----------|-----------|
| Tashkent  | Uzbekistan   | 41.311151 | 69.279737 |
| Samarkand | Uzbekistan   | 39.654300 | 66.975500 |
| Bukhara   | Uzbekistan   | 39.775200 | 64.428600 |
| Fergana   | Uzbekistan   | 40.384400 | 71.784400 |
| Andijan   | Uzbekistan   | 40.782800 | 72.344400 |
| Namangan  | Uzbekistan   | 40.997800 | 71.672800 |
| Khorezm   | Uzbekistan   | 41.378900 | 60.365600 |

### Notes
- Province names must be unique within a country
- `country_name` must exactly match an existing country name
- If country is not found, the row will be skipped with an error

---

## 3. GeoCityDistrict (Cities/Districts)

### Required Columns
- `name` - City or district name
- `province_name` - Parent province name (must exist in GeoProvince)
- `country_name` - Country name (for context, must exist in GeoCountry)

### Optional Columns
- `latitude` - Decimal number
- `longitude` - Decimal number

### Example Excel Format

| name           | province_name | country_name | latitude  | longitude |
|----------------|---------------|--------------|-----------|-----------|
| Tashkent City  | Tashkent      | Uzbekistan   | 41.311151 | 69.279737 |
| Chirchiq       | Tashkent      | Uzbekistan   | 41.469200 | 69.582200 |
| Angren         | Tashkent      | Uzbekistan   | 41.016700 | 70.143300 |
| Samarkand City | Samarkand     | Uzbekistan   | 39.654300 | 66.975500 |
| Bukhara City   | Bukhara       | Uzbekistan   | 39.775200 | 64.428600 |
| Fergana City   | Fergana       | Uzbekistan   | 40.384400 | 71.784400 |

### Notes
- City/District names must be unique within a province
- Both `province_name` and `country_name` are required for accurate matching
- The system will find the province within the specified country

---

## 4. GeoAdministrativeArea (Administrative Areas)

### Required Columns
- `name` - Administrative area name
- `city_district_name` - Parent city/district name (must exist in GeoCityDistrict)

### Optional Columns (for context)
- `province_name` - Province name (helps with matching)
- `country_name` - Country name (helps with matching)
- `latitude` - Decimal number
- `longitude` - Decimal number

### Example Excel Format

| name            | city_district_name | province_name | country_name | latitude  | longitude |
|-----------------|-------------------|---------------|--------------|-----------|-----------|
| Chilanzar       | Tashkent City     | Tashkent      | Uzbekistan   | 41.275200 | 69.203100 |
| Yunusabad       | Tashkent City     | Tashkent      | Uzbekistan   | 41.333300 | 69.288900 |
| Mirzo-Ulugbek   | Tashkent City     | Tashkent      | Uzbekistan   | 41.344400 | 69.334400 |
| Yakkasaray      | Tashkent City     | Tashkent      | Uzbekistan   | 41.288900 | 69.244400 |
| Shaykhontohur   | Tashkent City     | Tashkent      | Uzbekistan   | 41.327800 | 69.240000 |
| Bektemir        | Tashkent City     | Tashkent      | Uzbekistan   | 41.211100 | 69.333300 |

### Notes
- Administrative area names must be unique within a city/district
- `province_name` and `country_name` help identify the correct city/district if names are duplicated
- These are typically districts within a city

---

## 5. GeoSettlement (Settlements)

### Required Columns
- `name` - Settlement name
- `city_district_name` - Parent city/district name (must exist in GeoCityDistrict)

### Optional Columns
- `type` - Settlement type (e.g., "qishloq", "shaharcha", "aul", "kент")
- `province_name` - Province name (helps with matching)
- `country_name` - Country name (helps with matching)
- `latitude` - Decimal number
- `longitude` - Decimal number

### Example Excel Format

| name      | type      | city_district_name | province_name | country_name | latitude  | longitude |
|-----------|-----------|-------------------|---------------|--------------|-----------|-----------|
| Qibray    | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.367800 | 69.475600 |
| Sergeli   | shaharcha | Tashkent City     | Tashkent      | Uzbekistan   | 41.227800 | 69.223300 |
| Zangiota  | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.267800 | 69.167800 |
| Bekobod   | shahar    | Tashkent City     | Tashkent      | Uzbekistan   | 40.221700 | 69.195600 |
| Olmaliq   | shahar    | Tashkent City     | Tashkent      | Uzbekistan   | 40.843900 | 69.597800 |

### Notes
- Settlement names must be unique within a city/district
- `type` field is optional and can be used to categorize settlements (village, town, etc.)
- Common types: "qishloq" (village), "shaharcha" (town), "shahar" (city), "aul" (hamlet)

---

## 6. GeoNeighborhood (Neighborhoods/Mahallas)

### Required Columns
- `name` - Neighborhood/mahalla name
- `city_district_name` - Parent city/district name (must exist in GeoCityDistrict)

### Optional Columns
- `province_name` - Province name (helps with matching)
- `country_name` - Country name (helps with matching)
- `latitude` - Decimal number
- `longitude` - Decimal number

### Example Excel Format

| name                  | city_district_name | province_name | country_name | latitude  | longitude |
|-----------------------|-------------------|---------------|--------------|-----------|-----------|
| Chilanzar 1-kvartal   | Tashkent City     | Tashkent      | Uzbekistan   | 41.275200 | 69.203100 |
| Chilanzar 2-kvartal   | Tashkent City     | Tashkent      | Uzbekistan   | 41.278900 | 69.208900 |
| Yunusabad 1-kvartal   | Tashkent City     | Tashkent      | Uzbekistan   | 41.333300 | 69.288900 |
| Yunusabad 2-kvartal   | Tashkent City     | Tashkent      | Uzbekistan   | 41.336700 | 69.293300 |
| Mirzo-Ulugbek mahalla | Tashkent City     | Tashkent      | Uzbekistan   | 41.344400 | 69.334400 |

### Notes
- Neighborhood names must be unique within a city/district
- These are the smallest administrative units (mahallas in Uzbekistan)
- Typically represent residential areas or communities

---

## How to Use

### Step 1: Download Template
1. Navigate to the geo entity page (e.g., Countries, Provinces)
2. Click the **"📥 Download Template"** button
3. An Excel file with the correct format will be downloaded

### Step 2: Fill in Data
1. Open the downloaded template in Excel or Google Sheets
2. Fill in the required columns for each row
3. Add optional columns as needed
4. Save the file

### Step 3: Upload
1. Click the **"📤 Upload Excel"** button
2. Select your filled Excel file
3. Wait for the upload to complete
4. Review the results:
   - **Created**: Number of new records added
   - **Updated**: Number of existing records updated
   - **Errors**: Any rows that failed (with error messages)

### Step 4: Verify
1. Refresh the page to see the uploaded data
2. Check that all records were created/updated correctly
3. If there were errors, fix them in the Excel file and re-upload

---

## Common Errors and Solutions

### Error: "Missing required columns"
**Solution**: Make sure your Excel file has all required column headers exactly as specified.

### Error: "Country 'XYZ' not found"
**Solution**: The parent country doesn't exist. Upload countries first, or check the spelling.

### Error: "Province 'XYZ' not found in country 'ABC'"
**Solution**: The parent province doesn't exist in the specified country. Upload provinces first, or check the spelling.

### Error: "City district 'XYZ' not found"
**Solution**: The parent city/district doesn't exist. Upload city districts first, or check the spelling.

### Error: "Row X: Name is required"
**Solution**: The `name` column is empty for that row. Fill it in or remove the empty row.

---

## Tips for Successful Upload

1. **Upload in Order**: Always upload parent entities before child entities
   - Countries → Provinces → City Districts → (Administrative Areas / Settlements / Neighborhoods)

2. **Use Exact Names**: Parent entity names must match exactly (case-sensitive)
   - "Tashkent" ≠ "tashkent" ≠ "TASHKENT"

3. **Check for Duplicates**: Within the same parent, names must be unique
   - You can have "Central" district in multiple provinces, but not two "Central" districts in the same province

4. **Update Existing**: If you upload a record with the same name and parent, it will update the existing record
   - Useful for updating coordinates or other attributes

5. **Batch Processing**: Upload large datasets in batches (e.g., 100-500 rows at a time)
   - Easier to identify and fix errors

6. **Validate Data**: Before uploading, check that:
   - All required columns are filled
   - Parent entity names are correct
   - Coordinates are valid decimal numbers (if provided)

---

## Example: Complete Hierarchy Upload

### 1. Upload Countries (geo_countries_template.xlsx)

| name       | latitude  | longitude |
|------------|-----------|-----------|
| Uzbekistan | 41.377491 | 64.585262 |

### 2. Upload Provinces (geo_provinces_template.xlsx)

| name     | country_name | latitude  | longitude |
|----------|--------------|-----------|-----------|
| Tashkent | Uzbekistan   | 41.311151 | 69.279737 |
| Samarkand| Uzbekistan   | 39.654300 | 66.975500 |

### 3. Upload City Districts (geo_city_districts_template.xlsx)

| name          | province_name | country_name | latitude  | longitude |
|---------------|---------------|--------------|-----------|-----------|
| Tashkent City | Tashkent      | Uzbekistan   | 41.311151 | 69.279737 |
| Chirchiq      | Tashkent      | Uzbekistan   | 41.469200 | 69.582200 |

### 4. Upload Administrative Areas (geo_administrative_areas_template.xlsx)

| name       | city_district_name | province_name | country_name | latitude  | longitude |
|------------|-------------------|---------------|--------------|-----------|-----------|
| Chilanzar  | Tashkent City     | Tashkent      | Uzbekistan   | 41.275200 | 69.203100 |
| Yunusabad  | Tashkent City     | Tashkent      | Uzbekistan   | 41.333300 | 69.288900 |

### 5. Upload Settlements (geo_settlements_template.xlsx)

| name    | type      | city_district_name | province_name | country_name | latitude  | longitude |
|---------|-----------|-------------------|---------------|--------------|-----------|-----------|
| Qibray  | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.367800 | 69.475600 |
| Sergeli | shaharcha | Tashkent City     | Tashkent      | Uzbekistan   | 41.227800 | 69.223300 |

### 6. Upload Neighborhoods (geo_neighborhoods_template.xlsx)

| name                | city_district_name | province_name | country_name | latitude  | longitude |
|---------------------|-------------------|---------------|--------------|-----------|-----------|
| Chilanzar 1-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.275200 | 69.203100 |
| Chilanzar 2-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.278900 | 69.208900 |

---

## Database Relationships

### Model Relationships

```typescript
// GeoCountry (id: number)
// - No parent

// GeoProvince (id: number)
// - country_id → GeoCountry.id

// GeoCityDistrict (id: number)
// - province_id → GeoProvince.id

// GeoAdministrativeArea (id: number)
// - city_district_id → GeoCityDistrict.id

// GeoSettlement (id: number)
// - city_district_id → GeoCityDistrict.id
// - type: string (optional)

// GeoNeighborhood (id: number)
// - city_district_id → GeoCityDistrict.id
```

### Unique Constraints

- **GeoCountry**: `name` must be unique
- **GeoProvince**: `(country_id, name)` must be unique
- **GeoCityDistrict**: `(province_id, name)` must be unique
- **GeoAdministrativeArea**: `(city_district_id, name)` must be unique
- **GeoSettlement**: `(city_district_id, name)` must be unique
- **GeoNeighborhood**: `(city_district_id, name)` must be unique

---

## API Endpoints

All bulk upload endpoints require admin authentication.

```
POST /api/admin/geo/countries/bulk-upload
POST /api/admin/geo/provinces/bulk-upload
POST /api/admin/geo/city-districts/bulk-upload
POST /api/admin/geo/administrative-areas/bulk-upload
POST /api/admin/geo/settlements/bulk-upload
POST /api/admin/geo/neighborhoods/bulk-upload
```

### Request Format

```json
{
  "data": [
    {
      "name": "Example",
      "parent_name": "Parent Example",
      // ... other fields
    }
  ]
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "created": 10,
    "updated": 5,
    "errors": [
      "Row 3: Country 'XYZ' not found",
      "Row 7: Name is required"
    ]
  },
  "message": "Upload completed successfully"
}
```

---

## Troubleshooting

### Issue: Upload button is disabled
**Solution**: Wait for the page to finish loading. The button is disabled while data is loading.

### Issue: "Request timeout" error
**Solution**: Your file is too large. Split it into smaller batches (100-500 rows each).

### Issue: Many "not found" errors
**Solution**: Make sure parent entities are uploaded first. Check spelling and case sensitivity.

### Issue: Duplicate name errors
**Solution**: Check for duplicate names within the same parent entity. Names must be unique within their parent.

### Issue: Invalid coordinate format
**Solution**: Coordinates must be decimal numbers. Use format: `41.377491` (not `41° 22' 39"`)

---

## Best Practices

1. **Start Small**: Test with a few rows first before uploading large datasets
2. **Keep Backups**: Save your Excel files as backups before uploading
3. **Use Templates**: Always start with the downloaded template to ensure correct format
4. **Verify Parents**: Before uploading child entities, verify parent entities exist
5. **Check Results**: Always review the upload results and fix any errors
6. **Update Carefully**: When updating existing records, make sure you want to overwrite the data

---

## Support

If you encounter issues not covered in this guide:
1. Check the browser console for detailed error messages
2. Verify your Excel file format matches the examples
3. Ensure you're uploading entities in the correct order
4. Contact the development team with the error message and sample data

