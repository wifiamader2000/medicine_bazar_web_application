export function unwrapData(response, fallback = null) {
  return response?.data?.data ?? response?.data ?? fallback;
}

export function formatPrice(value) {
  const amount = Number(value || 0);
  return `BDT ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function productPrice(product) {
  return product?.sellingPrice ?? product?.price ?? product?.mrp ?? 0;
}

export function productImage(product) {
  return product?.imageUrl || product?.image || product?.images?.[0] || '/favicon.svg';
}

export function productRouteId(product) {
  return product?.slug || product?.id || product?._id;
}

export function productRequiresPrescription(product) {
  return Boolean(product?.prescriptionRequired || product?.hasPrescription);
}

export function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem('cart') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addProductToCart(product, quantity = 1) {
  const productId = product?.id || product?._id;
  if (!productId) return false;

  const cart = readCart();
  const nextCart = cart.some((item) => item.productId === productId)
    ? cart.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item)
    : [...cart, { productId, quantity }];

  localStorage.setItem('cart', JSON.stringify(nextCart));
  return true;
}
