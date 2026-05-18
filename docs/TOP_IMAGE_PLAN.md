# Top Medicines Image Plan

Currently, the majority of medicines in the database use a default fallback image (`/assets/images/medicine-placeholder.svg`). This is a necessary consequence of bulk-importing scraped data that does not contain high-quality, normalized product photography.

To improve user trust and aesthetics, a phased manual/semi-automated image assignment workflow is required from the Admin Dashboard.

## Admin Workflow for Image Assignment

1. **Search Product**: Admin navigates to `Admin Dashboard > Products` and searches for a top-selling or highly-viewed product (e.g., Napa, Seclo, Maxpro).
2. **Upload Image**: Admin clicks "Edit", scrolls to the Image section, and clicks "Upload Image".
3. **Preview**: The uploaded image is previewed locally within the browser.
4. **Assign Image**: The admin clicks "Save", which uploads the image to the server (e.g., `public/assets/images/products/`) and updates the database entry for that product.
5. **Replace Fallback**: The database's `imageUrl` field is updated from the fallback path to the newly uploaded image path.
6. **Verify Product Card/Detail**: Admin navigates to the public store interface to verify the product card and detail page display the real image cleanly.

## Execution Target (Post Full Data Import)

- **Phase 1 (Immediate)**: Source and assign real, high-quality images for the **Top 100** most common/highest-selling products (e.g., Napa Extra, Seclo 20mg, Fexo 120mg).
- **Phase 2 (Gradual)**: Assign images to the **Top 500** products gradually as they are requested by users or identified by search logs.

## Best Practices
- Images should be compressed (JPEG or WebP).
- Background should preferably be white or transparent.
- Standard aspect ratio (e.g., 1:1 square) to prevent layout shifting on the frontend.
- Do not use images with watermarks from other pharmacies.
