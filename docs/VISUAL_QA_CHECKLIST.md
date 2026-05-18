# Visual QA Checklist

Since the full dataset is currently pending, use this checklist to perform visual Quality Assurance (QA) once the browser checks can be performed. Do not mark these as "passed" unless they have been actively checked in a web browser.

## 1. Homepage
- [ ] Top banners load correctly.
- [ ] Featured categories section is properly populated.
- [ ] Featured brands section is properly populated.
- [ ] Trending medicines section shows products (prices, fallback images, add-to-cart buttons).
- [ ] Search bar is visible and clickable.
- [ ] Layout is responsive on desktop and mobile.

## 2. Shop Page
- [ ] Products load properly with pagination.
- [ ] Sidebar filters work (Category, Brand, Price Range, In Stock, Prescription Required).
- [ ] Sorting functionality works.
- [ ] Clear Filters button works.
- [ ] "No results found" state works correctly when applying overly strict filters.

## 3. Search
- [ ] Auto-suggestions appear when typing.
- [ ] Suggestion dropdown contains products, generics, brands, and indications.
- [ ] Search results page renders correctly and displays relevant products for generic/indication searches.

## 4. Product Detail
- [ ] Product Name, Generic, Brand, and Strength display properly.
- [ ] Pricing and Add to Cart functionality works.
- [ ] If available, Uses, Indications, and Side Effects are formatted properly.
- [ ] Fallback image renders nicely if no real image exists.
- [ ] Related products appear.

## 5. Checkout
- [ ] Cart drawer / cart page shows added items correctly.
- [ ] Order summary calculates subtotal, delivery fee, and total accurately.
- [ ] Checkout form validates correctly (name, phone, address).
- [ ] Successful checkout redirects to order confirmation page.

## 6. Payment Proof Upload
- [ ] File input allows uploading images.
- [ ] Uploaded image previews correctly.
- [ ] Submitting the proof works and shows a success message.

## 7. POS (Point of Sale)
- [ ] Accessible by Admin/Staff.
- [ ] Fast search works.
- [ ] Adding to bill and calculating change works.
- [ ] Print receipt function triggers correctly.

## 8. Prescription Upload
- [ ] Upload UI works on homepage and checkout.
- [ ] File selection shows preview.
- [ ] Submission creates a prescription order in the admin panel.

## 9. Admin Dashboard
- [ ] Dashboard stats are accurate (Total Orders, Total Sales, Total Users).
- [ ] Recent Orders list populates correctly.
- [ ] Navigation menu items work (Orders, Products, Categories, Users, Settings).

## 10. Reports
- [ ] Sales report displays correctly.
- [ ] Inventory report shows low stock items.
- [ ] Date filtering functionality works.

## 11. Mobile Layout
- [ ] Hamburger menu works.
- [ ] Bottom navigation (if applicable) works.
- [ ] Product grids collapse to 2 columns (or 1) seamlessly.
- [ ] Add to cart popups/toasts show up correctly without breaking width.
