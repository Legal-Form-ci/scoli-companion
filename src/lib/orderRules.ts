// Business rules for orders.
// Minimum order amount in FCFA — prevents single-cheap-item orders that
// cost more in delivery logistics than the product itself.
export const MIN_ORDER_AMOUNT = 2000;

export const formatMinOrderMessage = () =>
  `Montant minimum de commande : ${new Intl.NumberFormat("fr-FR").format(MIN_ORDER_AMOUNT)} FCFA. Ajoutez d'autres articles ou composez un kit.`;

export const isOrderAmountValid = (total: number) => total >= MIN_ORDER_AMOUNT;
