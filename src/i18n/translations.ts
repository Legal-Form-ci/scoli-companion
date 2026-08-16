export type Language = "fr" | "en" | "de" | "es";

export interface Translations {
  nav: {
    easyClass: string;
    secondary: string;
    secondaryDesc: string;
    university: string;
    universityDesc: string;
    easyScolaire: string;
    about: string;
    contact: string;
    login: string;
    signup: string;
    logout: string;
    cart: string;
    myAccount: string;
    myOrders: string;
    wishlist: string;
    admin: string;
  };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    cta: string;
    demo: string;
    secondaryTitle: string;
    secondaryDesc: string;
    universityTitle: string;
    universityDesc: string;
    shopTitle: string;
    shopDesc: string;
  };
  spaces: {
    title: string;
    subtitle: string;
    secondary: {
      title: string;
      description: string;
      features: string[];
      cta: string;
    };
    university: {
      title: string;
      description: string;
      features: string[];
      cta: string;
    };
    shop: {
      title: string;
      description: string;
      features: string[];
      cta: string;
    };
  };
  features: {
    title: string;
    subtitle: string;
    items: {
      resources: { title: string; description: string };
      payment: { title: string; description: string };
      access: { title: string; description: string };
      support: { title: string; description: string };
      certificates: { title: string; description: string };
      updates: { title: string; description: string };
    };
  };
  payment: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    benefits: string[];
    cta: string;
    amountLabel: string;
    secure: string;
  };
  stats: {
    students: string;
    resources: string;
    schools: string;
    satisfaction: string;
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
    trustedBy: string;
  };
  footer: {
    description: string;
    quickLinks: string;
    resources: string;
    legal: string;
    contact: string;
    home: string;
    shop: string;
    secondary: string;
    university: string;
    blog: string;
    faq: string;
    tutorials: string;
    terms: string;
    privacy: string;
    cookies: string;
    address: string;
    phone: string;
    email: string;
    copyright: string;
    madeWith: string;
  };
  auth: {
    loginTitle: string;
    signupTitle: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone: string;
    rememberMe: string;
    forgotPassword: string;
    noAccount: string;
    hasAccount: string;
    loginButton: string;
    signupButton: string;
    orContinueWith: string;
    termsAgree: string;
    terms: string;
    and: string;
    privacy: string;
  };
  shop: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    categories: string;
    allCategories: string;
    sortBy: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortPopular: string;
    addToCart: string;
    addedToCart: string;
    viewCart: string;
    checkout: string;
    emptyCart: string;
    continueShopping: string;
    subtotal: string;
    shipping: string;
    total: string;
    proceedCheckout: string;
    inStock: string;
    outOfStock: string;
    quantity: string;
    remove: string;
    productDetails: string;
    relatedProducts: string;
    reviews: string;
    writeReview: string;
    noReviews: string;
    freeShipping: string;
    sale: string;
    new: string;
    featured: string;
    priceLabel: string;
    originalPrice: string;
    discount: string;
  };
  resources: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    subjects: string;
    allSubjects: string;
    levels: string;
    allLevels: string;
    download: string;
    downloads: string;
    free: string;
    premium: string;
    preview: string;
    fileType: string;
    fileSize: string;
    author: string;
    publishedOn: string;
    noResults: string;
  };
  checkout: {
    title: string;
    billingInfo: string;
    shippingInfo: string;
    paymentMethod: string;
    orderSummary: string;
    placeOrder: string;
    orderSuccess: string;
    orderSuccessMessage: string;
    orderNumber: string;
    trackOrder: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    sameAsBilling: string;
    paymentNote: string;
    selectPayment: string;
    orangeMoney: string;
    mtnMoney: string;
    moovMoney: string;
    wave: string;
  };
  account: {
    title: string;
    profile: string;
    orders: string;
    wishlist: string;
    settings: string;
    editProfile: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    orderHistory: string;
    noOrders: string;
    orderDate: string;
    orderStatus: string;
    orderTotal: string;
    viewDetails: string;
    statusPending: string;
    statusConfirmed: string;
    statusShipped: string;
    statusDelivered: string;
    statusCancelled: string;
    emptyWishlist: string;
    browseProducts: string;
    notifications: string;
    language: string;
    saveChanges: string;
  };
  contact: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    send: string;
    success: string;
    successMessage: string;
    info: string;
  };
  about: {
    title: string;
    subtitle: string;
    mission: string;
    missionText: string;
    vision: string;
    visionText: string;
    values: string;
    team: string;
    partners: string;
  };
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    filter: string;
    clear: string;
    apply: string;
    close: string;
    viewAll: string;
    seeMore: string;
    learnMore: string;
    readMore: string;
    showLess: string;
    noResults: string;
    tryAgain: string;
    required: string;
    optional: string;
    currency: string;
    yes: string;
    no: string;
    slogan: string;
  };
}

