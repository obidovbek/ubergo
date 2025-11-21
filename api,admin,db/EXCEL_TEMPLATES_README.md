# Excel Upload Templates for Geo Entities

## Quick Start

1. Click **"📥 Download Template"** button on any geo entity page
2. Fill in the Excel file with your data
3. Click **"📤 Upload Excel"** button and select your file
4. Review the upload results

---

## Template Files

### 1. Countries Template (`geo_countries_template.xlsx`)

**Required Columns:**
- `name` - Country name

**Optional Columns:**
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate

**Example Data:**

```
| name          | latitude   | longitude  |
|---------------|------------|------------|
| Uzbekistan    | 41.377491  | 64.585262  |
| Kazakhstan    | 48.019573  | 66.923684  |
| Kyrgyzstan    | 41.204380  | 74.766098  |
| Tajikistan    | 38.861034  | 71.276093  |
| Turkmenistan  | 38.969719  | 59.556278  |
```

---

### 2. Provinces Template (`geo_provinces_template.xlsx`)

**Required Columns:**
- `name` - Province/region name
- `country_name` - Parent country name (must exist)

**Optional Columns:**
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate

**Example Data:**

```
| name           | country_name | latitude   | longitude  |
|----------------|--------------|------------|------------|
| Tashkent       | Uzbekistan   | 41.311151  | 69.279737  |
| Samarkand      | Uzbekistan   | 39.654300  | 66.975500  |
| Bukhara        | Uzbekistan   | 39.775200  | 64.428600  |
| Fergana        | Uzbekistan   | 40.384400  | 71.784400  |
| Andijan        | Uzbekistan   | 40.782800  | 72.344400  |
| Namangan       | Uzbekistan   | 40.997800  | 71.672800  |
| Khorezm        | Uzbekistan   | 41.378900  | 60.365600  |
| Kashkadarya    | Uzbekistan   | 38.867800  | 65.788900  |
| Surkhandarya   | Uzbekistan   | 37.933300  | 67.566700  |
| Jizzakh        | Uzbekistan   | 40.115600  | 67.842200  |
| Syrdarya       | Uzbekistan   | 40.383300  | 68.716700  |
| Navoiy         | Uzbekistan   | 42.461100  | 64.616700  |
| Karakalpakstan | Uzbekistan   | 43.804400  | 59.445600  |
```

---

### 3. City Districts Template (`geo_city_districts_template.xlsx`)

**Required Columns:**
- `name` - City or district name
- `province_name` - Parent province name (must exist)
- `country_name` - Country name (for context)

**Optional Columns:**
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate

**Example Data:**

```
| name           | province_name | country_name | latitude   | longitude  |
|----------------|---------------|--------------|------------|------------|
| Tashkent City  | Tashkent      | Uzbekistan   | 41.311151  | 69.279737  |
| Chirchiq       | Tashkent      | Uzbekistan   | 41.469200  | 69.582200  |
| Angren         | Tashkent      | Uzbekistan   | 41.016700  | 70.143300  |
| Olmaliq        | Tashkent      | Uzbekistan   | 40.843900  | 69.597800  |
| Bekobod        | Tashkent      | Uzbekistan   | 40.221700  | 69.195600  |
| Samarkand City | Samarkand     | Uzbekistan   | 39.654300  | 66.975500  |
| Kattakurgan    | Samarkand     | Uzbekistan   | 39.890000  | 66.256700  |
| Bukhara City   | Bukhara       | Uzbekistan   | 39.775200  | 64.428600  |
| Fergana City   | Fergana       | Uzbekistan   | 40.384400  | 71.784400  |
| Andijan City   | Andijan       | Uzbekistan   | 40.782800  | 72.344400  |
```

---

### 4. Administrative Areas Template (`geo_administrative_areas_template.xlsx`)

**Required Columns:**
- `name` - Administrative area name
- `city_district_name` - Parent city/district name (must exist)

**Optional Columns (for context):**
- `province_name` - Province name
- `country_name` - Country name
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate

**Example Data:**

