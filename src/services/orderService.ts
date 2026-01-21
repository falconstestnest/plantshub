/**
 * Create a new draft order.
 * - status: 'DRAFT'
 * - buyerOrganizationId: provided or from env fallback or placeholder
 *
 * Returns the created Order record.
 */
export async function createDraftOrder(buyerOrganizationId?: string) {
  // TEMP: buyerOrganizationId is injected until auth is enforced (Module 5)
  const buyerId =
    buyerOrganizationId ||
    process.env.SEED_BUYER_ORG_ID ||
    '00000000-0000-0000-0000-000000000000';

  // Note: do not modify Prisma schema; this call assumes the Order model and fields exist.
  const order = await prisma.order.create({
    data: {
      status: 'DRAFT',
      buyerOrganizationId: buyerId,
    },
  });

  return order;
}

/**
 * Add an item to an existing draft order.
 *
 * Rules enforced:
 * - order must exist
 * - order.status must be 'DRAFT'
 * - quantity must be > 0
 * - product must exist
 *
 * Returns the created OrderItem record.
 *
 * Errors are thrown as objects: { status: number, message: string } for the route to map to HTTP codes.
 */
export async function addItemToDraftOrder(
  orderId: string,
  productId: string,
  quantity: number
) {
  if (!productId || typeof productId !== 'string') {
    throw { status: 400, message: 'productId is required and must be a string' };
  }

  if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
    throw { status: 400, message: 'quantity must be a number greater than 0' };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw { status: 404, message: 'Order not found' };
  }

  if (order.status !== 'DRAFT') {
    throw { status: 400, message: 'Items can only be added to orders with status DRAFT' };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw { status: 400, message: 'Product not found' };
  }

  // Create order item. No pricing or inventory checks per spec.
  const orderItem = await prisma.orderItem.create({
    data: {
      orderId,
      productId,
      quantity,
    },
  });

  return orderItem;
}