export const translations: Record<Language, Translations> = {
  fr: {
    nav: {
      easyClass: "Scoly",
      secondary: "Actualités",
      secondaryDesc: "Actualités scolaires et bureautiques",
      university: "Actualités",
      universityDesc: "Actualités scolaires et bureautiques",
      easyScolaire: "Boutique",
      about: "À propos",
      contact: "Contact",
      login: "Connexion",
      signup: "S'inscrire",
      logout: "Déconnexion",
      cart: "Panier",
      myAccount: "Mon compte",
      myOrders: "Mes commandes",
      wishlist: "Favoris",
      admin: "Administration",
    },
    hero: {
      badge: "Votre partenaire pour la réussite scolaire",
      title1: "Fournitures scolaires",
      title2: "et bureautiques en un seul clic",
      subtitle: "Scoly vous accompagne dans votre parcours éducatif avec des fournitures de qualité, livrées gratuitement partout en Côte d'Ivoire.",
      cta: "Découvrir nos produits",
      demo: "Voir les actualités",
      secondaryTitle: "Actualités Scoly",
      secondaryDesc: "Actualités scolaires et bureautiques",
      universityTitle: "Actualités Scoly",
      universityDesc: "Actualités scolaires et bureautiques",
      shopTitle: "Boutique Scoly",
      shopDesc: "Livres et fournitures scolaires",
    },
    spaces: {
      title: "Tout pour votre réussite scolaire et professionnelle",
      subtitle: "Scoly vous offre des produits de qualité scolaires et bureautiques pour accompagner votre parcours éducatif et professionnel.",
      secondary: {
        title: "Boutique Scoly",
        description: "Retrouvez toutes vos fournitures scolaires et bureautiques organisées par niveau : Primaire, Secondaire, Université et Bureau.",
        features: [
          "Catalogue complet scolaire et bureautique",
          "Fournitures de qualité",
          "Prix compétitifs",
          "Livraison gratuite",
        ],
        cta: "Découvrir notre boutique",
      },
      university: {
        title: "Actualités Scoly",
        description: "Un espace dédié aux actualités scolaires et bureautiques. Découvrez les taux de réussite, résultats d'examens et informations utiles.",
        features: [
          "Taux de réussite scolaire",
          "Résultats d'examens",
          "Actualités éducatives et professionnelles",
          "Informations officielles",
        ],
        cta: "Découvrir les actualités",
      },
      shop: {
        title: "Boutique Scoly",
        description: "Tous vos livres et fournitures scolaires et bureautiques en un seul endroit. Livraison gratuite partout en Côte d'Ivoire.",
        features: [
          "Livres scolaires officiels",
          "Fournitures de qualité",
          "Prix compétitifs",
          "Livraison gratuite",
        ],
        cta: "Visiter la boutique",
      },
    },
    features: {
      title: "Pourquoi choisir Scoly ?",
      subtitle: "Une plateforme complète conçue pour répondre à tous vos besoins éducatifs et professionnels.",
      items: {
        resources: { title: "Ressources de qualité", description: "Des milliers de documents vérifiés et validés par des professionnels de l'éducation." },
        payment: { title: "Paiement sécurisé", description: "Payez facilement avec Mobile Money (Orange, MTN, Moov, Wave)." },
        access: { title: "Accès illimité", description: "Accédez à vos ressources 24h/24, 7j/7 depuis n'importe quel appareil." },
        support: { title: "Support réactif", description: "Une équipe dédiée pour répondre à toutes vos questions." },
        certificates: { title: "Certificats", description: "Obtenez des certificats de réussite pour valoriser votre parcours." },
        updates: { title: "Mises à jour régulières", description: "De nouvelles ressources ajoutées chaque semaine." },
      },
    },
    payment: {
      badge: "Paiement sécurisé",
      title: "Payez facilement avec",
      titleHighlight: "Mobile Money",
      subtitle: "Effectuez vos achats en toute sécurité avec les solutions de paiement mobile les plus populaires de Côte d'Ivoire.",
      benefits: [
        "Transactions sécurisées et cryptées",
        "Confirmation instantanée par SMS",
        "Aucuns frais cachés",
        "Support client 24/7",
      ],
      cta: "Découvrir Scoly",
      amountLabel: "Montant à payer",
      secure: "Paiement 100% sécurisé",
    },
    stats: { students: "Étudiants actifs", resources: "Ressources disponibles", schools: "Établissements partenaires", satisfaction: "Taux de satisfaction" },
    cta: {
      title: "Prêt à transformer votre apprentissage ?",
      subtitle: "Rejoignez des milliers d'étudiants qui ont déjà choisi Scoly pour réussir.",
      button: "Créer mon compte gratuit",
      trustedBy: "Ils nous font confiance",
    },
    footer: {
      description: "La plateforme de référence en Côte d'Ivoire pour les fournitures scolaires et bureautiques.",
      quickLinks: "Liens rapides", resources: "Ressources", legal: "Mentions légales", contact: "Contact",
      home: "Accueil", shop: "Boutique", secondary: "Secondaire", university: "Université",
      blog: "Blog", faq: "FAQ", tutorials: "Tutoriels", terms: "Conditions d'utilisation",
      privacy: "Politique de confidentialité", cookies: "Cookies",
      address: "Abidjan, Côte d'Ivoire", phone: "+225 07 02 58 44 57", email: "contact@scoly.ci",
      copyright: "Tous droits réservés.", madeWith: "Fait avec ❤️ en Côte d'Ivoire",
    },
    auth: {
      loginTitle: "Connexion", signupTitle: "Créer un compte", email: "Adresse email",
      password: "Mot de passe", confirmPassword: "Confirmer le mot de passe", firstName: "Prénom",
      lastName: "Nom", phone: "Téléphone", rememberMe: "Se souvenir de moi",
      forgotPassword: "Mot de passe oublié ?", noAccount: "Pas encore de compte ?",
      hasAccount: "Déjà un compte ?", loginButton: "Se connecter", signupButton: "S'inscrire",
      orContinueWith: "Ou continuer avec", termsAgree: "J'accepte les",
      terms: "conditions d'utilisation", and: "et la", privacy: "politique de confidentialité",
    },
    shop: {
      title: "Boutique Scoly",
      subtitle: "Tous vos livres et fournitures scolaires et bureautiques en un clic",
      searchPlaceholder: "Rechercher un produit...", categories: "Catégories", allCategories: "Toutes les catégories",
      sortBy: "Trier par", sortNewest: "Plus récent", sortPriceAsc: "Prix croissant",
      sortPriceDesc: "Prix décroissant", sortPopular: "Popularité",
      addToCart: "Ajouter au panier", addedToCart: "Ajouté au panier",
      viewCart: "Voir le panier", checkout: "Passer commande", emptyCart: "Votre panier est vide",
      continueShopping: "Continuer les achats", subtotal: "Sous-total", shipping: "Livraison",
      total: "Total", proceedCheckout: "Procéder au paiement", inStock: "En stock",
      outOfStock: "Rupture de stock", quantity: "Quantité", remove: "Supprimer",
      productDetails: "Détails du produit", relatedProducts: "Produits similaires",
      reviews: "Avis", writeReview: "Écrire un avis", noReviews: "Aucun avis pour le moment",
      freeShipping: "Livraison gratuite", sale: "Promo", new: "Nouveau", featured: "En vedette",
      priceLabel: "Prix", originalPrice: "Prix original", discount: "Réduction",
    },
    resources: {
      title: "Ressources pédagogiques", subtitle: "Découvrez notre collection de cours, exercices et documents",
      searchPlaceholder: "Rechercher une ressource...", subjects: "Matières", allSubjects: "Toutes les matières",
      levels: "Niveaux", allLevels: "Tous les niveaux", download: "Télécharger", downloads: "téléchargements",
      free: "Gratuit", premium: "Premium", preview: "Aperçu", fileType: "Type de fichier",
      fileSize: "Taille", author: "Auteur", publishedOn: "Publié le", noResults: "Aucune ressource trouvée",
    },
    checkout: {
      title: "Paiement", billingInfo: "Informations de facturation", shippingInfo: "Informations de livraison",
      paymentMethod: "Mode de paiement", orderSummary: "Résumé de la commande", placeOrder: "Passer la commande",
      orderSuccess: "Commande confirmée !", orderSuccessMessage: "Votre commande a été enregistrée avec succès. Vous recevrez une confirmation par SMS.",
      orderNumber: "Numéro de commande", trackOrder: "Suivre ma commande", address: "Adresse",
      city: "Ville", postalCode: "Code postal", country: "Pays",
      sameAsBilling: "Même adresse que la facturation", paymentNote: "Vous recevrez un SMS pour confirmer le paiement",
      selectPayment: "Sélectionner un mode de paiement", orangeMoney: "Orange Money", mtnMoney: "MTN Mobile Money",
      moovMoney: "Moov Money", wave: "Wave",
    },
    account: {
      title: "Mon compte", profile: "Profil", orders: "Commandes", wishlist: "Favoris",
      settings: "Paramètres", editProfile: "Modifier le profil", changePassword: "Changer le mot de passe",
      currentPassword: "Mot de passe actuel", newPassword: "Nouveau mot de passe",
      orderHistory: "Historique des commandes", noOrders: "Vous n'avez pas encore de commandes",
      orderDate: "Date", orderStatus: "Statut", orderTotal: "Total", viewDetails: "Voir les détails",
      statusPending: "En attente", statusConfirmed: "Confirmée", statusShipped: "Expédiée",
      statusDelivered: "Livrée", statusCancelled: "Annulée", emptyWishlist: "Votre liste de favoris est vide",
      browseProducts: "Parcourir les produits", notifications: "Notifications",
      language: "Langue", saveChanges: "Enregistrer les modifications",
    },
    contact: {
      title: "Contactez-nous", subtitle: "Une question ? N'hésitez pas à nous contacter",
      name: "Nom complet", email: "Email", subject: "Sujet", message: "Message",
      send: "Envoyer", success: "Message envoyé !",
      successMessage: "Nous vous répondrons dans les plus brefs délais.", info: "Nos coordonnées",
    },
    about: {
      title: "À propos de Scoly",
      subtitle: "Notre mission est de faciliter l'accès aux fournitures scolaires et bureautiques",
      mission: "Notre mission",
      missionText: "Offrir aux familles ivoiriennes un accès facile à des fournitures scolaires et bureautiques de qualité, avec une livraison gratuite et un service client exemplaire.",
      vision: "Notre vision",
      visionText: "Devenir la référence pour les fournitures scolaires et bureautiques en Côte d'Ivoire et en Afrique de l'Ouest.",
      values: "Nos valeurs", team: "Notre équipe", partners: "Nos partenaires",
    },
    common: {
      loading: "Chargement...", error: "Une erreur est survenue", success: "Succès",
      cancel: "Annuler", save: "Enregistrer", delete: "Supprimer", edit: "Modifier",
      back: "Retour", next: "Suivant", previous: "Précédent", search: "Rechercher", filter: "Filtrer",
      clear: "Effacer", apply: "Appliquer", close: "Fermer", viewAll: "Voir tout",
      seeMore: "Voir plus", learnMore: "En savoir plus", readMore: "Lire la suite",
      showLess: "Voir moins", noResults: "Aucun résultat", tryAgain: "Réessayer",
      required: "Obligatoire", optional: "Optionnel", currency: "FCFA", yes: "Oui", no: "Non",
      slogan: "Fournitures scolaires et bureautiques en un seul clic",
    },
  },
  en: {
    nav: {
      easyClass: "Scoly", secondary: "News", secondaryDesc: "School and office news",
      university: "News", universityDesc: "School and office news", easyScolaire: "Shop",
      about: "About", contact: "Contact", login: "Login", signup: "Sign Up", logout: "Logout",
      cart: "Cart", myAccount: "My Account", myOrders: "My Orders", wishlist: "Wishlist", admin: "Admin",
    },
    hero: {
      badge: "Your partner for academic success",
      title1: "School and office", title2: "supplies in one click",
      subtitle: "Scoly supports you in your educational journey with quality supplies, delivered free throughout Ivory Coast.",
      cta: "Discover our products", demo: "View News",
      secondaryTitle: "Scoly News", secondaryDesc: "School and office news",
      universityTitle: "Scoly News", universityDesc: "School and office news",
      shopTitle: "Scoly Shop", shopDesc: "Books and school supplies",
    },
    spaces: {
      title: "Everything for your academic success",
      subtitle: "Scoly offers quality products and educational resources to support your journey.",
      secondary: {
        title: "Scoly Shop",
        description: "Find all your school and office supplies organized by level: Primary, Secondary, University and Office.",
        features: ["Complete catalog", "Competitive prices", "Wide range", "Customer reviews"],
        cta: "View shop",
      },
      university: {
        title: "Scoly News",
        description: "A space dedicated to educational news. Discover school success rates, exam results and educational information.",
        features: ["School success rates", "Exam results", "Educational news", "Official information"],
        cta: "Discover the news",
      },
      shop: {
        title: "Scoly Shop",
        description: "All your school and office books and supplies in one place. Delivery throughout Ivory Coast.",
        features: ["Official textbooks", "Quality supplies", "Competitive prices", "Fast delivery"],
        cta: "Visit the shop",
      },
    },
    features: {
      title: "Why choose Scoly?",
      subtitle: "A complete platform designed to meet all your school and office supply needs.",
      items: {
        resources: { title: "Quality resources", description: "Thousands of documents verified and validated by education professionals." },
        payment: { title: "Secure payment", description: "Pay easily with Mobile Money (Orange, MTN, Moov, Wave)." },
        access: { title: "Unlimited access", description: "Access your resources 24/7 from any device." },
        support: { title: "Responsive support", description: "A dedicated team to answer all your questions." },
        certificates: { title: "Certificates", description: "Earn completion certificates to enhance your journey." },
        updates: { title: "Regular updates", description: "New resources added every week." },
      },
    },
    payment: {
      badge: "Secure payment", title: "Pay easily with", titleHighlight: "Mobile Money",
      subtitle: "Make your purchases safely with the most popular mobile payment solutions in Ivory Coast.",
      benefits: ["Secure and encrypted transactions", "Instant SMS confirmation", "No hidden fees", "24/7 customer support"],
      cta: "Discover Scoly", amountLabel: "Amount to pay", secure: "100% secure payment",
    },
    stats: { students: "Active students", resources: "Available resources", schools: "Partner schools", satisfaction: "Satisfaction rate" },
    cta: {
      title: "Ready to transform your shopping experience?",
      subtitle: "Join thousands of customers who have already chosen Scoly for their supplies.",
      button: "Create my free account", trustedBy: "They trust us",
    },
    footer: {
      description: "The leading platform in Ivory Coast for school and office supplies.",
      quickLinks: "Quick Links", resources: "Resources", legal: "Legal", contact: "Contact",
      home: "Home", shop: "Shop", secondary: "Secondary", university: "University",
      blog: "Blog", faq: "FAQ", tutorials: "Tutorials", terms: "Terms of Use",
      privacy: "Privacy Policy", cookies: "Cookies", address: "Abidjan, Ivory Coast",
phone: "+225 07 02 58 44 57", email: "contact@scoly.ci",
      copyright: "All rights reserved.", madeWith: "Made with ❤️ in Ivory Coast",
    },
    auth: {
      loginTitle: "Login", signupTitle: "Create Account", email: "Email address",
      password: "Password", confirmPassword: "Confirm password", firstName: "First name",
      lastName: "Last name", phone: "Phone", rememberMe: "Remember me",
      forgotPassword: "Forgot password?", noAccount: "Don't have an account?",
      hasAccount: "Already have an account?", loginButton: "Sign in", signupButton: "Sign up",
      orContinueWith: "Or continue with", termsAgree: "I agree to the",
      terms: "terms of use", and: "and", privacy: "privacy policy",
    },
    shop: {
      title: "Scoly Shop",
      subtitle: "All your school and office books and supplies in one click",
      searchPlaceholder: "Search for a product...", categories: "Categories", allCategories: "All categories",
      sortBy: "Sort by", sortNewest: "Newest", sortPriceAsc: "Price: Low to High",
      sortPriceDesc: "Price: High to Low", sortPopular: "Popularity",
      addToCart: "Add to cart", addedToCart: "Added to cart",
      viewCart: "View cart", checkout: "Checkout", emptyCart: "Your cart is empty",
      continueShopping: "Continue shopping", subtotal: "Subtotal", shipping: "Shipping",
      total: "Total", proceedCheckout: "Proceed to checkout", inStock: "In stock",
      outOfStock: "Out of stock", quantity: "Quantity", remove: "Remove",
      productDetails: "Product details", relatedProducts: "Related products",
      reviews: "Reviews", writeReview: "Write a review", noReviews: "No reviews yet",
      freeShipping: "Free shipping", sale: "Sale", new: "New", featured: "Featured",
      priceLabel: "Price", originalPrice: "Original price", discount: "Discount",
    },
    resources: {
      title: "Educational Resources", subtitle: "Discover our collection of courses, exercises and documents",
      searchPlaceholder: "Search for a resource...", subjects: "Subjects", allSubjects: "All subjects",
      levels: "Levels", allLevels: "All levels", download: "Download", downloads: "downloads",
      free: "Free", premium: "Premium", preview: "Preview", fileType: "File type",
      fileSize: "Size", author: "Author", publishedOn: "Published on", noResults: "No resources found",
    },
    checkout: {
      title: "Checkout", billingInfo: "Billing Information", shippingInfo: "Shipping Information",
      paymentMethod: "Payment Method", orderSummary: "Order Summary", placeOrder: "Place Order",
      orderSuccess: "Order Confirmed!", orderSuccessMessage: "Your order has been successfully placed. You will receive an SMS confirmation.",
      orderNumber: "Order number", trackOrder: "Track my order", address: "Address",
      city: "City", postalCode: "Postal code", country: "Country",
      sameAsBilling: "Same as billing address", paymentNote: "You will receive an SMS to confirm the payment",
      selectPayment: "Select a payment method", orangeMoney: "Orange Money", mtnMoney: "MTN Mobile Money",
      moovMoney: "Moov Money", wave: "Wave",
    },
    account: {
      title: "My Account", profile: "Profile", orders: "Orders", wishlist: "Wishlist",
      settings: "Settings", editProfile: "Edit Profile", changePassword: "Change Password",
      currentPassword: "Current password", newPassword: "New password",
      orderHistory: "Order History", noOrders: "You don't have any orders yet",
      orderDate: "Date", orderStatus: "Status", orderTotal: "Total", viewDetails: "View details",
      statusPending: "Pending", statusConfirmed: "Confirmed", statusShipped: "Shipped",
      statusDelivered: "Delivered", statusCancelled: "Cancelled", emptyWishlist: "Your wishlist is empty",
      browseProducts: "Browse products", notifications: "Notifications",
      language: "Language", saveChanges: "Save changes",
    },
    contact: {
      title: "Contact Us", subtitle: "Have a question? Don't hesitate to contact us",
      name: "Full name", email: "Email", subject: "Subject", message: "Message",
      send: "Send", success: "Message sent!",
      successMessage: "We will get back to you as soon as possible.", info: "Our contact information",
    },
    about: {
      title: "About Scoly",
      subtitle: "Our mission is to facilitate access to school and office supplies",
      mission: "Our Mission",
      missionText: "Providing Ivorian families easy access to quality school and office supplies with free delivery and exemplary customer service.",
      vision: "Our Vision",
      visionText: "Becoming the leading platform for school and office supplies in Ivory Coast and West Africa.",
      values: "Our Values", team: "Our Team", partners: "Our Partners",
    },
    common: {
      loading: "Loading...", error: "An error occurred", success: "Success",
      cancel: "Cancel", save: "Save", delete: "Delete", edit: "Edit",
      back: "Back", next: "Next", previous: "Previous", search: "Search", filter: "Filter",
      clear: "Clear", apply: "Apply", close: "Close", viewAll: "View all",
      seeMore: "See more", learnMore: "Learn more", readMore: "Read more",
      showLess: "Show less", noResults: "No results", tryAgain: "Try again",
      required: "Required", optional: "Optional", currency: "FCFA", yes: "Yes", no: "No",
      slogan: "School and office supplies in one click",
    },
  },
  de: {
    nav: {
      easyClass: "Scoly", secondary: "Nachrichten", secondaryDesc: "Schul- und Büronachrichten",
      university: "Nachrichten", universityDesc: "Schul- und Büronachrichten", easyScolaire: "Shop",
      about: "Über uns", contact: "Kontakt", login: "Anmelden", signup: "Registrieren", logout: "Abmelden",
      cart: "Warenkorb", myAccount: "Mein Konto", myOrders: "Meine Bestellungen", wishlist: "Wunschliste", admin: "Verwaltung",
    },
    hero: {
      badge: "Ihr Partner für schulischen Erfolg",
      title1: "Schul- und Bürobedarf", title2: "mit einem Klick",
      subtitle: "Scoly begleitet Sie auf Ihrem Bildungsweg mit Qualitätsprodukten, kostenlos geliefert in der gesamten Elfenbeinküste.",
      cta: "Shop entdecken", demo: "Nachrichten ansehen",
      secondaryTitle: "Scoly Nachrichten", secondaryDesc: "Schul- und Büronachrichten",
      universityTitle: "Scoly Nachrichten", universityDesc: "Schul- und Büronachrichten",
      shopTitle: "Scoly Shop", shopDesc: "Bücher und Schulmaterialien",
    },
    spaces: {
      title: "Alles für Ihren schulischen und beruflichen Erfolg",
      subtitle: "Scoly bietet Qualitätsprodukte für Schul- und Bürobedarf.",
      secondary: {
        title: "Scoly Boutique",
        description: "Finden Sie alle Ihre Schul- und Büromaterialien nach Stufe geordnet: Grundschule, Sekundarstufe, Universität und Büro.",
        features: ["Vollständiger Katalog", "Wettbewerbsfähige Preise", "Großer Katalog", "Kundenbewertungen"],
        cta: "Boutique ansehen",
      },
      university: {
        title: "Scoly Nachrichten",
        description: "Ein Bereich für Bildungsnachrichten. Erfolgsquoten, Prüfungsergebnisse und Bildungsinformationen.",
        features: ["Schulerfolgsquoten", "Prüfungsergebnisse", "Bildungsnachrichten", "Offizielle Informationen"],
        cta: "Nachrichten entdecken",
      },
      shop: {
        title: "Scoly Shop",
        description: "Alle Ihre Schul- und Bürobücher und -materialien an einem Ort. Lieferung in die gesamte Elfenbeinküste.",
        features: ["Offizielle Schulbücher", "Qualitätsmaterialien", "Wettbewerbsfähige Preise", "Schnelle Lieferung"],
        cta: "Shop besuchen",
      },
    },
    features: {
      title: "Warum Scoly wählen?",
      subtitle: "Eine vollständige Plattform für alle Ihre Schul- und Bürobedarfsbedürfnisse.",
      items: {
        resources: { title: "Qualitätsressourcen", description: "Tausende von Dokumenten, die von Bildungsfachleuten überprüft und validiert wurden." },
        payment: { title: "Sichere Zahlung", description: "Einfach bezahlen mit Mobile Money (Orange, MTN, Moov, Wave)." },
        access: { title: "Unbegrenzter Zugang", description: "Greifen Sie rund um die Uhr von jedem Gerät auf Ihre Ressourcen zu." },
        support: { title: "Reaktiver Support", description: "Ein engagiertes Team, um alle Ihre Fragen zu beantworten." },
        certificates: { title: "Zertifikate", description: "Erhalten Sie Abschlusszertifikate, um Ihren Weg zu bereichern." },
        updates: { title: "Regelmäßige Updates", description: "Jede Woche werden neue Ressourcen hinzugefügt." },
      },
    },
    payment: {
      badge: "Sichere Zahlung", title: "Einfach bezahlen mit", titleHighlight: "Mobile Money",
      subtitle: "Tätigen Sie Ihre Einkäufe sicher mit den beliebtesten mobilen Zahlungslösungen in der Elfenbeinküste.",
      benefits: ["Sichere und verschlüsselte Transaktionen", "Sofortige SMS-Bestätigung", "Keine versteckten Gebühren", "24/7 Kundensupport"],
      cta: "Scoly entdecken", amountLabel: "Zu zahlender Betrag", secure: "100% sichere Zahlung",
    },
    stats: { students: "Aktive Studenten", resources: "Verfügbare Ressourcen", schools: "Partnerschulen", satisfaction: "Zufriedenheitsrate" },
    cta: {
      title: "Bereit, Ihr Einkaufserlebnis zu transformieren?",
      subtitle: "Schließen Sie sich Tausenden von Kunden an, die bereits Scoly für ihre Einkäufe gewählt haben.",
      button: "Kostenloses Konto erstellen", trustedBy: "Sie vertrauen uns",
    },
    footer: {
      description: "Die führende Plattform in der Elfenbeinküste für Schul- und Bürobedarf.",
      quickLinks: "Schnelllinks", resources: "Ressourcen", legal: "Rechtliches", contact: "Kontakt",
      home: "Startseite", shop: "Shop", secondary: "Sekundarstufe", university: "Universität",
      blog: "Blog", faq: "FAQ", tutorials: "Tutorials", terms: "Nutzungsbedingungen",
      privacy: "Datenschutz", cookies: "Cookies", address: "Abidjan, Elfenbeinküste",
phone: "+225 07 02 58 44 57", email: "contact@scoly.ci",
      copyright: "Alle Rechte vorbehalten.", madeWith: "Mit ❤️ in der Elfenbeinküste gemacht",
    },
    auth: {
      loginTitle: "Anmelden", signupTitle: "Konto erstellen", email: "E-Mail-Adresse",
      password: "Passwort", confirmPassword: "Passwort bestätigen", firstName: "Vorname",
      lastName: "Nachname", phone: "Telefon", rememberMe: "Angemeldet bleiben",
      forgotPassword: "Passwort vergessen?", noAccount: "Noch kein Konto?",
      hasAccount: "Bereits ein Konto?", loginButton: "Anmelden", signupButton: "Registrieren",
      orContinueWith: "Oder fortfahren mit", termsAgree: "Ich akzeptiere die",
      terms: "Nutzungsbedingungen", and: "und die", privacy: "Datenschutzrichtlinie",
    },
    shop: {
      title: "Scoly Shop",
      subtitle: "Alle Ihre Schul- und Bürobücher und -materialien mit einem Klick",
      searchPlaceholder: "Produkt suchen...", categories: "Kategorien", allCategories: "Alle Kategorien",
      sortBy: "Sortieren nach", sortNewest: "Neueste", sortPriceAsc: "Preis: Niedrig bis Hoch",
      sortPriceDesc: "Preis: Hoch bis Niedrig", sortPopular: "Beliebtheit",
      addToCart: "In den Warenkorb", addedToCart: "Zum Warenkorb hinzugefügt",
      viewCart: "Warenkorb anzeigen", checkout: "Zur Kasse", emptyCart: "Ihr Warenkorb ist leer",
      continueShopping: "Weiter einkaufen", subtotal: "Zwischensumme", shipping: "Versand",
      total: "Gesamt", proceedCheckout: "Zur Kasse gehen", inStock: "Auf Lager",
      outOfStock: "Ausverkauft", quantity: "Menge", remove: "Entfernen",
      productDetails: "Produktdetails", relatedProducts: "Ähnliche Produkte",
      reviews: "Bewertungen", writeReview: "Bewertung schreiben", noReviews: "Noch keine Bewertungen",
      freeShipping: "Kostenloser Versand", sale: "Angebot", new: "Neu", featured: "Empfohlen",
      priceLabel: "Preis", originalPrice: "Originalpreis", discount: "Rabatt",
    },
    resources: {
      title: "Bildungsressourcen", subtitle: "Entdecken Sie unsere Sammlung von Kursen, Übungen und Dokumenten",
      searchPlaceholder: "Ressource suchen...", subjects: "Fächer", allSubjects: "Alle Fächer",
      levels: "Stufen", allLevels: "Alle Stufen", download: "Herunterladen", downloads: "Downloads",
      free: "Kostenlos", premium: "Premium", preview: "Vorschau", fileType: "Dateityp",
      fileSize: "Größe", author: "Autor", publishedOn: "Veröffentlicht am", noResults: "Keine Ressourcen gefunden",
    },
    checkout: {
      title: "Kasse", billingInfo: "Rechnungsinformationen", shippingInfo: "Versandinformationen",
      paymentMethod: "Zahlungsmethode", orderSummary: "Bestellübersicht", placeOrder: "Bestellung aufgeben",
      orderSuccess: "Bestellung bestätigt!", orderSuccessMessage: "Ihre Bestellung wurde erfolgreich aufgegeben. Sie erhalten eine SMS-Bestätigung.",
      orderNumber: "Bestellnummer", trackOrder: "Bestellung verfolgen", address: "Adresse",
      city: "Stadt", postalCode: "Postleitzahl", country: "Land",
      sameAsBilling: "Gleiche Adresse wie Rechnung", paymentNote: "Sie erhalten eine SMS zur Bestätigung der Zahlung",
      selectPayment: "Zahlungsmethode auswählen", orangeMoney: "Orange Money", mtnMoney: "MTN Mobile Money",
      moovMoney: "Moov Money", wave: "Wave",
    },
    account: {
      title: "Mein Konto", profile: "Profil", orders: "Bestellungen", wishlist: "Wunschliste",
      settings: "Einstellungen", editProfile: "Profil bearbeiten", changePassword: "Passwort ändern",
      currentPassword: "Aktuelles Passwort", newPassword: "Neues Passwort",
      orderHistory: "Bestellverlauf", noOrders: "Sie haben noch keine Bestellungen",
      orderDate: "Datum", orderStatus: "Status", orderTotal: "Gesamt", viewDetails: "Details anzeigen",
      statusPending: "Ausstehend", statusConfirmed: "Bestätigt", statusShipped: "Versandt",
      statusDelivered: "Geliefert", statusCancelled: "Storniert", emptyWishlist: "Ihre Wunschliste ist leer",
      browseProducts: "Produkte durchsuchen", notifications: "Benachrichtigungen",
      language: "Sprache", saveChanges: "Änderungen speichern",
    },
    contact: {
      title: "Kontaktieren Sie uns", subtitle: "Eine Frage? Zögern Sie nicht, uns zu kontaktieren",
      name: "Vollständiger Name", email: "E-Mail", subject: "Betreff", message: "Nachricht",
      send: "Senden", success: "Nachricht gesendet!",
      successMessage: "Wir werden uns so schnell wie möglich bei Ihnen melden.", info: "Unsere Kontaktdaten",
    },
    about: {
      title: "Über Scoly",
      subtitle: "Unsere Mission ist es, den Zugang zu Schul- und Bürobedarf zu erleichtern",
      mission: "Unsere Mission",
      missionText: "Ivorischen Familien einen einfachen Zugang zu hochwertigen Schul- und Büromaterialien mit kostenloser Lieferung zu bieten.",
      vision: "Unsere Vision",
      visionText: "Die führende Plattform für Schul- und Bürobedarf in der Elfenbeinküste und Westafrika zu werden.",
      values: "Unsere Werte", team: "Unser Team", partners: "Unsere Partner",
    },
    common: {
      loading: "Laden...", error: "Ein Fehler ist aufgetreten", success: "Erfolg",
      cancel: "Abbrechen", save: "Speichern", delete: "Löschen", edit: "Bearbeiten",
      back: "Zurück", next: "Weiter", previous: "Zurück", search: "Suchen", filter: "Filtern",
      clear: "Löschen", apply: "Anwenden", close: "Schließen", viewAll: "Alle anzeigen",
      seeMore: "Mehr sehen", learnMore: "Mehr erfahren", readMore: "Weiterlesen",
      showLess: "Weniger anzeigen", noResults: "Keine Ergebnisse", tryAgain: "Erneut versuchen",
      required: "Erforderlich", optional: "Optional", currency: "FCFA", yes: "Ja", no: "Nein",
      slogan: "Schul- und Bürobedarf mit einem Klick",
    },
  },
  es: {
    nav: {
      easyClass: "Scoly", secondary: "Noticias", secondaryDesc: "Noticias escolares y de oficina",
      university: "Noticias", universityDesc: "Noticias escolares y de oficina", easyScolaire: "Tienda",
      about: "Acerca de", contact: "Contacto", login: "Iniciar sesión", signup: "Registrarse", logout: "Cerrar sesión",
      cart: "Carrito", myAccount: "Mi cuenta", myOrders: "Mis pedidos", wishlist: "Favoritos", admin: "Administración",
    },
    hero: {
      badge: "Tu socio para el éxito escolar",
      title1: "Materiales escolares", title2: "y de oficina en un solo clic",
      subtitle: "Scoly te acompaña en tu camino educativo con materiales de calidad, entregados gratis en toda Costa de Marfil.",
      cta: "Descubrir la tienda", demo: "Ver noticias",
      secondaryTitle: "Noticias Scoly", secondaryDesc: "Noticias escolares y de oficina",
      universityTitle: "Noticias Scoly", universityDesc: "Noticias escolares y de oficina",
      shopTitle: "Tienda Scoly", shopDesc: "Libros y materiales escolares",
    },
    spaces: {
      title: "Todo para tu éxito escolar y profesional",
      subtitle: "Scoly ofrece productos de calidad para tus necesidades escolares y de oficina.",
      secondary: {
        title: "Tienda Scoly",
        description: "Encuentra todos tus materiales escolares y de oficina organizados por nivel: Primaria, Secundaria, Universidad y Oficina.",
        features: ["Catálogo completo", "Precios competitivos", "Amplio catálogo", "Reseñas de clientes"],
        cta: "Ver tienda",
      },
      university: {
        title: "Noticias Scoly",
        description: "Un espacio dedicado a noticias educativas. Tasas de éxito, resultados de exámenes e información educativa.",
        features: ["Tasas de éxito escolar", "Resultados de exámenes", "Noticias educativas", "Información oficial"],
        cta: "Descubrir noticias",
      },
      shop: {
        title: "Tienda Scoly",
        description: "Todos tus libros y materiales escolares y de oficina en un solo lugar. Entrega en toda Costa de Marfil.",
        features: ["Libros de texto oficiales", "Materiales de calidad", "Precios competitivos", "Entrega rápida"],
        cta: "Visitar la tienda",
      },
    },
    features: {
      title: "¿Por qué elegir Scoly?",
      subtitle: "Una plataforma completa para todas tus necesidades de materiales escolares y de oficina.",
      items: {
        resources: { title: "Recursos de calidad", description: "Miles de documentos verificados y validados por profesionales de la educación." },
        payment: { title: "Pago seguro", description: "Paga fácilmente con Mobile Money (Orange, MTN, Moov, Wave)." },
        access: { title: "Acceso ilimitado", description: "Accede a tus recursos 24/7 desde cualquier dispositivo." },
        support: { title: "Soporte reactivo", description: "Un equipo dedicado para responder todas tus preguntas." },
        certificates: { title: "Certificados", description: "Obtén certificados de finalización para enriquecer tu trayectoria." },
        updates: { title: "Actualizaciones regulares", description: "Nuevos recursos añadidos cada semana." },
      },
    },
    payment: {
      badge: "Pago seguro", title: "Paga fácilmente con", titleHighlight: "Mobile Money",
      subtitle: "Realiza tus compras de forma segura con las soluciones de pago móvil más populares de Costa de Marfil.",
      benefits: ["Transacciones seguras y encriptadas", "Confirmación instantánea por SMS", "Sin cargos ocultos", "Soporte al cliente 24/7"],
      cta: "Descubrir Scoly", amountLabel: "Monto a pagar", secure: "Pago 100% seguro",
    },
    stats: { students: "Estudiantes activos", resources: "Recursos disponibles", schools: "Escuelas asociadas", satisfaction: "Tasa de satisfacción" },
    cta: {
      title: "¿Listo para transformar tu experiencia de compra?",
      subtitle: "Únete a miles de clientes que ya han elegido Scoly para sus compras.",
      button: "Crear mi cuenta gratis", trustedBy: "Confían en nosotros",
    },
    footer: {
      description: "La plataforma líder en Costa de Marfil para materiales escolares y de oficina.",
      quickLinks: "Enlaces rápidos", resources: "Recursos", legal: "Legal", contact: "Contacto",
      home: "Inicio", shop: "Tienda", secondary: "Secundaria", university: "Universidad",
      blog: "Blog", faq: "FAQ", tutorials: "Tutoriales", terms: "Términos de uso",
      privacy: "Política de privacidad", cookies: "Cookies", address: "Abidján, Costa de Marfil",
phone: "+225 07 02 58 44 57", email: "contact@scoly.ci",
      copyright: "Todos los derechos reservados.", madeWith: "Hecho con ❤️ en Costa de Marfil",
    },
    auth: {
      loginTitle: "Iniciar sesión", signupTitle: "Crear cuenta", email: "Correo electrónico",
      password: "Contraseña", confirmPassword: "Confirmar contraseña", firstName: "Nombre",
      lastName: "Apellido", phone: "Teléfono", rememberMe: "Recordarme",
      forgotPassword: "¿Olvidaste tu contraseña?", noAccount: "¿No tienes cuenta?",
      hasAccount: "¿Ya tienes cuenta?", loginButton: "Iniciar sesión", signupButton: "Registrarse",
      orContinueWith: "O continuar con", termsAgree: "Acepto los",
      terms: "términos de uso", and: "y la", privacy: "política de privacidad",
    },
    shop: {
      title: "Tienda Scoly",
      subtitle: "Todos tus libros y materiales escolares y de oficina en un clic",
      searchPlaceholder: "Buscar un producto...", categories: "Categorías", allCategories: "Todas las categorías",
      sortBy: "Ordenar por", sortNewest: "Más reciente", sortPriceAsc: "Precio: Bajo a Alto",
      sortPriceDesc: "Precio: Alto a Bajo", sortPopular: "Popularidad",
      addToCart: "Añadir al carrito", addedToCart: "Añadido al carrito",
      viewCart: "Ver carrito", checkout: "Pagar", emptyCart: "Tu carrito está vacío",
      continueShopping: "Continuar comprando", subtotal: "Subtotal", shipping: "Envío",
      total: "Total", proceedCheckout: "Proceder al pago", inStock: "En stock",
      outOfStock: "Agotado", quantity: "Cantidad", remove: "Eliminar",
      productDetails: "Detalles del producto", relatedProducts: "Productos relacionados",
      reviews: "Reseñas", writeReview: "Escribir una reseña", noReviews: "Sin reseñas aún",
      freeShipping: "Envío gratis", sale: "Oferta", new: "Nuevo", featured: "Destacado",
      priceLabel: "Precio", originalPrice: "Precio original", discount: "Descuento",
    },
    resources: {
      title: "Recursos educativos", subtitle: "Descubre nuestra colección de cursos, ejercicios y documentos",
      searchPlaceholder: "Buscar un recurso...", subjects: "Materias", allSubjects: "Todas las materias",
      levels: "Niveles", allLevels: "Todos los niveles", download: "Descargar", downloads: "descargas",
      free: "Gratis", premium: "Premium", preview: "Vista previa", fileType: "Tipo de archivo",
      fileSize: "Tamaño", author: "Autor", publishedOn: "Publicado el", noResults: "No se encontraron recursos",
    },
    checkout: {
      title: "Pago", billingInfo: "Información de facturación", shippingInfo: "Información de envío",
      paymentMethod: "Método de pago", orderSummary: "Resumen del pedido", placeOrder: "Realizar pedido",
      orderSuccess: "¡Pedido confirmado!", orderSuccessMessage: "Tu pedido ha sido realizado con éxito. Recibirás una confirmación por SMS.",
      orderNumber: "Número de pedido", trackOrder: "Seguir mi pedido", address: "Dirección",
      city: "Ciudad", postalCode: "Código postal", country: "País",
      sameAsBilling: "Misma dirección que facturación", paymentNote: "Recibirás un SMS para confirmar el pago",
      selectPayment: "Seleccionar método de pago", orangeMoney: "Orange Money", mtnMoney: "MTN Mobile Money",
      moovMoney: "Moov Money", wave: "Wave",
    },
    account: {
      title: "Mi cuenta", profile: "Perfil", orders: "Pedidos", wishlist: "Favoritos",
      settings: "Configuración", editProfile: "Editar perfil", changePassword: "Cambiar contraseña",
      currentPassword: "Contraseña actual", newPassword: "Nueva contraseña",
      orderHistory: "Historial de pedidos", noOrders: "Aún no tienes pedidos",
      orderDate: "Fecha", orderStatus: "Estado", orderTotal: "Total", viewDetails: "Ver detalles",
      statusPending: "Pendiente", statusConfirmed: "Confirmado", statusShipped: "Enviado",
      statusDelivered: "Entregado", statusCancelled: "Cancelado", emptyWishlist: "Tu lista de favoritos está vacía",
      browseProducts: "Explorar productos", notifications: "Notificaciones",
      language: "Idioma", saveChanges: "Guardar cambios",
    },
    contact: {
      title: "Contáctenos", subtitle: "¿Tienes una pregunta? No dudes en contactarnos",
      name: "Nombre completo", email: "Correo electrónico", subject: "Asunto", message: "Mensaje",
      send: "Enviar", success: "¡Mensaje enviado!",
      successMessage: "Le responderemos lo antes posible.", info: "Nuestros datos de contacto",
    },
    about: {
      title: "Acerca de Scoly",
      subtitle: "Nuestra misión es facilitar el acceso a materiales escolares y de oficina",
      mission: "Nuestra misión",
      missionText: "Ofrecer a las familias marfileñas un fácil acceso a materiales escolares y de oficina de calidad con entrega gratuita.",
      vision: "Nuestra visión",
      visionText: "Convertirse en la plataforma líder de materiales escolares y de oficina en Costa de Marfil y África Occidental.",
      values: "Nuestros valores", team: "Nuestro equipo", partners: "Nuestros socios",
    },
    common: {
      loading: "Cargando...", error: "Ocurrió un error", success: "Éxito",
      cancel: "Cancelar", save: "Guardar", delete: "Eliminar", edit: "Editar",
      back: "Volver", next: "Siguiente", previous: "Anterior", search: "Buscar", filter: "Filtrar",
      clear: "Limpiar", apply: "Aplicar", close: "Cerrar", viewAll: "Ver todo",
      seeMore: "Ver más", learnMore: "Saber más", readMore: "Leer más",
      showLess: "Ver menos", noResults: "Sin resultados", tryAgain: "Reintentar",
      required: "Obligatorio", optional: "Opcional", currency: "FCFA", yes: "Sí", no: "No",
      slogan: "Materiales escolares y de oficina en un solo clic",
    },
  },
};