```
| name           | city_district_name | province_name | country_name | latitude   | longitude  |
|----------------|-------------------|---------------|--------------|------------|------------|
| Chilanzar      | Tashkent City     | Tashkent      | Uzbekistan   | 41.275200  | 69.203100  |
| Yunusabad      | Tashkent City     | Tashkent      | Uzbekistan   | 41.333300  | 69.288900  |
| Mirzo-Ulugbek  | Tashkent City     | Tashkent      | Uzbekistan   | 41.344400  | 69.334400  |
| Yakkasaray     | Tashkent City     | Tashkent      | Uzbekistan   | 41.288900  | 69.244400  |
| Shaykhontohur  | Tashkent City     | Tashkent      | Uzbekistan   | 41.327800  | 69.240000  |
| Bektemir       | Tashkent City     | Tashkent      | Uzbekistan   | 41.211100  | 69.333300  |
| Sergeli        | Tashkent City     | Tashkent      | Uzbekistan   | 41.227800  | 69.223300  |
| Uchtepa        | Tashkent City     | Tashkent      | Uzbekistan   | 41.284400  | 69.176700  |
| Yashnobod      | Tashkent City     | Tashkent      | Uzbekistan   | 41.283300  | 69.323300  |
| Olmazor        | Tashkent City     | Tashkent      | Uzbekistan   | 41.344400  | 69.213300  |
| Mirobod        | Tashkent City     | Tashkent      | Uzbekistan   | 41.311100  | 69.283300  |
```

---

### 5. Settlements Template (`geo_settlements_template.xlsx`)

**Required Columns:**
- `name` - Settlement name
- `city_district_name` - Parent city/district name (must exist)

**Optional Columns:**
- `type` - Settlement type (qishloq, shaharcha, shahar, aul, etc.)
- `province_name` - Province name (for context)
- `country_name` - Country name (for context)
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate

**Example Data:**

```
| name       | type      | city_district_name | province_name | country_name | latitude   | longitude  |
|------------|-----------|-------------------|---------------|--------------|------------|------------|
| Qibray     | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.367800  | 69.475600  |
| Sergeli    | shaharcha | Tashkent City     | Tashkent      | Uzbekistan   | 41.227800  | 69.223300  |
| Zangiota   | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.267800  | 69.167800  |
| Bekobod    | shahar    | Tashkent City     | Tashkent      | Uzbekistan   | 40.221700  | 69.195600  |
| Olmaliq    | shahar    | Tashkent City     | Tashkent      | Uzbekistan   | 40.843900  | 69.597800  |
| Chinoz     | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 40.933300  | 68.766700  |
| Parkent    | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.293300  | 69.670000  |
| Pskent     | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.366700  | 69.733300  |
```

**Settlement Types:**
- `qishloq` - Village
- `shaharcha` - Town
- `shahar` - City
- `aul` - Hamlet
- `kent` - Settlement

---

### 6. Neighborhoods Template (`geo_neighborhoods_template.xlsx`)

**Required Columns:**
- `name` - Neighborhood/mahalla name
- `city_district_name` - Parent city/district name (must exist)

**Optional Columns:**
- `province_name` - Province name (for context)
- `country_name` - Country name (for context)
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate

**Example Data:**

```
| name                     | city_district_name | province_name | country_name | latitude   | longitude  |
|--------------------------|-------------------|---------------|--------------|------------|------------|
| Chilanzar 1-kvartal      | Tashkent City     | Tashkent      | Uzbekistan   | 41.275200  | 69.203100  |
| Chilanzar 2-kvartal      | Tashkent City     | Tashkent      | Uzbekistan   | 41.278900  | 69.208900  |
| Chilanzar 3-kvartal      | Tashkent City     | Tashkent      | Uzbekistan   | 41.282200  | 69.214400  |
| Yunusabad 1-kvartal      | Tashkent City     | Tashkent      | Uzbekistan   | 41.333300  | 69.288900  |
| Yunusabad 2-kvartal      | Tashkent City     | Tashkent      | Uzbekistan   | 41.336700  | 69.293300  |
| Yunusabad 3-kvartal      | Tashkent City     | Tashkent      | Uzbekistan   | 41.340000  | 69.297800  |
| Mirzo-Ulugbek mahalla    | Tashkent City     | Tashkent      | Uzbekistan   | 41.344400  | 69.334400  |
| Yakkasaray mahalla       | Tashkent City     | Tashkent      | Uzbekistan   | 41.288900  | 69.244400  |
| Shaykhontohur mahalla    | Tashkent City     | Tashkent      | Uzbekistan   | 41.327800  | 69.240000  |
| Bektemir mahalla         | Tashkent City     | Tashkent      | Uzbekistan   | 41.211100  | 69.333300  |
```

---

## Relationship Diagram

```
┌─────────────────┐
│   GeoCountry    │  (Level 1)
│   - id          │
│   - name        │
└────────┬────────┘
         │
         │ country_id
         ▼
┌─────────────────┐
│  GeoProvince    │  (Level 2)
│   - id          │
│   - name        │
│   - country_id  │
└────────┬────────┘
         │
         │ province_id
         ▼
┌─────────────────┐
│GeoCityDistrict  │  (Level 3)
│   - id          │
│   - name        │
│   - province_id │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         │ city_district_id│ city_district_id│ city_district_id
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│GeoAdmin Area │  │GeoSettlement │  │GeoNeighborhood│ (Level 4)
│   - id       │  │   - id       │  │   - id        │
│   - name     │  │   - name     │  │   - name      │
│   - city_... │  │   - type     │  │   - city_...  │
└──────────────┘  └──────────────┘  └───────────────┘
```

---

## Field Descriptions

### All Entities

| Field      | Type    | Required | Description                                    |
|------------|---------|----------|------------------------------------------------|
| name       | string  | Yes      | Entity name (unique within parent)             |
| latitude   | decimal | No       | Latitude coordinate (e.g., 41.377491)          |
| longitude  | decimal | No       | Longitude coordinate (e.g., 64.585262)         |

### Province-Specific

| Field        | Type   | Required | Description                          |
|--------------|--------|----------|--------------------------------------|
| country_name | string | Yes      | Parent country name (must exist)     |

### City District-Specific

| Field         | Type   | Required | Description                          |
|---------------|--------|----------|--------------------------------------|
| province_name | string | Yes      | Parent province name (must exist)    |
| country_name  | string | Yes      | Country name (for context)           |

### Administrative Area / Settlement / Neighborhood-Specific

| Field              | Type   | Required | Description                          |
|--------------------|--------|----------|--------------------------------------|
| city_district_name | string | Yes      | Parent city/district (must exist)    |
| province_name      | string | No       | Province name (helps with matching)  |
| country_name       | string | No       | Country name (helps with matching)   |

### Settlement-Specific

| Field | Type   | Required | Description                                      |
|-------|--------|----------|--------------------------------------------------|
| type  | string | No       | Settlement type (qishloq, shaharcha, shahar, etc)|

---

## Complete Example: Uploading Tashkent Region Data

### Step 1: Upload Country

**File: `uzbekistan_country.xlsx`**

| name       | latitude  | longitude |
|------------|-----------|-----------|
| Uzbekistan | 41.377491 | 64.585262 |

### Step 2: Upload Province

**File: `tashkent_province.xlsx`**

| name     | country_name | latitude  | longitude |
|----------|--------------|-----------|-----------|
| Tashkent | Uzbekistan   | 41.311151 | 69.279737 |

### Step 3: Upload City Districts

**File: `tashkent_districts.xlsx`**

| name          | province_name | country_name | latitude  | longitude |
|---------------|---------------|--------------|-----------|-----------|
| Tashkent City | Tashkent      | Uzbekistan   | 41.311151 | 69.279737 |
| Chirchiq      | Tashkent      | Uzbekistan   | 41.469200 | 69.582200 |
| Angren        | Tashkent      | Uzbekistan   | 41.016700 | 70.143300 |
| Olmaliq       | Tashkent      | Uzbekistan   | 40.843900 | 69.597800 |
| Bekobod       | Tashkent      | Uzbekistan   | 40.221700  | 69.195600  |

### Step 4: Upload Administrative Areas

**File: `tashkent_city_districts.xlsx`**

| name          | city_district_name | province_name | country_name | latitude  | longitude |
|---------------|-------------------|---------------|--------------|-----------|-----------|
| Chilanzar     | Tashkent City     | Tashkent      | Uzbekistan   | 41.275200 | 69.203100 |
| Yunusabad     | Tashkent City     | Tashkent      | Uzbekistan   | 41.333300 | 69.288900 |
| Mirzo-Ulugbek | Tashkent City     | Tashkent      | Uzbekistan   | 41.344400 | 69.334400 |
| Yakkasaray    | Tashkent City     | Tashkent      | Uzbekistan   | 41.288900 | 69.244400 |
| Shaykhontohur | Tashkent City     | Tashkent      | Uzbekistan   | 41.327800 | 69.240000 |
| Bektemir      | Tashkent City     | Tashkent      | Uzbekistan   | 41.211100 | 69.333300 |
| Sergeli       | Tashkent City     | Tashkent      | Uzbekistan   | 41.227800 | 69.223300 |
| Uchtepa       | Tashkent City     | Tashkent      | Uzbekistan   | 41.284400 | 69.176700 |
| Yashnobod     | Tashkent City     | Tashkent      | Uzbekistan   | 41.283300 | 69.323300 |
| Olmazor       | Tashkent City     | Tashkent      | Uzbekistan   | 41.344400 | 69.213300 |
| Mirobod       | Tashkent City     | Tashkent      | Uzbekistan   | 41.311100 | 69.283300 |

### Step 5: Upload Settlements

**File: `tashkent_settlements.xlsx`**

| name     | type      | city_district_name | province_name | country_name | latitude  | longitude |
|----------|-----------|-------------------|---------------|--------------|-----------|-----------|
| Qibray   | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.367800 | 69.475600 |
| Sergeli  | shaharcha | Tashkent City     | Tashkent      | Uzbekistan   | 41.227800 | 69.223300 |
| Zangiota | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.267800 | 69.167800 |
| Chinoz   | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 40.933300 | 68.766700 |
| Parkent  | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.293300 | 69.670000 |
| Pskent   | qishloq   | Tashkent City     | Tashkent      | Uzbekistan   | 41.366700 | 69.733300 |

### Step 6: Upload Neighborhoods

**File: `chilanzar_neighborhoods.xlsx`**

| name                | city_district_name | province_name | country_name | latitude  | longitude |
|---------------------|-------------------|---------------|--------------|-----------|-----------|
| Chilanzar 1-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.275200 | 69.203100 |
| Chilanzar 2-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.278900 | 69.208900 |
| Chilanzar 3-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.282200 | 69.214400 |
| Chilanzar 4-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.285600 | 69.219900 |
| Chilanzar 5-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.289000 | 69.225400 |
| Chilanzar 6-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.292200 | 69.230900 |
| Chilanzar 7-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.295600 | 69.236400 |
| Chilanzar 8-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.299000 | 69.241900 |
| Chilanzar 9-kvartal | Tashkent City     | Tashkent      | Uzbekistan   | 41.302200 | 69.247400 |

---

## Important Notes

### Hierarchical Dependencies

**⚠️ CRITICAL**: Geo entities are hierarchical. You MUST upload in this order:

1. Countries (no dependencies)
2. Provinces (depends on Countries)
3. City Districts (depends on Provinces)
4. Administrative Areas / Settlements / Neighborhoods (depend on City Districts)

### Name Matching

- Parent entity names are **case-sensitive**
- Names must match **exactly** as they appear in the database
- Extra spaces will cause matching failures
- Use the exact names from the parent entity list

### Unique Constraints

Within the same parent entity, names must be unique:
- ✅ "Central" in Province A and "Central" in Province B (OK - different parents)
- ❌ "Central" twice in Province A (ERROR - same parent)

### Update vs Create

- If a record with the same `name` and parent exists, it will be **updated**
- If no matching record exists, a new one will be **created**
- This allows you to re-upload the same file to update coordinates or other attributes

### Coordinates

- Latitude and longitude are optional but recommended
- Format: Decimal degrees (e.g., `41.377491`, not `41° 22' 39"`)
- Latitude range: -90 to 90
- Longitude range: -180 to 180

---

## Troubleshooting

### "Country 'XYZ' not found"
- Make sure the country exists in the database
- Check spelling and case (must match exactly)
- Upload countries first if they don't exist

### "Province 'XYZ' not found in country 'ABC'"
- The province doesn't exist in the specified country
- Check spelling of both province and country names
- Upload provinces first if they don't exist

### "City district 'XYZ' not found"
- The city/district doesn't exist
- Check spelling
- Upload city districts first if they don't exist
- If you provided province_name and country_name, make sure they match

### "Missing required columns"
- Your Excel file doesn't have all required column headers
- Download the template and use it as a starting point
- Column names are case-sensitive

### "Row X: Name is required"
- The `name` column is empty for that row
- Fill in the name or remove the empty row

---

## Performance Tips

1. **Batch Size**: Upload 100-500 rows at a time for best performance
2. **Network**: Large uploads may take time; don't close the browser
3. **Errors**: If many rows fail, fix errors and re-upload (existing records will be updated)
4. **Testing**: Test with a small sample (5-10 rows) before uploading large datasets

---

## Support

For issues or questions:
1. Check this guide first
2. Review the `EXCEL_UPLOAD_GUIDE.md` for detailed technical information
3. Check browser console for detailed error messages
4. Contact the development team with:
   - The Excel file you're trying to upload
   - The error message you received
   - Screenshots of the issue

